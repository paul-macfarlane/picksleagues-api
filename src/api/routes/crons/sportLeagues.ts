import { Router, Request, Response } from "express";
import { db } from "../../../db";
import {
  ESPN_SPORT_SLUGS,
  ESPN_LEAGUE_SLUGS,
  getESPNLeague,
} from "../../../lib/external/espn/leagues";
import { eq, and } from "drizzle-orm";
import * as schema from "../../../db/schema";
import { NodePgDatabase, NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import { PgTransaction } from "drizzle-orm/pg-core";
import { ExtractTablesWithRelations } from "drizzle-orm";

const router = Router();

export type DBOrTx =
  | NodePgDatabase<typeof schema>
  | PgTransaction<NodePgQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>;

async function getDataSourceByName(
  dbOrTx: DBOrTx,
  name: string,
): Promise<schema.DBDataSource | undefined> {
  const dataSource = await dbOrTx
    .select()
    .from(schema.dataSourcesTable)
    .where(eq(schema.dataSourcesTable.name, name))
    .limit(1);
  return dataSource[0];
}

async function getExternalSportLeagueBySourceAndId(
  dbOrTx: DBOrTx,
  sourceId: string,
  externalId: string,
): Promise<schema.DBExternalSportLeague | undefined> {
  const externalSportLeague = await dbOrTx
    .select()
    .from(schema.externalSportLeaguesTable)
    .where(
      and(
        eq(schema.externalSportLeaguesTable.dataSourceId, sourceId),
        eq(schema.externalSportLeaguesTable.externalId, externalId),
      ),
    )
    .limit(1);
  return externalSportLeague[0];
}

async function createSportLeague(
  dbOrTx: DBOrTx,
  params: schema.DBSportLeagueInsert,
): Promise<schema.DBSportLeague> {
  const sportLeague = await dbOrTx
    .insert(schema.sportsLeaguesTable)
    .values(params)
    .returning();
  return sportLeague[0];
}

async function createExternalSportLeague(
  dbOrTx: DBOrTx,
  params: schema.DBExternalSportLeagueInsert,
): Promise<schema.DBExternalSportLeague> {
  const externalSportLeague = await dbOrTx
    .insert(schema.externalSportLeaguesTable)
    .values(params)
    .returning();
  return externalSportLeague[0];
}

async function updateExternalSportLeague(
  dbOrTx: DBOrTx,
  dataSourceId: string,
  externalId: string,
  params: schema.DBExternalSportLeagueUpdate,
): Promise<schema.DBExternalSportLeague> {
  const externalSportLeague = await dbOrTx
    .update(schema.externalSportLeaguesTable)
    .set(params)
    .where(
      and(
        eq(schema.externalSportLeaguesTable.dataSourceId, dataSourceId),
        eq(schema.externalSportLeaguesTable.externalId, externalId),
      ),
    )
    .returning();
  return externalSportLeague[0];
}

async function updateSportLeague(
  dbOrTx: DBOrTx,
  sportLeagueId: string,
  params: schema.DBSportLeagueUpdate,
): Promise<schema.DBSportLeague> {
  const sportLeague = await dbOrTx
    .update(schema.sportsLeaguesTable)
    .set(params)
    .where(eq(schema.sportsLeaguesTable.id, sportLeagueId))
    .returning();
  return sportLeague[0];
}

const DESIRED_LEAGUES = [
  {
    sportSlug: ESPN_SPORT_SLUGS.FOOTBALL,
    leagueSlug: ESPN_LEAGUE_SLUGS.NFL,
  },
];

router.get("/", async (_req: Request, res: Response) => {
  console.log("Starting sport leagues cron");

  try {
    await db.transaction(async (tx) => {
      const dataSource = await getDataSourceByName(tx, "ESPN");
      if (!dataSource) {
        res.status(500).json({ message: "ESPN data source not found" });
        // Throw to rollback transaction and exit
        throw new Error("ESPN data source not found");
      }

      for (const league of DESIRED_LEAGUES) {
        const externalLeague = await getESPNLeague(
          league.sportSlug,
          league.leagueSlug,
        );
        if (!externalLeague) {
          console.error(
            `League with sport ${league.sportSlug} and league slug ${league.leagueSlug} not found, skipping`,
          );
          continue;
        }

        console.log(
          `Processing league for sport ${league.sportSlug} and league slug ${league.leagueSlug} with external id ${externalLeague.id} from ${dataSource.name}`,
        );

        const existingExternalLeague = await getExternalSportLeagueBySourceAndId(
          tx,
          dataSource.id,
          externalLeague.id,
        );
        if (existingExternalLeague) {
          console.log(
            `League ${league.sportSlug}:${league.leagueSlug} already exists, updating`,
          );
          await updateExternalSportLeague(tx, dataSource.id, externalLeague.id, {
            metadata: {
              slug: externalLeague.slug,
            },
          });
          if (!existingExternalLeague.sportLeagueId) {
            console.error(
              `League ${league.sportSlug}:${league.leagueSlug} has no sport league id, skipping`,
            );
            continue;
          }

          const updatedSportLeague = await updateSportLeague(tx, existingExternalLeague.sportLeagueId!, {
            name: externalLeague.displayName,
          });

          console.log(
            `Updated sport league ${JSON.stringify(updatedSportLeague)}`,
          );
        } else {
          console.log(
            `Creating new sport league with for sport ${league.sportSlug} and league slug ${league.leagueSlug} with name ${externalLeague.displayName}`,
          );

          const sportLeague = await createSportLeague(tx, {
            name: externalLeague.displayName,
          });
          await createExternalSportLeague(tx, {
            dataSourceId: dataSource.id,
            externalId: externalLeague.id,
            sportLeagueId: sportLeague.id,
            metadata: {
              slug: externalLeague.slug,
            },
          });

          console.log(`Created sport league ${JSON.stringify(sportLeague)}`);
        }
      }

      console.log("Sport leagues cron completed");
      res.status(200).json({ message: "success" });
    });
  } catch (err) {
    console.error("Error in sport leagues cron:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

export default router;

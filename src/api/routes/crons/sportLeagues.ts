import { Router, Request, Response } from "express";
import { db } from "../../../db";
import {
  ESPN_SPORT_SLUGS,
  ESPN_LEAGUE_SLUGS,
  getESPNLeague,
} from "../../../lib/external/espn/leagues";
import { eq, and } from "drizzle-orm";
import {
  externalSportLeaguesTable,
  dataSourcesTable,
  DBDataSource,
  DBExternalSportLeague,
  DBSportLeague,
  sportsLeaguesTable,
  DBExternalSportLeagueInsert,
  DBSportLeagueInsert,
  DBExternalSportLeagueUpdate,
  DBSportLeagueUpdate,
} from "../../../db/schema";

const router = Router();

async function getDataSourceByName(
  name: string,
): Promise<DBDataSource | undefined> {
  const dataSource = await db
    .select()
    .from(dataSourcesTable)
    .where(eq(dataSourcesTable.name, name))
    .limit(1);
  return dataSource[0];
}

async function getExternalSportLeagueBySourceAndId(
  sourceId: string,
  externalId: string,
): Promise<DBExternalSportLeague | undefined> {
  const externalSportLeague = await db
    .select()
    .from(externalSportLeaguesTable)
    .where(
      and(
        eq(externalSportLeaguesTable.dataSourceId, sourceId),
        eq(externalSportLeaguesTable.externalId, externalId),
      ),
    )
    .limit(1);
  return externalSportLeague[0];
}

async function createSportLeague(
  params: DBSportLeagueInsert,
): Promise<DBSportLeague> {
  const sportLeague = await db
    .insert(sportsLeaguesTable)
    .values(params)
    .returning();
  return sportLeague[0];
}

async function createExternalSportLeague(
  params: DBExternalSportLeagueInsert,
): Promise<DBExternalSportLeague> {
  const externalSportLeague = await db
    .insert(externalSportLeaguesTable)
    .values(params)
    .returning();
  return externalSportLeague[0];
}

async function updateExternalSportLeague(
  dataSourceId: string,
  externalId: string,
  params: DBExternalSportLeagueUpdate,
): Promise<DBExternalSportLeague> {
  const externalSportLeague = await db
    .update(externalSportLeaguesTable)
    .set(params)
    .where(
      and(
        eq(externalSportLeaguesTable.dataSourceId, dataSourceId),
        eq(externalSportLeaguesTable.externalId, externalId),
      ),
    )
    .returning();
  return externalSportLeague[0];
}

async function updateSportLeague(
  sportLeagueId: string,
  params: DBSportLeagueUpdate,
): Promise<DBSportLeague> {
  const sportLeague = await db
    .update(sportsLeaguesTable)
    .set(params)
    .where(eq(sportsLeaguesTable.id, sportLeagueId))
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

  const dataSource = await getDataSourceByName("ESPN");
  if (!dataSource) {
    res.status(500).json({ message: "ESPN data source not found" });
    return;
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
      dataSource.id,
      externalLeague.id,
    );
    if (existingExternalLeague) {
      console.log(
        `League ${league.sportSlug}:${league.leagueSlug} already exists, updating`,
      );
      await updateExternalSportLeague(dataSource.id, externalLeague.id, {
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

      const updatedSportLeague = await updateSportLeague(existingExternalLeague.sportLeagueId!, {
        name: externalLeague.displayName,
      });

      console.log(
        `Updated sport league ${JSON.stringify(updatedSportLeague)}`,
      );
    } else {
      console.log(
        `Creating new sport league with for sport ${league.sportSlug} and league slug ${league.leagueSlug} with name ${externalLeague.displayName}`,
      );

      const sportLeague = await createSportLeague({
        name: externalLeague.displayName,
      });
      await createExternalSportLeague({
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

export default router;

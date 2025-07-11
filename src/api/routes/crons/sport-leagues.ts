import { Router, Request, Response } from "express";
import { db } from "../../../db";
import { getESPNLeague } from "../../../lib/external/espn/api/leagues";
import { getDataSourceByName } from "../../../db/helpers/dataSources";
import {
  insertSportLeague,
  updateSportLeague,
} from "../../../db/helpers/sportLeagues";
import { ESPN_DESIRED_LEAGUES } from "../../../lib/external/espn/models/leagues/constants";
import { DATA_SOURCE_NAMES } from "../../../lib/models/dataSources/constants";
import {
  getExternalSportLeagueBySourceAndId,
  updateExternalSportLeague,
  insertExternalSportLeague,
} from "../../../db/helpers/externalSportLeagues";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  console.log("Starting sport leagues cron");

  try {
    await db.transaction(async (tx) => {
      const dataSource = await getDataSourceByName(tx, DATA_SOURCE_NAMES.ESPN);
      if (!dataSource) {
        res.status(500).json({ message: "ESPN data source not found" });
        // Throw to rollback transaction and exit
        throw new Error("ESPN data source not found");
      }

      for (const desiredLeague of ESPN_DESIRED_LEAGUES) {
        const espnLeague = await getESPNLeague(
          desiredLeague.sportSlug,
          desiredLeague.leagueSlug,
        );
        if (!espnLeague) {
          console.error(
            `League with sport ${desiredLeague.sportSlug} and league slug ${desiredLeague.leagueSlug} not found, skipping`,
          );
          continue;
        }

        console.log(
          `Processing league for sport ${desiredLeague.sportSlug} and league slug ${desiredLeague.leagueSlug} with external id ${espnLeague.id} from ${dataSource.name}`,
        );

        const existingExternalLeague =
          await getExternalSportLeagueBySourceAndId(
            tx,
            dataSource.id,
            espnLeague.id,
          );
        if (existingExternalLeague) {
          console.log(
            `League ${desiredLeague.sportSlug}:${desiredLeague.leagueSlug} already exists, updating`,
          );

          const updatedExternalSportLeague = await updateExternalSportLeague(
            tx,
            dataSource.id,
            espnLeague.id,
            {
              metadata: {
                slug: espnLeague.slug,
              },
            },
          );

          console.log(
            `Updated external sport league ${JSON.stringify(
              updatedExternalSportLeague,
            )}`,
          );

          const updatedSportLeague = await updateSportLeague(
            tx,
            existingExternalLeague.sportLeagueId!,
            {
              name: espnLeague.displayName,
            },
          );
          console.log(
            `Updated sport league ${JSON.stringify(updatedSportLeague)}`,
          );
        } else {
          console.log(
            `Creating new sport league with for sport ${desiredLeague.sportSlug} and league slug ${desiredLeague.leagueSlug} with name ${espnLeague.displayName}`,
          );

          const newSportLeague = await insertSportLeague(tx, {
            name: espnLeague.displayName,
          });

          console.log(`Created sport league ${JSON.stringify(newSportLeague)}`);

          const newExternalSportLeague = await insertExternalSportLeague(tx, {
            dataSourceId: dataSource.id,
            externalId: espnLeague.id,
            sportLeagueId: newSportLeague.id,
            metadata: {
              slug: espnLeague.slug,
            },
          });

          console.log(
            `Created sport league ${JSON.stringify(newExternalSportLeague)}`,
          );
        }
      }

      console.log("Sport leagues cron completed");
      res.status(200).json({ message: "success" });
    });
  } catch (err) {
    console.error("Error in sport leagues cron:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;

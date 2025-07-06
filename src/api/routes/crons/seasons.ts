import { Router, Request, Response } from "express";
import { db } from "../../../db";
import { getDataSourceByName } from "../../../db/helpers/dataSources";
import { getESPNLeagueSeasons } from "../../../lib/external/espn/seasons";
import { ESPN_DESIRED_LEAGUES } from "../../../lib/external/espn/shared";
import {
  getExternalSeasonBySourceAndId,
  insertExternalSeason,
  insertSeason,
  updateExternalSeason,
  updateSeason,
} from "../../../db/helpers/seasons";
import { getExternalSportLeagueBySourceAndMetadata } from "../../../db/helpers/sportLeagues";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  console.log("Starting seasons cron");

  try {
    await db.transaction(async (tx) => {
      const dataSource = await getDataSourceByName(tx, "ESPN");
      if (!dataSource) {
        throw new Error("ESPN data source not found");
      }

      for (const desiredLeague of ESPN_DESIRED_LEAGUES) {
        const espnLeagueSeasons = await getESPNLeagueSeasons(
          desiredLeague.sportSlug,
          desiredLeague.leagueSlug,
        );

        console.log(
          `Found ${espnLeagueSeasons.length} seasons for ${desiredLeague.sportSlug} ${desiredLeague.leagueSlug}`,
        );

        for (const externalSeason of espnLeagueSeasons) {
          const existingExternalSeason = await getExternalSeasonBySourceAndId(
            tx,
            dataSource.id,
            externalSeason.displayName,
          );
          if (existingExternalSeason) {
            console.log(
              `Updating season ${externalSeason.displayName} for ${desiredLeague.sportSlug} ${desiredLeague.leagueSlug}`,
            );

            const updatedSeason = await updateSeason(
              tx,
              existingExternalSeason.seasonId,
              {
                name: externalSeason.displayName,
                year: externalSeason.year.toString(),
                startDate: new Date(externalSeason.startDate),
                endDate: new Date(externalSeason.endDate),
              },
            );

            console.log(`Updated season ${JSON.stringify(updatedSeason)}`);

            const updatedExternalSeason = await updateExternalSeason(
              tx,
              dataSource.id,
              externalSeason.displayName,
              {
                seasonId: existingExternalSeason.seasonId,
                metadata: {
                  slug: externalSeason.displayName,
                },
              },
            );

            console.log(
              `Updated external season ${JSON.stringify(updatedExternalSeason)}`,
            );
          } else {
            console.log(
              `Inserting season ${externalSeason.displayName} for ${desiredLeague.sportSlug} ${desiredLeague.leagueSlug}`,
            );

            const externalSportLeague =
              await getExternalSportLeagueBySourceAndMetadata(
                tx,
                dataSource.id,
                {
                  slug: desiredLeague.leagueSlug,
                },
              );
            if (!externalSportLeague) {
              console.error(
                `Sport league not found for ${desiredLeague.sportSlug} ${desiredLeague.leagueSlug}`,
              );
              continue;
            }

            const insertedSeason = await insertSeason(tx, {
              name: externalSeason.displayName,
              year: externalSeason.year.toString(),
              startDate: new Date(externalSeason.startDate),
              endDate: new Date(externalSeason.endDate),
              sportLeagueId: externalSportLeague.sportLeagueId,
            });

            console.log(`Inserted season ${JSON.stringify(insertedSeason)}`);

            const insertedExternalSeason = await insertExternalSeason(tx, {
              dataSourceId: dataSource.id,
              externalId: externalSeason.displayName,
              seasonId: insertedSeason.id,
              metadata: {
                slug: externalSeason.displayName,
              },
            });

            console.log(
              `Inserted external season ${JSON.stringify(insertedExternalSeason)}`,
            );
          }
        }
      }
    });
  } catch (err) {
    console.error("Error in seasons cron:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal server error" });
    }
  }

  console.log("Seasons cron completed");

  res.status(200).json({ message: "success" });
});

export default router;

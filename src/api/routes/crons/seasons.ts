import { Router, Request, Response } from "express";
import { db } from "../../../db";
import { getDataSourceByName } from "../../../db/helpers/dataSources";
import {
  getESPNLeagueSeasons,
  getESPNWeeks,
} from "../../../lib/external/espn/seasons";
import {
  ESPN_DESIRED_LEAGUES,
  ESPN_SEASON_TYPES,
} from "../../../lib/external/espn/shared";
import {
  getExternalSeasonBySourceAndId,
  insertExternalSeason,
  insertSeason,
  updateExternalSeason,
  updateSeason,
} from "../../../db/helpers/seasons";
import { getExternalSportLeagueBySourceAndMetadata } from "../../../db/helpers/sportLeagues";
import {
  getExternalPhaseBySourceAndId,
  insertExternalPhase,
  insertPhase,
  updateExternalPhase,
} from "../../../db/helpers/phases";
import { updatePhase } from "../../../db/helpers/phases";
import { getPhaseTemplateBySportLeagueAndLabel } from "../../../db/helpers/phaseTemplates";

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

        let sportLeagueId: string | undefined;
        let seasonId: string | undefined;

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

            sportLeagueId = updatedSeason.sportLeagueId;
            seasonId = updatedSeason.id;

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

            sportLeagueId = insertedSeason.sportLeagueId;
            seasonId = insertedSeason.id;

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

          const regularSeasonESPNWeeks = await getESPNWeeks(
            desiredLeague.sportSlug,
            desiredLeague.leagueSlug,
            externalSeason.displayName,
            ESPN_SEASON_TYPES.REGULAR_SEASON,
          );

          console.log(
            `Found ${regularSeasonESPNWeeks.length} weeks for ${externalSeason.displayName}`,
          );

          const postSeasonESPNWeeks = await getESPNWeeks(
            desiredLeague.sportSlug,
            desiredLeague.leagueSlug,
            externalSeason.displayName,
            ESPN_SEASON_TYPES.POST_SEASON,
          );

          console.log(
            `Found ${postSeasonESPNWeeks.length} weeks for ${externalSeason.displayName}`,
          );

          const allESPNWeeks = [
            ...regularSeasonESPNWeeks,
            ...postSeasonESPNWeeks.filter((week) => week.text !== "Pro Bowl"),
          ];

          for (const [index, espnWeek] of allESPNWeeks.entries()) {
            const existingExternalPhase = await getExternalPhaseBySourceAndId(
              tx,
              dataSource.id,
              espnWeek.text,
            );
            if (existingExternalPhase) {
              console.log(
                `${espnWeek.text} already exists for ${externalSeason.displayName}`,
              );

              const updatedPhase = await updatePhase(
                tx,
                existingExternalPhase.phaseId,
                {
                  type: "week",
                  sequence: index + 1,
                  startDate: new Date(espnWeek.startDate),
                  endDate: new Date(espnWeek.endDate),
                },
              );

              console.log(`Updated phase ${JSON.stringify(updatedPhase)}`);

              const updatedExternalPhase = await updateExternalPhase(
                tx,
                dataSource.id,
                existingExternalPhase.externalId,
                {
                  phaseId: updatedPhase.id,
                },
              );

              console.log(
                `Updated external phase ${JSON.stringify(updatedExternalPhase)}`,
              );
            } else {
              console.log(
                `${espnWeek.text} does not exist for ${externalSeason.displayName}`,
              );

              const phaseTemplate = await getPhaseTemplateBySportLeagueAndLabel(
                tx,
                sportLeagueId,
                espnWeek.text,
              );
              if (!phaseTemplate) {
                console.error(`Phase template not found for ${espnWeek.text}`);
                continue;
              }

              const insertedPhase = await insertPhase(tx, {
                seasonId,
                phaseTemplateId: phaseTemplate.id,
                type: "week",
                sequence: index + 1,
                startDate: new Date(espnWeek.startDate),
                endDate: new Date(espnWeek.endDate),
              });

              console.log(`Inserted phase ${JSON.stringify(insertedPhase)}`);

              const insertedExternalPhase = await insertExternalPhase(tx, {
                dataSourceId: dataSource.id,
                externalId: espnWeek.text,
                phaseId: insertedPhase.id,
              });

              console.log(
                `Inserted external phase ${JSON.stringify(insertedExternalPhase)}`,
              );
            }
          }
        }
      }

      console.log("Seasons cron completed");
      res.status(200).json({ message: "success" });
    });
  } catch (err) {
    console.error("Error in seasons cron:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;

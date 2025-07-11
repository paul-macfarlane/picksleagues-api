import axios from "axios";
import {
  ESPN_LEAGUE_SLUGS,
  ESPN_SPORT_SLUGS,
} from "../models/leagues/constants";
import { ESPN_SEASON_TYPES } from "../models/seasons/constants";
import { ESPNRef } from "../models/shared/types";
import { ESPNWeek } from "../models/weeks/types";
import { getAllRefUrlsFromESPNListUrl } from "./shared";

async function getESPNWeeksRefs(
  sportSlug: ESPN_SPORT_SLUGS,
  leagueSlug: ESPN_LEAGUE_SLUGS,
  seasonId: string,
  type: ESPN_SEASON_TYPES,
): Promise<ESPNRef[]> {
  const weekRefs = await getAllRefUrlsFromESPNListUrl(
    `https://sports.core.api.espn.com/v2/sports/${sportSlug}/leagues/${leagueSlug}/seasons/${seasonId}/types/${type}/weeks?lang=en&region=us`,
  );

  return weekRefs.map((weekRef) => ({
    $ref: weekRef,
  }));
}

export async function getESPNWeeks(
  sportSlug: ESPN_SPORT_SLUGS,
  leagueSlug: ESPN_LEAGUE_SLUGS,
  seasonId: string,
  type: ESPN_SEASON_TYPES,
): Promise<ESPNWeek[]> {
  const weekRefs = await getESPNWeeksRefs(
    sportSlug,
    leagueSlug,
    seasonId,
    type,
  );

  const weeks: ESPNWeek[] = [];

  for (const weekRef of weekRefs) {
    const week = await axios.get<ESPNWeek>(
      weekRef.$ref.replace("http://", "https://"),
    );
    weeks.push(week.data);
  }

  return weeks;
}

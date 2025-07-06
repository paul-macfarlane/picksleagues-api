import axios from "axios";
import { ESPN_LEAGUE_SLUGS, ESPN_SPORT_SLUGS } from "./leagues";
import {
  ESPN_SEASON_TYPES,
  ESPNRef,
  ESPNRefList,
  getAllRefUrlsFromESPNListUrl,
} from "./shared";

type ESPNSeasonWeek = {
  $ref: string;
  number: number;
  startDate: string;
  endDate: string;
  text: string;
  rankings: ESPNRef;
  events: ESPNRef;
  talentpicks: ESPNRef;
};

type ESPNSeasonType = {
  $ref: string;
  id: string;
  type: number;
  name: string;
  abbreviation: string;
  year: number;
  startDate: string;
  endDate: string;
  hasGroups: boolean;
  hasStandings: boolean;
  hasLegs: boolean;
  groups: ESPNRef;
  week?: ESPNSeasonWeek;
  weeks: ESPNRef;
  corrections: ESPNRef;
  leaders: ESPNRef;
  slug: string;
};

type ESPNSeasonTypeItem = ESPNSeasonType & {
  week?: ESPNSeasonWeek;
};

type ESPNSeasonTypes = {
  $ref: string;
  count: number;
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  items: ESPNSeasonTypeItem[];
};

export type ESPNSeason = {
  $ref: string;
  year: number;
  startDate: string;
  endDate: string;
  displayName: string;
  type: ESPNSeasonType;
  types: ESPNSeasonTypes;
  rankings: ESPNRef;
  coaches: ESPNRef;
  athletes: ESPNRef;
  futures: ESPNRef;
};

async function getESPNSportLeagueSeasonsRefs(
  sportSlug: ESPN_SPORT_SLUGS,
  leagueSlug: ESPN_LEAGUE_SLUGS,
): Promise<ESPNRef[]> {
  // no need to paginate here because there are only 2 seasons at most that we care about
  const response = await axios.get<ESPNRefList>(
    `https://sports.core.api.espn.com/v2/sports/${sportSlug}/leagues/${leagueSlug}/seasons?lang=en&region=us`,
  );

  return response.data.items;
}

export async function getESPNLeagueSeasons(
  sportSlug: ESPN_SPORT_SLUGS,
  leagueSlug: ESPN_LEAGUE_SLUGS,
): Promise<ESPNSeason[]> {
  const now = new Date();
  const seasonRefs = await getESPNSportLeagueSeasonsRefs(sportSlug, leagueSlug);
  if (!seasonRefs.length) {
    return [];
  }

  const latestSeason = await axios.get<ESPNSeason>(
    seasonRefs[0].$ref.replace("http://", "https://"),
  );
  if (
    new Date(latestSeason.data.startDate) < now &&
    new Date(latestSeason.data.endDate) > now
  ) {
    return [latestSeason.data];
  }

  // If the first fetched season is not active (the future season)
  // the following season retrieved should be because they come in reverse chronological order
  const secondLatestSeason = await axios.get<ESPNSeason>(
    seasonRefs[1].$ref.replace("http://", "https://"),
  );
  if (new Date(secondLatestSeason.data.endDate) < now) {
    // if the second-latest season already passed only return the latest one
    return [latestSeason.data];
  }

  return [latestSeason.data, secondLatestSeason.data];
}

export type ESPNWeek = {
  $ref: string;
  number: number;
  startDate: string;
  endDate: string;
  text: string;
  rankings: ESPNRef;
  events: ESPNRef;
};

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

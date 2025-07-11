import axios from "axios";
import {
  ESPN_LEAGUE_SLUGS,
  ESPN_SPORT_SLUGS,
} from "../models/leagues/constants";
import { ESPNRef, ESPNRefList } from "../models/shared/types";
import { ESPNSeason } from "../models/seasons/types";

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

import axios from "axios";
import {
  ESPN_LEAGUE_SLUGS,
  ESPN_SPORT_SLUGS,
} from "../models/leagues/constants";
import { ESPNLeague } from "../models/leagues/types";

export async function getESPNLeague(
  sportSlug: ESPN_SPORT_SLUGS,
  leagueSlug: ESPN_LEAGUE_SLUGS,
): Promise<ESPNLeague> {
  const response = await axios.get<ESPNLeague>(
    `https://sports.core.api.espn.com/v2/sports/${sportSlug}/leagues/${leagueSlug}?lang=en&region=us`,
  );

  return response.data;
}

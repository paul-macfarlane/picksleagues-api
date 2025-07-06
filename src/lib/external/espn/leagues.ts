import axios from "axios";
import { ESPNRef, ESPNLink, ESPNLogo, ESPNGender } from "./shared";
import { ESPNSeason } from "./seasons";

export type ESPNLeague = {
  $ref: string;
  id: string;
  guid: string;
  uid: string;
  name: string;
  displayName: string;
  abbreviation: string;
  shortName: string;
  slug: string;
  isTournament: boolean;
  season: ESPNSeason;
  seasons: ESPNRef;
  franchises: ESPNRef;
  teams: ESPNRef;
  group: ESPNRef;
  groups: ESPNRef;
  events: ESPNRef;
  notes: ESPNRef;
  rankings: ESPNRef;
  draft: ESPNRef;
  links: ESPNLink[];
  logos: ESPNLogo[];
  athletes: ESPNRef;
  freeAgents: ESPNRef;
  calendar: ESPNRef;
  transactions: ESPNRef;
  talentPicks: ESPNRef;
  leaders: ESPNRef;
  gender: ESPNGender;
};

export enum ESPN_SPORT_SLUGS {
  FOOTBALL = "football",
}

export enum ESPN_LEAGUE_SLUGS {
  NFL = "nfl",
}

export async function getESPNLeague(
  sportSlug: ESPN_SPORT_SLUGS,
  leagueSlug: ESPN_LEAGUE_SLUGS,
): Promise<ESPNLeague> {
  const response = await axios.get<ESPNLeague>(
    `https://sports.core.api.espn.com/v2/sports/${sportSlug}/leagues/${leagueSlug}?lang=en&region=us`,
  );

  return response.data;
}

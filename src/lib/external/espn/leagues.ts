import axios from "axios";
import { ESPNRef, ESPNLink, ESPNLogo, ESPNGender } from "./shared";

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
    leaders: ESPNRef
    gender: ESPNGender;
}

export type ESPNSeason = {
    $ref: string;
    year: number;
    startDate: string;
    endDate: string;
    displayName: string;
    type: ESPNSeasonType;
    types: ESPNSeasonTypeList;
    rankings: ESPNRef;
    coaches: ESPNRef;
    athletes: ESPNRef;
    futures: ESPNRef;
    leaders: ESPNRef;
};

export type ESPNSeasonType = {
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
    weeks: ESPNRef;
    corrections?: ESPNRef;
    leaders?: ESPNRef;
    slug: string;
};

export type ESPNSeasonTypeList = {
    $ref: string;
    count: number;
    pageIndex: number;
    pageSize: number;
    pageCount: number;
    items: ESPNSeasonType[];
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

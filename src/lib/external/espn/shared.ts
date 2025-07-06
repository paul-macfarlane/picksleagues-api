import axios from "axios";
import { ESPN_LEAGUE_SLUGS, ESPN_SPORT_SLUGS } from "./leagues";

export type ESPNRef = {
  $ref: string;
};

export type ESPNRefList = {
  count: number;
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  items: ESPNRef[];
};

export type ESPNLink = {
  language: string;
  rel: string[];
  href: string;
  text: string;
  shortText: string;
  isExternal: boolean;
  isPremium: boolean;
};

export type ESPNLogo = {
  href: string;
  width: number;
  height: number;
  alt: string;
  rel: string[];
  lastUpdated: string;
};

export type ESPNGender = "MALE" | "FEMALE" | "UNKNOWN";

export enum REGIONS {
  US = "us",
}

export enum LANGUAGES {
  EN = "en",
}

export async function getAllRefUrlsFromESPNListUrl(
  listUrl: string,
): Promise<string[]> {
  let response = await axios.get<ESPNRefList>(`${listUrl}&page=${1}`);

  let refs = response.data.items.map((item) => item.$ref);
  while (response.data.pageIndex < response.data.pageCount) {
    response = await axios.get<ESPNRefList>(
      `${listUrl.replace("http://", "https://")}&page=${
        response.data.pageIndex + 1
      }`,
    );

    refs = [...refs, ...response.data.items.map((item) => item.$ref)];
  }

  return refs;
}

export const ESPN_DESIRED_LEAGUES = [
  {
    sportSlug: ESPN_SPORT_SLUGS.FOOTBALL,
    leagueSlug: ESPN_LEAGUE_SLUGS.NFL,
  },
];

export enum ESPN_SEASON_TYPES {
  PRE_SEASON = 1,
  REGULAR_SEASON = 2,
  POST_SEASON = 3,
  OFF_SEASON = 4,
}

export const ESPN_DESIRED_SEASON_TYPES = [
  ESPN_SEASON_TYPES.REGULAR_SEASON,
  ESPN_SEASON_TYPES.POST_SEASON,
];

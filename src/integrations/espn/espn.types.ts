// ESPN Shared
export enum ESPNGender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  UNKNOWN = "UNKNOWN",
}

export enum REGIONS {
  US = "us",
}

export enum LANGUAGES {
  EN = "en",
}

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

// ESPN Leagues
export enum ESPN_SPORT_SLUGS {
  FOOTBALL = "football",
}

export enum ESPN_LEAGUE_SLUGS {
  NFL = "nfl",
}

export const ESPN_DESIRED_LEAGUES = [
  {
    sportSlug: ESPN_SPORT_SLUGS.FOOTBALL,
    leagueSlug: ESPN_LEAGUE_SLUGS.NFL,
  },
];

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

// ESPN Seasons
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

export type ESPNSeasonWeek = {
  $ref: string;
  number: number;
  startDate: string;
  endDate: string;
  text: string;
  rankings: ESPNRef;
  events: ESPNRef;
  talentpicks: ESPNRef;
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
  week?: ESPNSeasonWeek;
  weeks: ESPNRef;
  corrections: ESPNRef;
  leaders: ESPNRef;
  slug: string;
};

type ESPNSeasonTypeItem = ESPNSeasonType & {
  week?: ESPNSeasonWeek;
};

export type ESPNSeasonTypes = {
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

// ESPN Weeks
export type ESPNWeek = {
  $ref: string;
  number: number;
  startDate: string;
  endDate: string;
  text: string;
  rankings: ESPNRef;
  events: ESPNRef;
};

export type ESPNTeam = {
  $ref?: string;
  id: string;
  guid: string;
  uid: string;
  alternateIds?: {
    sdr: string;
  };
  slug: string;
  location: string;
  name: string;
  nickname: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  color: string;
  alternateColor: string;
  isActive: boolean;
  isAllStar: boolean;
  logos: ESPNLogo[];
  record?: ESPNRef;
  oddsRecords?: ESPNRef;
  athletes?: ESPNRef;
  venue?: ESPNVenue;
  groups?: ESPNRef;
  ranks?: ESPNRef;
  statistics?: ESPNRef;
  leaders?: ESPNRef;
  links: ESPNLink[];
  injuries?: ESPNRef;
  notes?: ESPNRef;
  againstTheSpreadRecords?: ESPNRef;
  franchise?: ESPNRef;
  depthCharts?: ESPNRef;
  projection?: ESPNRef;
  events?: ESPNRef;
  transactions?: ESPNRef;
  coaches?: ESPNRef;
};

export type ESPNVenue = {
  id: string;
  fullName: string;
  address: {
    city: string;
    state: string;
    zipCode: string;
  };
  grass: boolean;
  indoor: boolean;
  images?: ESPNLogo[];
};

export type ESPNEvent = {
  $ref: string;
  id: string;
  uid: string;
  date: string;
  name: string;
  shortName: string;
  season: ESPNRef;
  seasonType: ESPNRef;
  week: ESPNRef;
  timeValid: boolean;
  competitions: ESPNCompetition[];
};

export type ESPNCompetition = {
  $ref: string;
  id: string;
  guid: string;
  uid: string;
  date: string;
  attendance: number;
  type: CompetitionType;
  timeValid: boolean;
  dateValid: boolean;
  neutralSite: boolean;
  divisionCompetition: boolean;
  conferenceCompetition: boolean;
  previewAvailable: boolean;
  recapAvailable: boolean;
  boxscoreAvailable: boolean;
  lineupAvailable: boolean;
  gamecastAvailable: boolean;
  playByPlayAvailable: boolean;
  conversationAvailable: boolean;
  commentaryAvailable: boolean;
  pickcenterAvailable: boolean;
  summaryAvailable: boolean;
  liveAvailable: boolean;
  ticketsAvailable: boolean;
  shotChartAvailable: boolean;
  timeoutsAvailable: boolean;
  possessionArrowAvailable: boolean;
  onWatchESPN: boolean;
  recent: boolean;
  bracketAvailable: boolean;
  wallclockAvailable: boolean;
  gameSource: Source;
  boxscoreSource: Source;
  playByPlaySource: Source;
  linescoreSource: Source;
  statsSource: Source;
  venue: ESPNVenue;
  competitors: ESPNCompetitor[];
  notes: unknown[]; // Define if needed
  situation: ESPNRef;
  status: ESPNRef;
  odds: ESPNRef;
  broadcasts: ESPNRef;
  officials: ESPNRef;
  details: ESPNRef;
  leaders: ESPNRef;
  links: ESPNLink[];
};

export type CompetitionType = {
  id: string;
  text: string;
  abbreviation: string;
  slug: string;
  type: string;
};

export type Source = {
  id: string;
  description: string;
  state: string;
};

export type ESPNCompetitor = {
  $ref: string;
  id: string;
  uid: string;
  type: string;
  order: number;
  homeAway: string;
  winner: boolean;
  team: ESPNRef;
  score: ESPNRef;
  linescores: ESPNRef;
  roster: ESPNRef;
  statistics: ESPNRef;
  leaders: ESPNRef;
  record: ESPNRef;
};

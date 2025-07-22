import { injectable } from "inversify";
import axios from "axios";
import {
  ESPN_LEAGUE_SLUGS,
  ESPN_SPORT_SLUGS,
  ESPNLeague,
  ESPNRef,
  ESPNRefList,
  ESPNSeason,
  ESPN_SEASON_TYPES,
  ESPNWeek,
  ESPNTeam,
} from "./espn.types";

@injectable()
export class EspnService {
  async getESPNLeague(
    sportSlug: ESPN_SPORT_SLUGS,
    leagueSlug: ESPN_LEAGUE_SLUGS,
  ): Promise<ESPNLeague> {
    const response = await axios.get<ESPNLeague>(
      `https://sports.core.api.espn.com/v2/sports/${sportSlug}/leagues/${leagueSlug}?lang=en&region=us`,
    );

    return response.data;
  }

  private async getESPNSportLeagueSeasonsRefs(
    sportSlug: ESPN_SPORT_SLUGS,
    leagueSlug: ESPN_LEAGUE_SLUGS,
  ): Promise<ESPNRef[]> {
    // no need to paginate here because there are only 2 seasons at most that we care about
    const response = await axios.get<ESPNRefList>(
      `https://sports.core.api.espn.com/v2/sports/${sportSlug}/leagues/${leagueSlug}/seasons?lang=en&region=us`,
    );

    return response.data.items;
  }

  async getESPNLeagueSeasons(
    sportSlug: ESPN_SPORT_SLUGS,
    leagueSlug: ESPN_LEAGUE_SLUGS,
  ): Promise<ESPNSeason[]> {
    const now = new Date();
    const seasonRefs = await this.getESPNSportLeagueSeasonsRefs(
      sportSlug,
      leagueSlug,
    );
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

  private async getAllRefUrlsFromESPNListUrl(
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

  private async getESPNWeeksRefs(
    sportSlug: ESPN_SPORT_SLUGS,
    leagueSlug: ESPN_LEAGUE_SLUGS,
    seasonId: string,
    type: ESPN_SEASON_TYPES,
  ): Promise<ESPNRef[]> {
    const weekRefs = await this.getAllRefUrlsFromESPNListUrl(
      `https://sports.core.api.espn.com/v2/sports/${sportSlug}/leagues/${leagueSlug}/seasons/${seasonId}/types/${type}/weeks?lang=en&region=us`,
    );

    return weekRefs.map((weekRef) => ({
      $ref: weekRef,
    }));
  }

  async getESPNWeeks(
    sportSlug: ESPN_SPORT_SLUGS,
    leagueSlug: ESPN_LEAGUE_SLUGS,
    seasonId: string,
    type: ESPN_SEASON_TYPES,
  ): Promise<ESPNWeek[]> {
    const weekRefs = await this.getESPNWeeksRefs(
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

  async getESPNSportLeagueTeams(
    sportSlug: ESPN_SPORT_SLUGS,
    leagueSlug: ESPN_LEAGUE_SLUGS,
    seasonDisplayName: string,
  ): Promise<ESPNTeam[]> {
    const teamRefs = await this.getAllRefUrlsFromESPNListUrl(
      `https://sports.core.api.espn.com/v2/sports/${sportSlug}/leagues/${leagueSlug}/seasons/${seasonDisplayName}/teams?lang=en&region=us`,
    );

    const teams: ESPNTeam[] = [];
    for (const teamRef of teamRefs) {
      const teamResponse = await axios.get<ESPNTeam>(
        teamRef.replace("http://", "https://"),
      );
      teams.push(teamResponse.data);
    }

    return teams;
  }
}

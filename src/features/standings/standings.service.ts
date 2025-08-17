import { injectable, inject } from "inversify";
import { db, DBOrTx } from "../../db/index.js";
import { PICK_RESULTS, UnassessedPick } from "../picks/picks.types.js";
import { StandingsQueryService } from "./standings.query.service.js";
import { StandingsMutationService } from "./standings.mutation.service.js";
import { PicksQueryService } from "../picks/picks.query.service.js";
import { TYPES } from "../../lib/inversify.types.js";
import {
  PickEmStandingsMetadata,
  PickEmStandingsMetadataSchema,
  DBStandings,
  STANDINGS_INCLUDES,
  PopulatedStandings,
  StandingsIncludesSchema,
} from "./standings.types.js";
import { PicksMutationService } from "../picks/picks.mutation.service.js";
import { LeaguesQueryService } from "../leagues/leagues.query.service.js";
import { LeagueMembersQueryService } from "../leagueMembers/leagueMembers.query.service.js";
import { SeasonsUtilService } from "../seasons/seasons.util.service.js";
import { LeagueTypesQueryService } from "../leagueTypes/leagueTypes.query.service.js";
import { ProfilesQueryService } from "../profiles/profiles.query.service.js";
import z from "zod";
import {
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from "../../lib/errors.js";

@injectable()
export class StandingsService {
  constructor(
    @inject(TYPES.StandingsQueryService)
    private standingsQueryService: StandingsQueryService,
    @inject(TYPES.StandingsMutationService)
    private standingsMutationService: StandingsMutationService,
    @inject(TYPES.PicksQueryService)
    private picksQueryService: PicksQueryService,
    @inject(TYPES.PicksMutationService)
    private picksMutationService: PicksMutationService,
    @inject(TYPES.LeaguesQueryService)
    private leaguesQueryService: LeaguesQueryService,
    @inject(TYPES.LeagueMembersQueryService)
    private leagueMembersQueryService: LeagueMembersQueryService,
    @inject(TYPES.SeasonsUtilService)
    private seasonsUtilService: SeasonsUtilService,
    @inject(TYPES.LeagueTypesQueryService)
    private leagueTypesQueryService: LeagueTypesQueryService,
    @inject(TYPES.ProfilesQueryService)
    private profilesQueryService: ProfilesQueryService,
  ) {}

  async calculateStandingsForLeagues(leagueIds: string[]): Promise<void> {
    console.log(
      `Processing ${leagueIds.length} leagues for standings calculation`,
    );

    for (const leagueId of leagueIds) {
      try {
        await this.calculateStandingsForLeague(leagueId);
      } catch (error) {
        console.error(
          `Error calculating standings for league ${leagueId}:`,
          error,
        );
        // Continue with other leagues even if one fails
      }
    }
  }

  async calculateStandingsForAllLeagues(): Promise<void> {
    const allLeagues = await this.leaguesQueryService.listAll();
    const batchSize = 50;
    let processedCount = 0;

    for (let i = 0; i < allLeagues.length; i += batchSize) {
      const batch = allLeagues.slice(i, i + batchSize);
      const leagueIds = batch.map((league) => league.id);

      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1}: ${leagueIds.length} leagues`,
      );

      await this.calculateStandingsForLeagues(leagueIds);
      processedCount += leagueIds.length;

      console.log(
        `Completed batch ${Math.floor(i / batchSize) + 1}. Total processed: ${processedCount}/${allLeagues.length}`,
      );
    }
  }

  private async _populateStandings(
    standings: DBStandings[],
    includes?: z.infer<typeof StandingsIncludesSchema>,
    dbOrTx?: DBOrTx,
  ): Promise<PopulatedStandings[]> {
    const profiles = await this.profilesQueryService.listByUserIds(
      standings.map((standing) => standing.userId),
      dbOrTx,
    );

    if (includes?.include?.includes(STANDINGS_INCLUDES.PROFILE)) {
      return standings.map((standing) => {
        const profile = profiles.find(
          (profile) => profile.userId === standing.userId,
        );
        return { ...standing, profile };
      });
    }

    return standings;
  }

  async getCurrentStandings(
    leagueId: string,
    userId: string,
    includes?: z.infer<typeof StandingsIncludesSchema>,
  ): Promise<PopulatedStandings[]> {
    const member = await this.leagueMembersQueryService.findByLeagueAndUserId(
      leagueId,
      userId,
    );
    if (!member) {
      throw new ForbiddenError("User is not a member of this league");
    }

    const league = await this.leaguesQueryService.findById(leagueId);
    if (!league) {
      throw new NotFoundError("League not found");
    }

    const leagueType = await this.leagueTypesQueryService.findById(
      league.leagueTypeId,
    );
    if (!leagueType) {
      throw new NotFoundError("League type not found");
    }

    const season =
      await this.seasonsUtilService.findCurrentOrLatestSeasonForSportLeagueId(
        leagueType.sportLeagueId,
      );
    if (!season) {
      throw new NotFoundError("No current or latest season found");
    }

    const standings = await this.standingsQueryService.findByLeagueSeason(
      leagueId,
      season.id,
    );

    const populatedStandings = await this._populateStandings(
      standings,
      includes,
    );

    return populatedStandings;
  }

  async getCurrentStandingsForUser(
    leagueId: string,
    userId: string,
    includes?: z.infer<typeof StandingsIncludesSchema>,
  ): Promise<PopulatedStandings> {
    const member = await this.leagueMembersQueryService.findByLeagueAndUserId(
      leagueId,
      userId,
    );
    if (!member) {
      throw new ForbiddenError("User is not a member of this league");
    }

    const league = await this.leaguesQueryService.findById(leagueId);
    if (!league) {
      throw new NotFoundError("League not found");
    }

    const leagueType = await this.leagueTypesQueryService.findById(
      league.leagueTypeId,
    );
    if (!leagueType) {
      throw new NotFoundError("League type not found");
    }

    const season =
      await this.seasonsUtilService.findCurrentOrLatestSeasonForSportLeagueId(
        leagueType.sportLeagueId,
      );
    if (!season) {
      throw new NotFoundError("No current or latest season found");
    }

    const standings = await this.standingsQueryService.findByUserLeagueSeason(
      userId,
      leagueId,
      season.id,
    );
    if (!standings) {
      throw new NotFoundError("No standings found for user");
    }

    const [populatedStandings] = await this._populateStandings(
      [standings],
      includes,
    );

    return populatedStandings;
  }

  private async calculateStandingsForLeague(leagueId: string): Promise<void> {
    return db.transaction(async (tx) => {
      const unassessedPicks =
        await this.picksQueryService.findUnassessedPicksForLeague(leagueId, tx);
      if (unassessedPicks.length === 0) {
        console.log(`No unassessed picks for league ${leagueId}`);
        return;
      }

      const picksByUser = this.groupPicksByUser(unassessedPicks);

      // Process picks for all users (filtering is now done at database level)
      for (const [userId, picks] of picksByUser) {
        await this.processUserPicks(userId, leagueId, picks, tx);
      }

      // Get the season ID from the first pick
      const seasonId = unassessedPicks[0].seasonId;

      // Get all standings for this league and season
      const standings = await this.standingsQueryService.findByLeagueSeason(
        leagueId,
        seasonId,
        tx,
      );

      // Sort standings by points in descending order
      const sortedStandings = standings.sort((a, b) => b.points - a.points);

      // Update ranks
      let currentRank = 1;
      let currentPoints = sortedStandings[0]?.points ?? 0;
      let sameRankCount = 0;

      for (let i = 0; i < sortedStandings.length; i++) {
        const standing = sortedStandings[i];

        // If points are different from previous, update rank
        if (standing.points < currentPoints) {
          currentRank += sameRankCount;
          currentPoints = standing.points;
          sameRankCount = 1;
        } else {
          sameRankCount++;
        }

        // Update rank in database
        await this.standingsMutationService.update(
          standing.userId,
          leagueId,
          seasonId,
          { rank: currentRank },
          tx,
        );
      }
    });
  }

  private async processUserPicks(
    userId: string,
    leagueId: string,
    picks: UnassessedPick[],
    dbOrTx: DBOrTx,
  ): Promise<void> {
    // Get the season ID from the first pick (all picks in a league should be from the same season)
    const seasonId = picks[0].seasonId;

    // Get current standings or create new
    let standings = await this.standingsQueryService.findByUserLeagueSeason(
      userId,
      leagueId,
      seasonId,
      dbOrTx,
    );

    let existingPoints = 0;
    let existingStandingsMetadata: PickEmStandingsMetadata = {
      wins: 0,
      losses: 0,
      pushes: 0,
    };

    if (!standings) {
      // Create new standings record
      await this.standingsMutationService.create(
        {
          userId,
          leagueId,
          seasonId,
          points: 0,
          metadata: { wins: 0, losses: 0, pushes: 0 },
        },
        dbOrTx,
      );
    } else {
      standings = await this.standingsQueryService.findByUserLeagueSeason(
        userId,
        leagueId,
        seasonId,
        dbOrTx,
      );
      if (!standings) {
        throw new NotFoundError(
          `Failed to create standings for user ${userId} in league ${leagueId}`,
        );
      }

      existingPoints = standings.points;
      const metadataParseResult = PickEmStandingsMetadataSchema.safeParse(
        standings.metadata,
      );
      if (!metadataParseResult.success) {
        throw new InternalServerError(
          `Failed to parse metadata for user ${userId} in league ${leagueId}`,
        );
      }
      existingStandingsMetadata = metadataParseResult.data;
    }

    // Calculate results for each pick
    const pickResults: Array<{ pickId: string; result: PICK_RESULTS }> = [];
    for (const pick of picks) {
      const result = this.calculatePickResult(pick);
      pickResults.push({ pickId: pick.id, result });

      // Update metadata
      existingStandingsMetadata = this.updateMetadataWithResult(
        existingStandingsMetadata,
        result,
      );
    }

    // Calculate new points
    const newPoints = this.calculatePoints(existingStandingsMetadata);

    // Update standings
    await this.standingsMutationService.update(
      userId,
      leagueId,
      seasonId,
      {
        points: existingPoints + newPoints,
        metadata: existingStandingsMetadata,
      },
      dbOrTx,
    );

    // Update pick results
    for (const { pickId, result } of pickResults) {
      await this.picksMutationService.update(pickId, { result }, dbOrTx);
    }
  }

  private calculatePickResult(pick: UnassessedPick): PICK_RESULTS {
    const { spread, outcome } = pick;
    const { homeScore, awayScore } = outcome;

    const isHomeTeam = pick.event.homeTeamId === pick.teamId;

    const teamScore = isHomeTeam ? homeScore : awayScore;
    const opponentScore = isHomeTeam ? awayScore : homeScore;

    if (spread !== null) {
      const adjustedTeamScore = teamScore + spread;
      if (adjustedTeamScore > opponentScore) return PICK_RESULTS.WIN;
      if (adjustedTeamScore < opponentScore) return PICK_RESULTS.LOSS;
      return PICK_RESULTS.PUSH;
    } else {
      if (teamScore > opponentScore) return PICK_RESULTS.WIN;
      if (teamScore < opponentScore) return PICK_RESULTS.LOSS;
      return PICK_RESULTS.PUSH;
    }
  }

  private calculatePoints(metadata: PickEmStandingsMetadata): number {
    return metadata.wins + metadata.pushes * 0.5;
  }

  private updateMetadataWithResult(
    currentMetadata: PickEmStandingsMetadata,
    result: PICK_RESULTS,
  ): PickEmStandingsMetadata {
    const newMetadata = { ...currentMetadata };

    switch (result) {
      case PICK_RESULTS.WIN:
        newMetadata.wins++;
        break;
      case PICK_RESULTS.LOSS:
        newMetadata.losses++;
        break;
      case PICK_RESULTS.PUSH:
        newMetadata.pushes++;
        break;
    }

    return newMetadata;
  }

  private groupPicksByUser(
    picks: UnassessedPick[],
  ): Map<string, UnassessedPick[]> {
    const picksByUser = new Map<string, UnassessedPick[]>();

    for (const pick of picks) {
      if (!picksByUser.has(pick.userId)) {
        picksByUser.set(pick.userId, []);
      }
      picksByUser.get(pick.userId)!.push(pick);
    }

    return picksByUser;
  }
}

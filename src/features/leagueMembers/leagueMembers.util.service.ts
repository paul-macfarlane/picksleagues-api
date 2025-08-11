import { inject, injectable } from "inversify";
import { TYPES } from "../../lib/inversify.types.js";
import { DBOrTx } from "../../db/index.js";
import { NotFoundError } from "../../lib/errors.js";
import { LeagueMembersMutationService } from "./leagueMembers.mutation.service.js";
import { LeaguesQueryService } from "../leagues/leagues.query.service.js";
import { LeagueTypesQueryService } from "../leagueTypes/leagueTypes.query.service.js";
import { SeasonsUtilService } from "../seasons/seasons.util.service.js";
import { StandingsMutationService } from "../standings/standings.mutation.service.js";
import { LEAGUE_MEMBER_ROLES } from "./leagueMembers.types.js";

@injectable()
export class LeagueMembersUtilService {
  constructor(
    @inject(TYPES.LeagueMembersMutationService)
    private leagueMembersMutationService: LeagueMembersMutationService,
    @inject(TYPES.LeaguesQueryService)
    private leaguesQueryService: LeaguesQueryService,
    @inject(TYPES.LeagueTypesQueryService)
    private leagueTypesQueryService: LeagueTypesQueryService,
    @inject(TYPES.SeasonsUtilService)
    private seasonsUtilService: SeasonsUtilService,
    @inject(TYPES.StandingsMutationService)
    private standingsMutationService: StandingsMutationService,
  ) {}

  async addMemberAndInitializeStandings(
    leagueId: string,
    userId: string,
    role: LEAGUE_MEMBER_ROLES,
    dbOrTx?: DBOrTx,
  ): Promise<void> {
    const league = await this.leaguesQueryService.findById(leagueId, dbOrTx);
    if (!league) {
      throw new NotFoundError("League not found");
    }

    await this.leagueMembersMutationService.createLeagueMember(
      {
        leagueId,
        userId,
        role,
      },
      dbOrTx,
    );

    const leagueType = await this.leagueTypesQueryService.findById(
      league.leagueTypeId,
      dbOrTx,
    );
    if (!leagueType) {
      throw new NotFoundError("League type not found");
    }

    const season =
      await this.seasonsUtilService.findCurrentOrLatestSeasonForSportLeagueId(
        leagueType.sportLeagueId,
        dbOrTx,
      );
    if (!season) {
      throw new NotFoundError(
        "Season not found to create standings record for new member",
      );
    }

    await this.standingsMutationService.create(
      {
        userId,
        leagueId,
        seasonId: season.id,
        points: 0,
        metadata: {
          wins: 0,
          losses: 0,
          pushes: 0,
        },
      },
      dbOrTx,
    );
  }
}

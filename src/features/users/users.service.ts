import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types.js";
import { LeaguesMutationService } from "../leagues/leagues.mutation.service.js";
import { LeaguesQueryService } from "../leagues/leagues.query.service.js";
import { LeagueMembersQueryService } from "../leagueMembers/leagueMembers.query.service.js";
import { ValidationError } from "../../lib/errors.js";
import { LEAGUE_MEMBER_ROLES } from "../leagueMembers/leagueMembers.types.js";
import { db } from "../../db/index.js";
import { ProfilesMutationService } from "../profiles/profiles.mutation.service.js";
import {
  ANONYMOUS_FIRST_NAME,
  ANONYMOUS_LAST_NAME,
  ANONYMOUS_USERNAME,
} from "../profiles/profiles.types.js";
import { UsersMutationService } from "./users.mutation.service.js";
import { UsersQueryService } from "./users.query.service.js";
import { AccountsMutationService } from "../accounts/accounts.mutation.service.js";
import { SessionsMutationService } from "../sessions/sessions.mutation.service.js";
import { VerificationsMutationService } from "../verifications/verifications.mutation.service.js";
import { NotFoundError } from "../../lib/errors.js";
import { LeagueMembersMutationService } from "../leagueMembers/leagueMembers.mutation.service.js";

@injectable()
export class UsersService {
  constructor(
    @inject(TYPES.UsersMutationService)
    private usersMutationService: UsersMutationService,
    @inject(TYPES.UsersQueryService)
    private usersQueryService: UsersQueryService,
    @inject(TYPES.LeaguesMutationService)
    private leaguesMutationService: LeaguesMutationService,
    @inject(TYPES.LeaguesQueryService)
    private leaguesQueryService: LeaguesQueryService,
    @inject(TYPES.LeagueMembersQueryService)
    private leagueMembersQueryService: LeagueMembersQueryService,
    @inject(TYPES.LeagueMembersMutationService)
    private leagueMembersMutationService: LeagueMembersMutationService,
    @inject(TYPES.ProfilesMutationService)
    private profilesMutationService: ProfilesMutationService,
    @inject(TYPES.AccountsMutationService)
    private accountsMutationService: AccountsMutationService,
    @inject(TYPES.SessionsMutationService)
    private sessionsMutationService: SessionsMutationService,
    @inject(TYPES.VerificationsMutationService)
    private verificationsMutationService: VerificationsMutationService,
  ) {}

  async anonymizeAccount(userId: string): Promise<void> {
    await db.transaction(async (tx) => {
      const user = await this.usersQueryService.findById(userId, tx);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      const leagues = await this.leaguesQueryService.listByUserId(userId, tx);

      for (const league of leagues) {
        const members = await this.leagueMembersQueryService.listByLeagueId(
          league.id,
          tx,
        );
        if (members.length === 1) {
          await this.leaguesMutationService.delete(league.id, tx);
        } else {
          const commissioners = members.filter(
            (m) => m.role === LEAGUE_MEMBER_ROLES.COMMISSIONER,
          );
          if (
            commissioners.length === 1 &&
            commissioners[0].userId === userId
          ) {
            throw new ValidationError(
              "You must designate another commissioner before deleting your account.",
            );
          }
        }
      }

      await this.leagueMembersMutationService.deleteByUserId(userId, tx);
      await this.accountsMutationService.deleteByUserId(userId, tx);
      await this.sessionsMutationService.deleteByUserId(userId, tx);
      await this.verificationsMutationService.deleteByIdentifier(
        user.email,
        tx,
      );

      await this.usersMutationService.update(
        userId,
        {
          name: "anonymous",
          email: "anonymous",
          emailVerified: false,
          image: null,
        },
        tx,
      );

      await this.profilesMutationService.update(
        userId,
        {
          username: ANONYMOUS_USERNAME,
          firstName: ANONYMOUS_FIRST_NAME,
          lastName: ANONYMOUS_LAST_NAME,
          avatarUrl: null,
        },
        tx,
      );
    });
  }
}

import { db, DBOrTx } from "../../db";
import {
  ANONYMOUS_USERNAME,
  DBProfile,
  DBProfileUpdate,
  MAX_USERNAME_LENGTH,
  SearchProfilesSchema,
} from "./profiles.types";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../lib/errors";
import { generateFromEmail } from "unique-username-generator";
import { DBUser } from "../users/users.types";
import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import { ProfilesQueryService } from "./profiles.query.service";
import { ProfilesMutationService } from "./profiles.mutation.service";
import { z } from "zod";

@injectable()
export class ProfilesService {
  constructor(
    @inject(TYPES.ProfilesQueryService)
    private profilesQueryService: ProfilesQueryService,
    @inject(TYPES.ProfilesMutationService)
    private profilesMutationService: ProfilesMutationService,
  ) {}

  async update(
    actingUserId: string,
    targetUserId: string,
    profileData: DBProfileUpdate,
  ): Promise<DBProfile> {
    if (actingUserId !== targetUserId) {
      throw new ForbiddenError("You are not authorized to update this profile");
    }

    if (profileData.username && profileData.username === ANONYMOUS_USERNAME) {
      throw new ValidationError("This username is reserved.");
    }

    return await db.transaction(async (tx) => {
      const existingProfile =
        await this.profilesQueryService.findByUserId(targetUserId);
      if (!existingProfile) {
        throw new NotFoundError("Profile not found");
      }

      if (
        profileData.username &&
        profileData.username !== existingProfile.username
      ) {
        const usernameIsTaken = await this.profilesQueryService.isUsernameTaken(
          profileData.username,
          tx,
        );
        if (usernameIsTaken) {
          throw new ConflictError("Username already exists");
        }
      }

      return this.profilesMutationService.update(targetUserId, profileData, tx);
    });
  }

  async onboard(
    user: DBUser,
  ): Promise<{ status: "exists" | "created"; profile: DBProfile }> {
    return await db.transaction(async (tx) => {
      const existingProfile = await this.profilesQueryService.findByUserId(
        user.id,
        tx,
      );
      if (existingProfile) {
        return { status: "exists", profile: existingProfile };
      }
      let username = generateFromEmail(user.email).slice(
        0,
        MAX_USERNAME_LENGTH,
      );
      let i = 1;
      while (
        (await this.profilesQueryService.isUsernameTaken(username, tx)) ||
        username === ANONYMOUS_USERNAME
      ) {
        username = generateFromEmail(user.email, i).slice(
          0,
          MAX_USERNAME_LENGTH,
        );
        i++;
      }

      const guessFirstName = user.name?.split(" ")[0] ?? "First";
      const guessLastName = user.name?.split(" ")[1] ?? "Last";

      const newProfile = await this.profilesMutationService.create(
        {
          userId: user.id,
          username,
          firstName: guessFirstName,
          lastName: guessLastName,
          avatarUrl: user.image,
        },
        tx,
      );

      return { status: "created", profile: newProfile };
    });
  }

  async search(
    query: z.infer<typeof SearchProfilesSchema>,
    dbOrTx?: DBOrTx,
  ): Promise<DBProfile[]> {
    if (!query.username && !query.firstName && !query.lastName) {
      return [];
    }

    return this.profilesQueryService.search(query, dbOrTx);
  }

  async getByUserId(userId: string, dbOrTx?: DBOrTx): Promise<DBProfile> {
    const profile = await this.profilesQueryService.findByUserId(
      userId,
      dbOrTx,
    );
    if (!profile) {
      throw new NotFoundError("Profile not found");
    }

    return profile;
  }
}

import { db } from "../../db";
import { ProfilesRepository } from "./profiles.repository";
import {
  DBProfile,
  DBProfileUpdate,
  SearchProfilesSchema,
} from "./profiles.types";
import { z } from "zod";
import { ConflictError, ForbiddenError, NotFoundError } from "../../lib/errors";
import { generateFromEmail } from "unique-username-generator";
import { MAX_USERNAME_LENGTH } from "./profiles.types";
import { DBUser } from "../users/users.types";
import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";

@injectable()
export class ProfilesService {
  private profilesRepository: ProfilesRepository;

  constructor(
    @inject(TYPES.ProfilesRepository) profilesRepository: ProfilesRepository,
  ) {
    this.profilesRepository = profilesRepository;
  }

  async search(
    query: z.infer<typeof SearchProfilesSchema>,
  ): Promise<DBProfile[]> {
    if (!query.username && !query.firstName && !query.lastName) {
      return [];
    }
    return await this.profilesRepository.searchProfiles(query, 10);
  }

  async findByUserId(userId: string): Promise<DBProfile | null> {
    return await this.profilesRepository.findByUserId(userId);
  }

  async getByUserId(userId: string): Promise<DBProfile> {
    const profile = await this.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError("Profile not found");
    }

    return profile;
  }

  async update(
    actingUserId: string,
    targetUserId: string,
    profileData: DBProfileUpdate,
  ): Promise<DBProfile> {
    if (actingUserId !== targetUserId) {
      throw new ForbiddenError("You are not authorized to update this profile");
    }

    return await db.transaction(async (tx) => {
      const existingProfile = await this.profilesRepository.findByUserId(
        targetUserId,
        tx,
      );
      if (!existingProfile) {
        throw new NotFoundError("Profile not found");
      }

      if (
        profileData.username &&
        profileData.username !== existingProfile.username
      ) {
        const usernameIsTaken = await this.profilesRepository.isUsernameTaken(
          profileData.username,
          tx,
        );
        if (usernameIsTaken) {
          throw new ConflictError("Username already exists");
        }
      }

      return await this.profilesRepository.update(
        targetUserId,
        profileData,
        tx,
      );
    });
  }

  async onboard(
    user: DBUser,
  ): Promise<{ status: "exists" | "created"; profile: DBProfile }> {
    return await db.transaction(async (tx) => {
      const existingProfile = await this.profilesRepository.findByUserId(
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
      while (await this.profilesRepository.isUsernameTaken(username, tx)) {
        username = generateFromEmail(user.email, i).slice(
          0,
          MAX_USERNAME_LENGTH,
        );
        i++;
      }

      const guessFirstName = user.name?.split(" ")[0] ?? "First";
      const guessLastName = user.name?.split(" ")[1] ?? "Last";

      const newProfile = await this.profilesRepository.create(
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
}

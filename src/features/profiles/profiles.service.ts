import {
  searchProfiles as searchProfilesInDb,
  findByUserId,
  isUsernameTaken,
  update as updateUserInDb,
  create as createProfileInDb,
} from "./profiles.repository";
import {
  DBProfile,
  DBProfileUpdate,
  SearchProfilesSchema,
} from "./profiles.types";
import { z } from "zod";
import { ConflictError, ForbiddenError, NotFoundError } from "../../lib/errors";
import { generateFromEmail } from "unique-username-generator/dist";
import { MAX_USERNAME_LENGTH } from "./profiles.types";
import { DBUser } from "../../lib/models/users/db";

export async function searchProfiles(
  query: z.infer<typeof SearchProfilesSchema>,
): Promise<DBProfile[]> {
  // if no search query, return empty array
  if (!query.username && !query.firstName && !query.lastName) {
    return [];
  }
  return await searchProfilesInDb(query, 10);
}

export async function getProfileByUserId(userId: string): Promise<DBProfile> {
  const profile = await findByUserId(userId);
  if (!profile) {
    throw new NotFoundError("Profile not found");
  }

  return profile;
}

export async function updateUserProfile(
  actingUserId: string,
  targetUserId: string,
  profileData: DBProfileUpdate,
): Promise<DBProfile> {
  if (actingUserId !== targetUserId) {
    throw new ForbiddenError("You are not authorized to update this profile");
  }

  const existingProfile = await findByUserId(targetUserId);
  if (!existingProfile) {
    throw new NotFoundError("Profile not found");
  }

  if (
    profileData.username &&
    profileData.username !== existingProfile.username
  ) {
    const usernameIsTaken = await isUsernameTaken(profileData.username);
    if (usernameIsTaken) {
      throw new ConflictError("Username already exists");
    }
  }

  return await updateUserInDb(targetUserId, profileData);
}

export async function onboardUser(
  user: DBUser,
): Promise<{ status: "exists" | "created"; profile: DBProfile }> {
  const existingProfile = await findByUserId(user.id);
  if (existingProfile) {
    return { status: "exists", profile: existingProfile };
  }

  // Generate a unique username
  let username = generateFromEmail(user.email).slice(0, MAX_USERNAME_LENGTH);
  let i = 1;
  while (await isUsernameTaken(username)) {
    username = generateFromEmail(user.email, i).slice(0, MAX_USERNAME_LENGTH);
    i++;
  }

  const guessFirstName = user.name?.split(" ")[0] ?? "First";
  const guessLastName = user.name?.split(" ")[1] ?? "Last";

  const newProfile = await createProfileInDb({
    userId: user.id,
    username,
    firstName: guessFirstName,
    lastName: guessLastName,
    avatarUrl: user.image,
  });

  return { status: "created", profile: newProfile };
}

import { Request, Response, Router } from "express";
import { auth } from "../../../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { DBUser, profilesTable } from "../../../db/schema";
import { db } from "../../../db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { SearchProfilesSchema } from "../../../lib/models/profiles";
import { searchProfile as searchProfiles } from "../../../db/helpers/profiles";

const router = Router();

router.get("/search", async (req: Request, res: Response) => {
  const session = (await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  })) as { user: DBUser };
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parseQuery = SearchProfilesSchema.safeParse(req.query);
  if (!parseQuery.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  if (
    !parseQuery.data.username &&
    !parseQuery.data.firstName &&
    !parseQuery.data.lastName
  ) {
    // if no search query, return empty array
    res.status(200).json([]);
    return;
  }

  const profiles = await searchProfiles(parseQuery.data);

  res.json(profiles);
});

router.get("/:userId", async (req: Request, res: Response) => {
  const session = (await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  })) as { user: DBUser };
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parseUserId = z.string().trim().safeParse(req.params.userId);
  if (!parseUserId.success) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const queryRows = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, parseUserId.data))
    .limit(1);
  if (!queryRows[0]) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json(queryRows[0]);
});

export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 50;
export const MIN_NAME_LENGTH = 1;
export const MAX_NAME_LENGTH = 50;

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(MIN_USERNAME_LENGTH, {
      message: `Username must be at least ${MIN_USERNAME_LENGTH} characters`,
    })
    .max(MAX_USERNAME_LENGTH, {
      message: `Username must be at most ${MAX_USERNAME_LENGTH} characters`,
    }),
  firstName: z
    .string()
    .min(MIN_NAME_LENGTH, { message: `First name is required ` })
    .max(MAX_NAME_LENGTH, {
      message: `First name must be at most ${MAX_NAME_LENGTH} characters`,
    }),
  lastName: z
    .string()
    .min(MIN_NAME_LENGTH, { message: `Last name is required` })
    .max(MAX_NAME_LENGTH, {
      message: `Last name must be at most ${MAX_NAME_LENGTH} characters`,
    }),
  avatarUrl: z.union([
    z.string().trim().url().optional(),
    z.literal(""),
    z.null(),
  ]),
});

router.put("/", async (req: Request, res: Response) => {
  const session = (await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  })) as { user: DBUser };
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { data: profileData, error: parseError } =
    updateProfileSchema.safeParse(req.body);
  if (parseError) {
    console.error(
      `Bad request for user ${session.user.id}: ${parseError.message}`,
    );
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const queryRows = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, session.user.id))
    .limit(1);
  if (!queryRows[0]) {
    console.error(`Profile not found for user ${session.user.id}`);
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  const existingProfile = queryRows[0];

  if (profileData.username !== existingProfile.username) {
    const usernameExists = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.username, profileData.username))
      .limit(1);
    if (usernameExists.length > 0) {
      console.error(
        `Username ${profileData.username} already exists for user ${session.user.id}`,
      );
      res.status(409).json({ error: "Username already exists" });
      return;
    }
  }

  const updateRows = await db
    .update(profilesTable)
    .set(profileData)
    .where(eq(profilesTable.userId, session.user.id))
    .returning();

  res.json(updateRows[0]);
});

export default router;

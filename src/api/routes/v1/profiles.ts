import { Request, Response, Router } from "express";
import { auth } from "../../../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { profilesTable } from "../../../db/schema";
import { db } from "../../../db";
import { eq } from "drizzle-orm";
import {
  SearchProfilesSchema,
  UpdateProfileSchema,
  UserIdSchema,
} from "../../../lib/models/profiles/validations";
import { searchProfiles as searchProfiles } from "../../../db/helpers/profiles";
import { DBUser } from "../../../lib/models/users/db";

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

  const parseUserId = UserIdSchema.safeParse(req.params.userId);
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

router.put("/", async (req: Request, res: Response) => {
  const session = (await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  })) as { user: DBUser };
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { data: profileData, error: parseError } =
    UpdateProfileSchema.safeParse(req.body);
  if (parseError) {
    console.error(
      `Bad request for user ${session.user.id}: ${parseError.message}`,
    );
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  await db.transaction(async (tx) => {
    const queryRows = await tx
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
      const usernameExists = await tx
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

    const updateRows = await tx
      .update(profilesTable)
      .set(profileData)
      .where(eq(profilesTable.userId, session.user.id))
      .returning();

    res.json(updateRows[0]);
  });
});

export default router;

import { Request, Response, Router } from "express";
import { auth } from "../../../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { DBUser, profilesTable } from "../../../db/schema";
import { db } from "../../../db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const session = (await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  })) as { user: DBUser };
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const queryRows = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, session.user.id))
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

  const MIN_USERNAME_LENGTH = 3;
  const MAX_USERNAME_LENGTH = 20;
  const MIN_NAME_LENGTH = 1;
  const MAX_NAME_LENGTH = 50;

  const updateProfileSchema =  z.object({
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
    avatarUrl: z.union([z.string().url().optional(), z.literal(""), z.null()]),
  });


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
      res.status(400).json({ error: "Username already exists" });
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

import { Request, Response, Router } from "express";
import { auth } from "../../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import {
  SearchProfilesSchema,
  UpdateProfileSchema,
  UserIdSchema,
} from "./profiles.types";
import { DBUser } from "../../lib/models/users/db";
import {
  getProfileByUserId,
  onboardUser,
  searchProfiles,
  updateUserProfile,
} from "./profiles.service";
import { handleApiError, UnauthorizedError } from "../../lib/errors";

const router = Router();

router.get("/onboard", async (req: Request, res: Response): Promise<void> => {
  try {
    const session = (await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })) as { user: DBUser };
    if (!session) {
      // If no session, redirect to login
      res.redirect(302, `${process.env.WEB_FRONTEND_URL!}/login`);
      return;
    }

    const result = await onboardUser(session.user);
    if (result.status === "created") {
      res.redirect(302, `${process.env.WEB_FRONTEND_URL!}/profile?setup=true`);
      return;
    }

    // For existing users, redirect to the main page
    res.redirect(302, `${process.env.WEB_FRONTEND_URL!}`);
  } catch (err) {
    handleApiError(err, res);
  }
});

router.get("/search", async (req: Request, res: Response): Promise<void> => {
  try {
    const session = (await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })) as { user: DBUser };
    if (!session) {
      throw new UnauthorizedError();
    }

    const parseQuery = SearchProfilesSchema.parse(req.query);
    const profiles = await searchProfiles(parseQuery);

    res.json(profiles);
  } catch (err) {
    handleApiError(err, res);
  }
});

router.get("/:userId", async (req: Request, res: Response): Promise<void> => {
  try {
    const session = (await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })) as { user: DBUser };
    if (!session) {
      throw new UnauthorizedError();
    }

    const userId = UserIdSchema.parse(req.params.userId);
    const profile = await getProfileByUserId(userId);

    res.json(profile);
  } catch (err) {
    handleApiError(err, res);
  }
});

router.patch("/:userId", async (req: Request, res: Response): Promise<void> => {
  try {
    const session = (await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })) as { user: DBUser };
    if (!session) {
      throw new UnauthorizedError();
    }

    const userId = UserIdSchema.parse(req.params.userId);
    const parseBody = UpdateProfileSchema.parse(req.body);
    const updatedProfile = await updateUserProfile(
      session.user.id,
      userId,
      parseBody,
    );

    res.json(updatedProfile);
  } catch (err) {
    handleApiError(err, res);
  }
});

export default router;

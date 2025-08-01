import { Request, Response, Router } from "express";
import { auth } from "../../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";
import {
  SearchProfilesSchema,
  UpdateProfileSchema,
  UserIdSchema,
} from "./profiles.types.js";
import { DBUser } from "../users/users.types.js";
import { ProfilesService } from "./profiles.service.js";
import { container } from "../../lib/inversify.config.js";
import { TYPES } from "../../lib/inversify.types.js";
import { requireAuth } from "../../lib/auth.middleware.js";

const router = Router();

const profilesService = container.get<ProfilesService>(TYPES.ProfilesService);

router.get("/onboard", async (req: Request, res: Response): Promise<void> => {
  const session = (await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  })) as { user: DBUser };
  if (!session) {
    res.redirect(302, `${process.env.WEB_FRONTEND_URL!}/login`);
    return;
  }

  const result = await profilesService.onboard(session.user);
  if (result.status === "created") {
    res.redirect(302, `${process.env.WEB_FRONTEND_URL!}/profile?setup=true`);
    return;
  }

  res.redirect(302, `${process.env.WEB_FRONTEND_URL!}`);
});

router.get(
  "/search",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const parseQuery = SearchProfilesSchema.parse(req.query);
    const profiles = await profilesService.search(parseQuery);

    res.json(profiles);
  },
);

router.get(
  "/:userId",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const userId = UserIdSchema.parse(req.params.userId);
    const profile = await profilesService.getByUserId(userId);

    res.json(profile);
  },
);

router.patch(
  "/:userId",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const userId = UserIdSchema.parse(req.params.userId);
    const parseBody = UpdateProfileSchema.parse(req.body);
    const updatedProfile = await profilesService.update(
      req.user!.id,
      userId,
      parseBody,
    );

    res.json(updatedProfile);
  },
);

export default router;

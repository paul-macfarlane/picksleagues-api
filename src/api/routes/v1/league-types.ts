import { Router, Request, Response } from "express";
import { auth } from "../../../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { DBUser } from "../../../lib/models/users/db";
import { z } from "zod";
import { LEAGUE_TYPE_SLUGS } from "../../../lib/models/leagueTypes/constants";
import { db } from "../../../db";
import {
  getLeagueTypeById,
  getLeagueTypeBySlug,
} from "../../../db/helpers/leagueTypes";
import { getPhaseTemplatesBySportLeagueId } from "../../../db/helpers/phaseTemplates";
import { getLeaguesByUserIdAndLeagueTypeId } from "../../../db/helpers/leauges";
import { DBLeagueType } from "../../../lib/models/leagueTypes/db";

const router = Router();

router.get("/:typeIdOrSlug/my-leagues", async (req: Request, res: Response) => {
  try {
    const session = (await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })) as { user: DBUser };
    if (!session) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parseUUID = z
      .string()
      .trim()
      .uuid()
      .safeParse(req.params.typeIdOrSlug);
    const parseSlug = z
      .enum([LEAGUE_TYPE_SLUGS.PICK_EM])
      .safeParse(req.params.typeIdOrSlug);
    if (!parseUUID.success && !parseSlug.success) {
      res.status(400).json({ error: "Invalid typeIdOrSlug" });
      return;
    }

    let leagueType: DBLeagueType | undefined;

    if (parseSlug.success) {
      leagueType = await getLeagueTypeBySlug(db, parseSlug.data);
    } else if (parseUUID.success) {
      leagueType = await getLeagueTypeById(db, parseUUID.data);
    }
    if (!leagueType) {
      res.status(404).json({ error: "League type not found" });
      return;
    }

    const leagues = await getLeaguesByUserIdAndLeagueTypeId(
      db,
      session.user.id,
      leagueType.id,
    );
    res.status(200).json(leagues);
  } catch (err) {
    console.error("Error in my-leagues get:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get(
  "/:typeIdOrSlug/phase-templates",
  async (req: Request, res: Response) => {
    try {
      const session = (await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      })) as { user: DBUser };
      if (!session) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const parseUUID = z
        .string()
        .trim()
        .uuid()
        .safeParse(req.params.typeIdOrSlug);
      const parseSlug = z
        .enum([LEAGUE_TYPE_SLUGS.PICK_EM])
        .safeParse(req.params.typeIdOrSlug);
      if (!parseUUID.success && !parseSlug.success) {
        res.status(400).json({ error: "Invalid typeIdOrSlug" });
        return;
      }

      let leagueType: DBLeagueType | undefined;

      if (parseSlug.success) {
        leagueType = await getLeagueTypeBySlug(db, parseSlug.data);
      } else if (parseUUID.success) {
        leagueType = await getLeagueTypeById(db, parseUUID.data);
      }
      if (!leagueType) {
        res.status(404).json({ error: "League type not found" });
        return;
      }

      const phaseTemplates = await getPhaseTemplatesBySportLeagueId(
        db,
        leagueType.sportLeagueId,
      );

      res.status(200).json(phaseTemplates);
    } catch (err) {
      console.error("Error in phaseTemplate get:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;

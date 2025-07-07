import { Router, Request, Response } from "express";
import { auth } from "../../../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { DBUser } from "../../../db/schema";
import {
  createLeagueSchema,
  LEAGUE_MEMBER_ROLES,
  pickEmLeagueSettingsSchema,
} from "../../../lib/models/leagues";
import { db } from "../../../db";
import { getLeagueTypeBySlug } from "../../../db/helpers/leagueTypes";
import { LEAGUE_TYPE_NAMES } from "../../../lib/models/leagueTypes";
import { insertLeague, insertLeagueMember } from "../../../db/helpers/leauges";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const session = (await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })) as { user: DBUser };
    if (!session) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const bodyParsed = createLeagueSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    await db.transaction(async (tx) => {
      const leagueType = await getLeagueTypeBySlug(
        tx,
        bodyParsed.data.leagueTypeSlug,
      );
      if (!leagueType) {
        res.status(400).json({ error: "Invalid league type" });
        return;
      }

      let settings: unknown;
      switch (leagueType.name) {
        case LEAGUE_TYPE_NAMES.PICK_EM: {
          const settingsParsed = pickEmLeagueSettingsSchema.safeParse(
            req.body.settings,
          );
          if (!settingsParsed.success) {
            res.status(400).json({ error: "Invalid settings" });
            return;
          }

          settings = settingsParsed.data;
          break;
        }
        default:
          res.status(400).json({ error: "Invalid league type" });
          return;
      }

      const league = await insertLeague(tx, {
        ...bodyParsed.data,
        leagueTypeId: leagueType.id,
        settings,
      });

      await insertLeagueMember(tx, {
        leagueId: league.id,
        userId: session.user.id,
        role: LEAGUE_MEMBER_ROLES.COMMISSIONER,
      });

      res.status(201).json(league);
    });
  } catch (err) {
    console.error("Error in leagues post:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

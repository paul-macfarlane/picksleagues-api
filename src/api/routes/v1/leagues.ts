import { Router, Request, Response } from "express";
import { auth } from "../../../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { DBUser } from "../../../lib/models/users/db";
import {
  CreateLeagueSchema,
  PickEmLeagueSettingsSchema,
} from "../../../lib/models/leagues/validations";
import { db } from "../../../db";
import { getLeagueTypeBySlug } from "../../../db/helpers/leagueTypes";
import { LEAGUE_TYPE_NAMES } from "../../../lib/models/leagueTypes/constants";
import {
  getLeagueById,
  insertLeague,
  insertLeagueMember,
} from "../../../db/helpers/leauges";
import { getLeagueMembersWithProfileByLeagueId } from "../../../db/helpers/leagueMembers";
import { getPhaseTemplateById } from "../../../db/helpers/phaseTemplates";
import { LEAGUE_MEMBER_ROLES } from "../../../lib/models/leagueMembers/constants";
import { z } from "zod";
import { getLeagueMemberByLeagueAndUserId } from "../../../db/helpers/leagueMembers";
import { getPendingLeagueInvitesByLeagueId } from "../../../db/helpers/leagueInvites";

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

    const bodyParsed = CreateLeagueSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: bodyParsed.error.issues,
      });
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
          const settingsParsed = PickEmLeagueSettingsSchema.safeParse(
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

      const startPhaseTemplate = await getPhaseTemplateById(
        tx,
        bodyParsed.data.startPhaseTemplateId,
      );
      if (!startPhaseTemplate) {
        res.status(400).json({ error: "Invalid start phase template" });
        return;
      }

      const endPhaseTemplate = await getPhaseTemplateById(
        tx,
        bodyParsed.data.endPhaseTemplateId,
      );
      if (!endPhaseTemplate) {
        res.status(400).json({ error: "Invalid end phase template" });
        return;
      }

      if (startPhaseTemplate.sequence > endPhaseTemplate.sequence) {
        res.status(400).json({
          error:
            "Start phase template must be before or equal to end phase template",
        });
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

router.get("/:leagueId", async (req: Request, res: Response) => {
  try {
    const session = (await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })) as { user: DBUser };
    if (!session) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parseLeagueId = z
      .string()
      .trim()
      .uuid()
      .safeParse(req.params.leagueId);
    if (!parseLeagueId.success) {
      res.status(400).json({ error: "Invalid league ID" });
      return;
    }

    const league = await getLeagueById(db, parseLeagueId.data);
    if (!league) {
      res.status(404).json({ error: "League not found" });
      return;
    }

    const member = await getLeagueMemberByLeagueAndUserId(
      db,
      parseLeagueId.data,
      session.user.id,
    );
    if (!member) {
      res.status(403).json({ error: "You are not a member of this league" });
      return;
    }

    res.status(200).json(league);
  } catch (err) {
    console.error("Error in leagues get:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:leagueId/members", async (req: Request, res: Response) => {
  try {
    const session = (await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })) as { user: DBUser };
    if (!session) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parseLeagueId = z
      .string()
      .trim()
      .uuid()
      .safeParse(req.params.leagueId);
    if (!parseLeagueId.success) {
      res.status(400).json({ error: "Invalid league ID" });
      return;
    }

    const league = await getLeagueById(db, parseLeagueId.data);
    if (!league) {
      res.status(404).json({ error: "League not found" });
      return;
    }

    const members = await getLeagueMembersWithProfileByLeagueId(
      db,
      parseLeagueId.data,
    );

    res.status(200).json(members);
  } catch (err) {
    console.error("Error in leagues get members:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:leagueId/invites", async (req: Request, res: Response) => {
  try {
    const session = (await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })) as { user: DBUser };
    if (!session) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parseLeagueId = z
      .string()
      .trim()
      .uuid()
      .safeParse(req.params.leagueId);
    if (!parseLeagueId.success) {
      res.status(400).json({ error: "Invalid league ID" });
      return;
    }

    const league = await getLeagueById(db, parseLeagueId.data);
    if (!league) {
      res.status(404).json({ error: "League not found" });
      return;
    }

    const member = await getLeagueMemberByLeagueAndUserId(
      db,
      parseLeagueId.data,
      session.user.id,
    );
    if (!member) {
      res.status(403).json({ error: "You are not a member of this league" });
      return;
    }

    if (member.role !== LEAGUE_MEMBER_ROLES.COMMISSIONER) {
      res
        .status(403)
        .json({ error: "You are not a commissioner of this league" });
      return;
    }
    // make sure frontend doesn't try to get invites for a league they're not a commissioner

    const invites = await getPendingLeagueInvitesByLeagueId(
      db,
      parseLeagueId.data,
    );

    res.status(200).json(invites);
  } catch (err) {
    console.error("Error in leagues get invites:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

import { Request, Response, Router } from "express";
import { auth } from "../../../lib/auth";
import { DBLeagueInvite, DBUser } from "../../../db/schema";
import {
  CREATE_LEAGUE_INVITE_SCHEMA,
  DEFAULT_LEAGUE_INVITE_EXPIRATION_TIME_MS,
  LEAGUE_INVITE_STATUSES,
  LEAGUE_INVITE_TYPES,
  RESPOND_TO_LEAGUE_INVITE_SCHEMA,
} from "../../../lib/models/leagueInvites";
import { db } from "../../../db";
import { getLeagueMemberByLeagueAndUserId } from "../../../db/helpers/leagueMembers";
import { LEAGUE_MEMBER_ROLES } from "../../../lib/models/leagueMembers";
import {
  getInvitesByInviteeIdAndOptionalStatus,
  getLeagueInviteById,
  insertLeagueInvite,
  updateLeagueInvite,
} from "../../../db/helpers/leagueInvites";
import { z } from "zod";
import { fromNodeHeaders } from "better-auth/node";

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

    const parseInvite = CREATE_LEAGUE_INVITE_SCHEMA.safeParse(req.body);
    if (!parseInvite.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: parseInvite.error.issues,
      });
      return;
    }

    await db.transaction(async (tx) => {
      const leagueMember = await getLeagueMemberByLeagueAndUserId(
        tx,
        parseInvite.data.leagueId,
        session.user.id,
      );
      if (!leagueMember) {
        res.status(400).json({ error: "You are not a member of this league" });
        return;
      }

      const member = await getLeagueMemberByLeagueAndUserId(
        tx,
        parseInvite.data.leagueId,
        session.user.id,
      );
      if (!member) {
        res
          .status(404)
          .json({ error: "League not found or user is not a member" });
        return;
      }

      // this is the first foray into some kind of RBAC. If there ends up being a lot of this, then its probably adding a role mapping to permissions table
      if (member.role !== LEAGUE_MEMBER_ROLES.COMMISSIONER) {
        res.status(403).json({ error: "You are not a commissioner" });
        return;
      }

      let invite: DBLeagueInvite;
      const expiresAt = new Date(
        Date.now() + DEFAULT_LEAGUE_INVITE_EXPIRATION_TIME_MS,
      );
      if (parseInvite.data.type === LEAGUE_INVITE_TYPES.DIRECT) {
        invite = await insertLeagueInvite(tx, {
          inviterId: session.user.id,
          leagueId: parseInvite.data.leagueId,
          inviteeId: parseInvite.data.inviteeId,
          type: parseInvite.data.type,
          expiresAt,
          role: parseInvite.data.role,
        });
      } else {
        invite = await insertLeagueInvite(tx, {
          inviterId: session.user.id,
          leagueId: parseInvite.data.leagueId,
          maxUses: parseInvite.data.maxUses,
          type: parseInvite.data.type,
          expiresAt,
          role: parseInvite.data.role,
        });
      }

      res.status(201).json(invite);
    });
  } catch (err) {
    console.error("Error in league invites post:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:inviteId/respond", async (req: Request, res: Response) => {
  try {
    const session = (await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })) as { user: DBUser };
    if (!session) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parseId = z.string().uuid().safeParse(req.params.inviteId);
    if (!parseId.success) {
      res.status(400).json({ error: "Invalid invite ID" });
      return;
    }

    const parseResponse = RESPOND_TO_LEAGUE_INVITE_SCHEMA.safeParse(req.body);
    if (!parseResponse.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    await db.transaction(async (tx) => {
      const invite = await getLeagueInviteById(tx, req.params.inviteId);
      if (!invite) {
        res.status(404).json({ error: "Invite not found" });
        return;
      }

      if (invite.inviteeId !== session.user.id) {
        res.status(403).json({ error: "You are not the invitee" });
        return;
      }

      if (invite.expiresAt && invite.expiresAt < new Date()) {
        res.status(400).json({ error: "Invite has expired" });
        return;
      }

      if (invite.status !== LEAGUE_INVITE_STATUSES.PENDING) {
        res.status(400).json({ error: "Invite is not pending" });
        return;
      }

      const member = await getLeagueMemberByLeagueAndUserId(
        tx,
        invite.leagueId,
        session.user.id,
      );
      if (member) {
        res
          .status(409)
          .json({ error: "User is already a member of the league" });
        return;
      }

      await updateLeagueInvite(tx, req.params.inviteId, {
        status: parseResponse.data.response,
      });

      res.status(200).json({ message: "Invite responded to" });
    });
  } catch (err) {
    console.error("Error in league invites get:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/my-invites", async (req: Request, res: Response) => {
  try {
    const session = (await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })) as { user: DBUser };
    if (!session) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parseStatus = z
      .enum([
        LEAGUE_INVITE_STATUSES.PENDING,
        LEAGUE_INVITE_STATUSES.ACCEPTED,
        LEAGUE_INVITE_STATUSES.DECLINED,
      ])
      .optional()
      .safeParse(req.query.status);
    if (!parseStatus.success) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    const invites = await getInvitesByInviteeIdAndOptionalStatus(
      db,
      session.user.id,
      parseStatus.data ?? undefined,
    );

    res.status(200).json(invites);
  } catch (err) {
    console.error("Error in league invites get:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

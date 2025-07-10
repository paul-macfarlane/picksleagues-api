import { Request, Response, Router } from "express";
import { auth } from "../../../lib/auth";
import { DBLeagueInvite, DBUser } from "../../../db/schema";
import {
  CreateLeagueInviteSchema,
  LEAGUE_INVITE_STATUSES,
  LEAGUE_INVITE_TYPES,
  RespondToLeagueInviteSchema,
} from "../../../lib/models/leagueInvites";
import { db } from "../../../db";
import { getLeagueMemberByLeagueAndUserId } from "../../../db/helpers/leagueMembers";
import { LEAGUE_MEMBER_ROLES } from "../../../lib/models/leagueMembers";
import {
  getLeagueInviteById,
  insertLeagueInvite,
  deleteLeagueInvite,
  updateLeagueInvite,
  getLeagueInviteByInviteeLeagueAndStatus,
  getInvitesWithLeagueAndTypeByInviteeIdAndOptionalStatus,
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

    const parseInvite = CreateLeagueInviteSchema.safeParse(req.body);
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

      // check if user has a pending invite to the league already
      const existingInvite = await getLeagueInviteByInviteeLeagueAndStatus(
        tx,
        session.user.id,
        parseInvite.data.leagueId,
        LEAGUE_INVITE_STATUSES.PENDING,
      );
      if (existingInvite) {
        res
          .status(409)
          .json({ error: "User has already been invited to the league" });
        return;
      }

      let invite: DBLeagueInvite;
      const expiresAt = new Date(
        Date.now() + parseInvite.data.expiresInDays * 24 * 60 * 60 * 1000,
      );

      if (parseInvite.data.type === LEAGUE_INVITE_TYPES.DIRECT) {
        invite = await insertLeagueInvite(tx, {
          inviterId: session.user.id,
          leagueId: parseInvite.data.leagueId,
          inviteeId: parseInvite.data.inviteeId,
          type: parseInvite.data.type,
          expiresAt,
          role: parseInvite.data.role,
          status: LEAGUE_INVITE_STATUSES.PENDING,
        });
      } else {
        invite = await insertLeagueInvite(tx, {
          inviterId: session.user.id,
          leagueId: parseInvite.data.leagueId,
          type: parseInvite.data.type,
          expiresAt,
          role: parseInvite.data.role,
          token: crypto.randomUUID(),
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

    const parseId = z.string().trim().uuid().safeParse(req.params.inviteId);
    if (!parseId.success) {
      res.status(400).json({ error: "Invalid invite ID" });
      return;
    }

    const parseResponse = RespondToLeagueInviteSchema.safeParse(req.body);
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

      res.status(204).send();
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

    const invites =
      await getInvitesWithLeagueAndTypeByInviteeIdAndOptionalStatus(
        db,
        session.user.id,
        LEAGUE_INVITE_STATUSES.PENDING,
      );

    res.status(200).json(invites);
  } catch (err) {
    console.error("Error in league invites get:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:inviteId", async (req: Request, res: Response) => {
  try {
    const session = (await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })) as { user: DBUser };
    if (!session) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parseId = z.string().trim().uuid().safeParse(req.params.inviteId);
    if (!parseId.success) {
      res.status(400).json({ error: "Invalid invite ID" });
      return;
    }

    await db.transaction(async (tx) => {
      const invite = await getLeagueInviteById(tx, req.params.inviteId);
      if (!invite) {
        res.status(404).json({ error: "Invite not found" });
        return;
      }

      const member = await getLeagueMemberByLeagueAndUserId(
        tx,
        invite.leagueId,
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

      await deleteLeagueInvite(tx, req.params.inviteId);

      res.status(204).send();
    });
  } catch (err) {
    console.error("Error in league invites delete:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

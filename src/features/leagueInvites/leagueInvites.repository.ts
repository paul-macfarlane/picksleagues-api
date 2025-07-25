import { and, eq, gt, inArray, isNull, or } from "drizzle-orm";
import { injectable } from "inversify";
import { db, DBOrTx } from "../../db/index.js";
import { leagueInvitesTable } from "../../db/schema.js";
import {
  DBLeagueInvite,
  DBLeagueInviteInsert,
  DBLeagueInviteUpdate,
  LEAGUE_INVITE_STATUSES,
  LEAGUE_INVITE_TYPES,
} from "./leagueInvites.types.js";

@injectable()
export class LeagueInvitesRepository {
  async create(
    invite: DBLeagueInviteInsert,
    dbOrTx: DBOrTx = db,
  ): Promise<DBLeagueInvite> {
    const invites = await dbOrTx
      .insert(leagueInvitesTable)
      .values(invite)
      .returning();
    return invites[0];
  }

  async update(
    inviteId: string,
    invite: DBLeagueInviteUpdate,
    dbOrTx: DBOrTx = db,
  ): Promise<DBLeagueInvite> {
    const invites = await dbOrTx
      .update(leagueInvitesTable)
      .set(invite)
      .where(eq(leagueInvitesTable.id, inviteId))
      .returning();
    return invites[0];
  }

  async findById(
    inviteId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBLeagueInvite | null> {
    const invites = await dbOrTx
      .select()
      .from(leagueInvitesTable)
      .where(eq(leagueInvitesTable.id, inviteId));
    return invites[0] ?? null;
  }

  async listByInviteeId(
    inviteeId: string,
    status: LEAGUE_INVITE_STATUSES | undefined,
    dbOrTx: DBOrTx = db,
  ): Promise<DBLeagueInvite[]> {
    const invites = await dbOrTx
      .select()
      .from(leagueInvitesTable)
      .where(
        and(
          eq(leagueInvitesTable.inviteeId, inviteeId),
          status ? eq(leagueInvitesTable.status, status) : undefined,
        ),
      );

    return invites;
  }

  async listActiveByLeagueId(
    leagueId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBLeagueInvite[]> {
    const invites = await dbOrTx
      .select()
      .from(leagueInvitesTable)
      .where(
        and(
          eq(leagueInvitesTable.leagueId, leagueId),
          or(
            eq(leagueInvitesTable.status, LEAGUE_INVITE_STATUSES.PENDING),
            and(
              isNull(leagueInvitesTable.status),
              eq(leagueInvitesTable.type, LEAGUE_INVITE_TYPES.LINK),
            ),
          ),
          gt(leagueInvitesTable.expiresAt, new Date()),
        ),
      );

    return invites;
  }

  async delete(inviteId: string, dbOrTx: DBOrTx = db): Promise<void> {
    await dbOrTx
      .delete(leagueInvitesTable)
      .where(eq(leagueInvitesTable.id, inviteId));
  }

  async deleteByIds(ids: string[], dbOrTx: DBOrTx = db): Promise<void> {
    await dbOrTx
      .delete(leagueInvitesTable)
      .where(inArray(leagueInvitesTable.id, ids));
  }

  async findByInviteeLeagueAndStatus(
    inviteeId: string,
    leagueId: string,
    status: LEAGUE_INVITE_STATUSES,
    dbOrTx: DBOrTx = db,
  ): Promise<DBLeagueInvite | null> {
    const invites = await dbOrTx
      .select()
      .from(leagueInvitesTable)
      .where(
        and(
          eq(leagueInvitesTable.inviteeId, inviteeId),
          eq(leagueInvitesTable.leagueId, leagueId),
          eq(leagueInvitesTable.status, status),
        ),
      );
    return invites[0] ?? null;
  }

  async findByToken(
    token: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBLeagueInvite | null> {
    const invites = await dbOrTx
      .select()
      .from(leagueInvitesTable)
      .where(eq(leagueInvitesTable.token, token));
    return invites[0] ?? null;
  }
}

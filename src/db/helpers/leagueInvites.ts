import { and, eq } from "drizzle-orm";
import { DBOrTx } from "..";
import {
  DBLeagueInvite,
  DBLeagueInviteUpdate,
  type DBLeagueInviteInsert,
  leagueInvitesTable,
} from "../schema";
import { LEAGUE_INVITE_STATUSES } from "../../lib/models/leagueInvites";

export async function insertLeagueInvite(
  dbOrTx: DBOrTx,
  invite: DBLeagueInviteInsert,
): Promise<DBLeagueInvite> {
  const invites = await dbOrTx
    .insert(leagueInvitesTable)
    .values(invite)
    .returning();
  return invites[0];
}

export async function updateLeagueInvite(
  dbOrTx: DBOrTx,
  inviteId: string,
  invite: DBLeagueInviteUpdate,
): Promise<DBLeagueInvite> {
  const invites = await dbOrTx
    .update(leagueInvitesTable)
    .set(invite)
    .where(eq(leagueInvitesTable.id, inviteId))
    .returning();
  return invites[0];
}

export async function getLeagueInviteById(
  dbOrTx: DBOrTx,
  inviteId: string,
): Promise<DBLeagueInvite | undefined> {
  const invites = await dbOrTx
    .select()
    .from(leagueInvitesTable)
    .where(eq(leagueInvitesTable.id, inviteId));
  return invites[0];
}

export async function getInvitesByInviteeIdAndOptionalStatus(
  dbOrTx: DBOrTx,
  inviteeId: string,
  status: LEAGUE_INVITE_STATUSES | undefined,
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

export async function getLeagueInvitesByLeagueId(
  dbOrTx: DBOrTx,
  leagueId: string,
): Promise<DBLeagueInvite[]> {
  const invites = await dbOrTx
    .select()
    .from(leagueInvitesTable)
    .where(eq(leagueInvitesTable.leagueId, leagueId));
  return invites;
}

export async function deleteLeagueInvite(
  dbOrTx: DBOrTx,
  inviteId: string,
): Promise<void> {
  await dbOrTx
    .delete(leagueInvitesTable)
    .where(eq(leagueInvitesTable.id, inviteId));
}

export async function getLeagueInviteByInviteeLeagueAndStatus(
  dbOrTx: DBOrTx,
  inviteeId: string,
  leagueId: string,
  status: LEAGUE_INVITE_STATUSES,
): Promise<DBLeagueInvite | undefined> {
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
  return invites[0];
}

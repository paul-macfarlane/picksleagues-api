import { and, eq, gt, isNull, or } from "drizzle-orm";
import { DBOrTx } from "..";
import {
  DBLeagueInvite,
  DBLeagueInviteUpdate,
  type DBLeagueInviteInsert,
  leagueInvitesTable,
  DBLeague,
  leaguesTable,
  DBLeagueType,
  leagueTypesTable,
} from "../schema";
import {
  LEAGUE_INVITE_STATUSES,
  LEAGUE_INVITE_TYPES,
} from "../../lib/models/leagueInvites";

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

export async function getInvitesWithLeagueAndTypeByInviteeIdAndOptionalStatus(
  dbOrTx: DBOrTx,
  inviteeId: string,
  status: LEAGUE_INVITE_STATUSES | undefined,
): Promise<
  (DBLeagueInvite & { league: DBLeague; leagueType: DBLeagueType })[]
> {
  const invites = await dbOrTx
    .select({
      league: leaguesTable,
      invite: leagueInvitesTable,
      leagueType: leagueTypesTable,
    })
    .from(leagueInvitesTable)
    .innerJoin(leaguesTable, eq(leagueInvitesTable.leagueId, leaguesTable.id))
    .innerJoin(
      leagueTypesTable,
      eq(leaguesTable.leagueTypeId, leagueTypesTable.id),
    )
    .where(
      and(
        eq(leagueInvitesTable.inviteeId, inviteeId),
        status ? eq(leagueInvitesTable.status, status) : undefined,
      ),
    );

  return invites.map((invite) => ({
    ...invite.invite,
    league: invite.league,
    leagueType: invite.leagueType,
  }));
}

export async function getPendingLeagueInvitesByLeagueId(
  dbOrTx: DBOrTx,
  leagueId: string,
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

---
id: task-005
title: Delete League
status: Done
assignee: []
created_date: '2025-07-21'
updated_date: '2025-07-21'
labels: []
dependencies: []
---

## Description

As a league commissioner, I can delete a picks league. This should remove all associated data, such as members, picks, standings, and seasons. A warning should be presented to the user before finalizing the action.

## Acceptance Criteria

- [x] A commissioner can delete a league.
- [x] Deleting the league removes all associated data (members, invites).

## Implementation Plan

1. Add DELETE /api/v1/leagues/:leagueId endpoint.
2. Implement leagues.service.ts#deleteLeague for orchestration.
3. Add commissioner permission check.
4. Implement deletion methods in mutation services for leagueMembers, seasons, and leagueInvites.
5. Implement league deletion in leagues.mutation.service.ts.
6. Wrap in a transaction.
7. Add tests.

## Implementation Notes

- Added a `DELETE /api/v1/leagues/:leagueId` endpoint.
- Implemented `leagues.service.ts#delete` to orchestrate the deletion of a league.
- The service verifies that the user is a commissioner of the league before proceeding.
- The deletion of the league, its members, and invites are wrapped in a database transaction to ensure atomicity.
- The task description mentioned deleting "seasons", but the database schema revealed that seasons are shared data and should not be deleted along with a league. The implementation reflects this. "Picks" and "standings" are not yet implemented.
- Added unit tests for the new service logic.
- Modified files:
  - `src/features/leagues/leagues.service.ts`
  - `src/features/leagues/leagues.router.ts`
  - `src/features/leagues/leagues.service.test.ts`

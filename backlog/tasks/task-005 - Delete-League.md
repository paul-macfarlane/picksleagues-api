---
id: task-005
title: Delete League
status: In Progress
assignee: []
created_date: '2025-07-21'
updated_date: '2025-07-21'
labels: []
dependencies: []
---

## Description

As a league commissioner, I can delete a picks league. This should remove all associated data, such as members, picks, standings, and seasons. A warning should be presented to the user before finalizing the action.

## Acceptance Criteria

- [ ] A commissioner can delete a league.
- [ ] Deleting the league removes all associated data (members, picks, standings, seasons).
- [ ] A warning is displayed to the commissioner before the deletion is finalized.

## Implementation Plan

1. Add DELETE /api/v1/leagues/:leagueId endpoint.
2. Implement leagues.service.ts#deleteLeague for orchestration.
3. Add commissioner permission check.
4. Implement deletion methods in mutation services for leagueMembers, seasons, and leagueInvites.
5. Implement league deletion in leagues.mutation.service.ts.
6. Wrap in a transaction.
7. Add tests.

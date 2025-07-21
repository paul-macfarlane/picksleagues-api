---
id: task-004
title: Leave League
status: Done
assignee:
  - '@paulmacfarlane'
created_date: '2025-07-20'
updated_date: '2025-07-21'
labels: []
dependencies: []
---

## Description

This task is to create an API endpoint for a user to leave a league. This endpoint will enforce all the necessary business rules, such as preventing a user from leaving a league that is in season and ensuring a commissioner designates a replacement before leaving. It will also handle the deletion of a league if the leaving member is the last one.

## Acceptance Criteria

- [x] The API provides an endpoint for a user to leave a league.
- [x] The endpoint requires authentication to identify the user and the league.
- [x] The API returns an error if a user tries to leave a league that is currently in season.
- [x] The API returns an error if a commissioner tries to leave a league with other members without first designating another commissioner.
- [x] If the leaving user is the sole member of the league, the league is deleted.
- [x] Upon successfully leaving, the user is no longer a member of the league.

## Implementation Plan

1. **Router ():** Add a route that calls the new method in .\n2. **Orchestration Service ():** Create a new method to handle the business logic.\n3. **Business Logic:** Inside , use a transaction to: a) verify the user is a member, b) check if the league is in season using , c) handle the case where a commissioner leaves (ensuring a replacement exists), d) delete the league if it's the last member, or e) delete the membership otherwise.\n4. **Unit Tests ():** Add a new block for with tests covering all acceptance criteria.

## Implementation Notes

- Added a `POST /leagues/:leagueId/leave` endpoint.
- Implemented `leaveLeague` in `LeagueMembersService` to handle the core logic.
- Business rules enforced:
  - Cannot leave a league that is in season.
  - A sole commissioner cannot leave if other members are present.
- If the last member leaves, the entire league is deleted.
- Otherwise, the user's membership is removed.
- Added extensive unit tests in `leagueMembers.service.test.ts` to verify all scenarios.
- Modified files: `src/features/leagues/leagues.router.ts`, `src/features/leagueMembers/leagueMembers.service.ts`, `src/features/leagueMembers/leagueMembers.service.test.ts`.

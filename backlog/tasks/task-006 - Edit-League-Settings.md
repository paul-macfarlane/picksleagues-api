---
id: task-006
title: Edit League Settings
status: Done
assignee: []
created_date: '2025-07-21'
updated_date: '2025-07-21'
labels: []
dependencies: []
---

## Description

As a commissioner, I can edit league settings like name and profile picture. If the league is not in season, I can also edit the start week, end week, picks per week, league size (which cannot be set below the current number of members), and pick type.

## Acceptance Criteria

- [x] A commissioner can edit the league name and profile picture at any time.
- [x] If the league is not in season, a commissioner can edit the start week, end week, picks per week, and pick type.
- [x] The league size can be edited, but it cannot be set lower than the current number of members.
- [x] Changes to league settings are saved and reflected in the league's details.

## Implementation Notes

- Added a `PATCH /api/v1/leagues/:leagueId` endpoint to handle league setting updates.
- Implemented `updateSettings` method in `LeaguesService` to orchestrate the update logic.
- Ensured that only commissioners can edit league settings.
- Differentiated between in-season and off-season edits, restricting certain fields when a league is active.
- Added validation to prevent the league size from being set below the current number of members.
- Added and updated methods in the query, mutation, and repository layers to support the new functionality.
- Wrote comprehensive unit tests to cover all scenarios.
- **Files Modified**:
  - `src/features/leagues/leagues.types.ts`
  - `src/features/leagues/leagues.router.ts`
  - `src/features/leagues/leagues.service.ts`
  - `src/features/leagues/leagues.query.service.ts`
  - `src/features/leagues/leagues.mutation.service.ts`
  - `src/features/leagues/leagues.repository.ts`
  - `src/features/leagues/leagues.service.test.ts`

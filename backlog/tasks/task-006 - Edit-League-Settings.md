---
id: task-006
title: Edit League Settings
status: In Progress
assignee: []
created_date: '2025-07-21'
updated_date: '2025-07-21'
labels: []
dependencies: []
---

## Description

As a commissioner, I can edit league settings like name and profile picture. If the league is not in season, I can also edit the start week, end week, picks per week, league size (which cannot be set below the current number of members), and pick type.

## Acceptance Criteria

- [ ] A commissioner can edit the league name and profile picture at any time.
- [ ] If the league is not in season, a commissioner can edit the start week, end week, picks per week, and pick type.
- [ ] The league size can be edited, but it cannot be set lower than the current number of members.
- [ ] Changes to league settings are saved and reflected in the league's details.

## Implementation Plan

1. Update leagues.types.ts with a Zod schema for league settings payload.\n2. Add a PATCH /api/v1/leagues/:leagueId route in leagues.router.ts.\n3. Implement updateLeagueSettings method in leagues.service.ts.\n  - Verify user is a commissioner.\n  - Check if league is in-season to determine which fields can be edited.\n  - If leagueSize is being updated, verify it's not less than the current member count.\n4. Implement the corresponding update method in leagues.mutation.service.ts and leagues.repository.ts.\n5. Add unit tests in leagues.service.test.ts.

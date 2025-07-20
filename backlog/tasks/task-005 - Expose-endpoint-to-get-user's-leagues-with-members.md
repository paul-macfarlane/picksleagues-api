---
id: task-005
title: Expose endpoint to get user's leagues with members
status: Done
assignee:
  - '@paulmacfarlane'
created_date: '2025-07-20'
updated_date: '2025-07-20'
labels: []
dependencies: []
---

## Description

To support the client-side account deletion flow, the client needs to check if the user is the sole commissioner of any leagues. This requires a new API endpoint that can fetch all of a user's leagues and, optionally, the members for each of those leagues.

## Acceptance Criteria

- [x] A GET /api/v1/users/me/leagues endpoint is created.
- [x] The endpoint returns all leagues the authenticated user is a member of.
- [x] The endpoint supports an include=members query parameter to also return the list of members for each league.
- [x] The endpoint is authenticated and only returns leagues for the current user.

## Implementation Plan

1. Create a new method in that will orchestrate fetching the leagues and their members.\n2. This method will use to get the leagues.\n3. If members are requested, it will then use to fetch the members for all the leagues in a single query.\n4. It will then map the members to their respective leagues.\n5. Add a new route to .\n6. This route will call the method and handle the query parameter.

## Implementation Notes

- Created a new `listLeaguesForUser` method in `LeaguesService` to fetch all leagues for a user.
- Updated the `populateLeagues` private method to handle the `include=members` query parameter.
- Added the `listByLeagueIds` method to `LeagueMembersQueryService` and `LeagueMembersRepository` to support fetching members for multiple leagues at once.
- Added the new `GET /api/v1/users/me/leagues` route to `users.router.ts`.

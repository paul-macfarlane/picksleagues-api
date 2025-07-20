---
id: task-003
title: Remove Member
status: Done
assignee:
  - '@paulmacfarlane'
created_date: '2025-07-20'
updated_date: '2025-07-20'
labels: []
dependencies: []
---

## Description

This task is to create an API endpoint for removing a member from a league. The endpoint will be responsible for enforcing the business logic that governs when a member can be removed, such as checking if the league is in season. It will also handle the data modifications for removing the member while retaining their historical data.

## Acceptance Criteria

- [x] The API provides an endpoint to remove a member from a league.
- [x] The endpoint requires authentication and authorization to ensure only a league commissioner can remove a member.
- [x] The API returns an error if a member removal is attempted while the league is in season.
- [x] Upon successful removal, the member is no longer associated with the league.
- [x] The removed member's historical data (picks, standings) is retained.
- [x] The API returns an error if a commissioner attempts to remove themselves from the league with this endpoint.

## Implementation Plan

1. **Router:** Create a new `DELETE /api/v1/leagues/:leagueId/members/:userId` route in `leagues.router.ts`.\n2. **Orchestration Service (`LeagueMembersService`):** Create a new `removeMember` method to contain the business logic.\n3. **Business Logic:** Inside `removeMember`, the service will verify that the acting user is a commissioner. It will also prevent a commissioner from removing themselves and check if the league is in season.\n4. **Mutation Service (`LeagueMembersMutationService`):** Create a simple `delete` method that is a pass-through to the repository.\n5. **Repository (`LeagueMembersRepository`):** Create a `delete` method to perform the database operation.\n6. **Unit Tests:** Add unit tests for the new logic in `LeagueMembersService`.

## Implementation Notes

Implemented the endpoint. Added the method to to orchestrate the removal, including business logic to ensure the requester is a commissioner, prevent self-removal by commissioners, and block removal if the league's season is active. Added corresponding methods to the and . Covered all new logic with unit tests.

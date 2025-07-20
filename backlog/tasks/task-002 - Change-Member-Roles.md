---
id: task-002
title: Change Member Roles
status: In Progress
assignee:
  - '@paulmacfarlane'
created_date: '2025-07-20'
updated_date: '2025-07-20'
labels: []
dependencies: []
---

## Description

This task is to create an API endpoint for managing league member roles. The endpoint will allow authenticated league commissioners to change the roles of other members within a league. The API will enforce the business rules that prevent a league from being left without a commissioner.

## Acceptance Criteria

- [ ] The API provides an endpoint to update a league member's role.
- [ ] The endpoint requires authentication and authorization to ensure only a league commissioner can change roles.
- [ ] The API validates that the new role is a valid role (e.g., 'member' or 'commissioner').
- [ ] A commissioner can successfully change another member's role.
- [ ] The API returns an error if a commissioner attempts to change their own role to 'member' when they are the sole commissioner in the league.
- [ ] A commissioner can successfully change their own role to 'member' if at least one other commissioner exists.

## Implementation Plan

1. **Router:** Create a new `PATCH /api/v1/leagues/:leagueId/members/:userId` route in `leagues.router.ts` to handle the role change request.\n2. **Validation:** In the router, use a Zod schema to validate the request body, ensuring it contains a valid role.\n3. **Orchestration Service (`LeaguesService`):** Create a new `updateMemberRole` method. This method will contain the business logic.\n4. **Business Logic:** Inside `updateMemberRole`, the service will first check if the acting user is a commissioner of the league. Then, it will enforce the rule that prevents a commissioner from changing their own role if they are the sole commissioner.\n5. **Mutation Service (`LeagueMembersMutationService`):** Create a simple `update` method that is a pass-through to the repository.\n6. **Repository (`LeagueMembersRepository`):** Create an `update` method to perform the database operation.\n7. **Unit Tests:** Add unit tests for the new logic in `LeaguesService` to ensure correctness.

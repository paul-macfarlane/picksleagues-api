---
id: task-005
title: Expose endpoint to get user's leagues with members
status: To Do
assignee: []
created_date: '2025-07-20'
labels: []
dependencies: []
---

## Description

To support the client-side account deletion flow, the client needs to check if the user is the sole commissioner of any leagues. This requires a new API endpoint that can fetch all of a user's leagues and, optionally, the members for each of those leagues.

## Acceptance Criteria

- [ ] A GET /api/v1/users/me/leagues endpoint is created.
- [ ] The endpoint returns all leagues the authenticated user is a member of.
- [ ] The endpoint supports an include=members query parameter to also return the list of members for each league.
- [ ] The endpoint is authenticated and only returns leagues for the current user.

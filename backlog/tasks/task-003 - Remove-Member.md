---
id: task-003
title: Remove Member
status: To Do
assignee: []
created_date: "2025-07-20"
updated_date: "2025-07-20"
labels: []
dependencies: []
---

## Description

This task is to create an API endpoint for removing a member from a league. The endpoint will be responsible for enforcing the business logic that governs when a member can be removed, such as checking if the league is in season. It will also handle the data modifications for removing the member while retaining their historical data.

## Acceptance Criteria

- [ ] The API provides an endpoint to remove a member from a league.
- [ ] The endpoint requires authentication and authorization to ensure only a league commissioner can remove a member.
- [ ] The API returns an error if a member removal is attempted while the league is in season.
- [ ] Upon successful removal, the member is no longer associated with the league.
- [ ] The removed member's historical data (picks, standings) is retained.
- [ ] The API returns an error if a commissioner attempts to remove themselves from the league with this endpoint.

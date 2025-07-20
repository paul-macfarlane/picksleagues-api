---
id: task-002
title: Change Member Roles
status: To Do
assignee: []
created_date: "2025-07-20"
updated_date: "2025-07-20"
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

---
id: task-004
title: Leave League
status: To Do
assignee: []
created_date: '2025-07-20'
updated_date: '2025-07-20'
labels: []
dependencies: []
---

## Description

This task is to create an API endpoint for a user to leave a league. This endpoint will enforce all the necessary business rules, such as preventing a user from leaving a league that is in season and ensuring a commissioner designates a replacement before leaving. It will also handle the deletion of a league if the leaving member is the last one.
## Acceptance Criteria

- [ ] API provides an endpoint for a user to leave a league.
- [ ] The endpoint requires authentication to identify the user and the league.
- [ ] The API returns an error if a user tries to leave a league that is currently in season.
- [ ] The API returns an error if a commissioner tries to leave a league with other members without first designating another commissioner.
- [ ] If the leaving user is the sole member of the league
- [ ] the league is deleted.
- [ ] Upon successfully leaving
- [ ] the user is no longer a member of the league.

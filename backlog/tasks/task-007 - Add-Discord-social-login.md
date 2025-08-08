---
id: task-007
title: Add Discord social login
status: To Do
assignee: []
created_date: '2025-08-08'
labels: []
dependencies: []
---

## Description

Enable users to log in with Discord alongside existing Google and Apple. Ensure users with the same email can link multiple social providers, and post-login redirect sends existing users to home and new users to profile setup.

## Acceptance Criteria

- [ ] Discord login available under /api/auth/discord
- [ ] Existing Google and Apple logins continue to work
- [ ] Accounts with the same email are linked to one user
- [ ] On login with existing profile redirect to WEB_FRONTEND_URL
- [ ] On first login without profile create profile and redirect to WEB_FRONTEND_URL/profile?setup=true
- [ ] Environment variables DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET are required and documented
- [ ] Basic integration test or manual verification steps added

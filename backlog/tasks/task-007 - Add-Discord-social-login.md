---
id: task-007
title: Add Discord social login
status: Done
assignee:
  - '@paul'
created_date: '2025-08-08'
updated_date: '2025-08-08'
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

## Implementation Plan

1) Add Discord provider to better-auth config in src/lib/auth.ts
2) Set Discord redirect URL in Dev Portal to {API_BASE}/api/auth/callback/discord
3) Confirm account linking by email works across providers
4) Use /api/v1/profiles/onboard for post-login redirect (new→/profile?setup=true, existing→home)
5) Document DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET in README with setup instructions
6) Add manual verification steps and sanity-check Google/Apple
7) Run lint and build

## Implementation Notes

Added Discord social login provider alongside existing Google and Apple providers. Added Discord client env vars to README with setup instructions. Using existing /api/v1/profiles/onboard endpoint for post-login redirects (new users to profile setup, existing to home). Better Auth handles account linking by email automatically.

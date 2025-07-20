---
id: task-001
title: Delete Account
status: In Progress
assignee:
  - '@paulmacfarlane'
created_date: '2025-07-20'
updated_date: '2025-07-20'
labels: []
dependencies: []
---

## Description

This task is to create an API endpoint for account deletion. The endpoint will handle all the business logic and data modifications required to securely remove a user from the system. It will ensure that all personally identifiable information is erased while maintaining the integrity of historical, anonymized data.

## Acceptance Criteria

- [x] The API provides an endpoint to delete a user account.
- [x] The endpoint requires authentication to ensure a user can only delete their own account.
- [x] Upon successful deletion, the user's PII is permanently removed from the database by anonymizing the user's record.
- [x] The user's authentication credentials are invalidated, preventing future logins.
- [x] All historical records (e.g., picks, standings) associated with the user are retained but anonymized.
- [x] If the user is the sole member of a league, that league is deleted.
- [x] The API returns an error if a user tries to delete their account while being the sole commissioner of a league with other members.

## Implementation Plan

1. Create a new method in that will contain the core logic for deleting a user.\n2. In this method, first check if the user is the sole commissioner of any leagues with other members. If so, throw an error.\n3. Identify and delete any leagues where the user is the sole member.\n4. Anonymize all historical data associated with the user, such as picks and standings.\n5. Delete the user's PII from the database.\n6. Add a new route in a new file to handle the request.\n7. This route will call the method and handle success and error responses.\n8. Add authentication middleware to the new route to ensure only the authenticated user can delete their own account.

## Implementation Notes

- Implemented the `DELETE /api/v1/users/me` endpoint to anonymize user accounts in a transaction.
- Added business logic to handle sole commissioners and single-member leagues.
- Added a `listByUserId` method to the `leagues` feature to simplify fetching a user's leagues.
- Refactored the code based on feedback to improve structure, error handling, and to correctly implement the anonymization logic.
- Moved the `users.router.ts` to the correct feature directory.
- Removed the unique constraint on the `username` in the `profiles` table and updated the profile creation/update logic to prevent the use of the "anonymous" username.
- Refactored the anonymization logic to follow the standards by using the mutation services to update the user and profile data.
- Refactored the business logic out of the mutation services and into the service layer, where it belongs.

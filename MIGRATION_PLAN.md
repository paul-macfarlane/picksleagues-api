# API Migration & Hardening Plan

This document outlines the tactical steps to harden the codebase and ensure it fully aligns with the new `STANDARDS.md`.

## Phase 1: Architectural Refactor (Completed)

**Goal:** Migrate the entire codebase to a feature-sliced, object-oriented, and dependency-injected architecture.

**Status: ✅ Complete.** All legacy helpers and procedural files have been successfully migrated into `Service` and `Repository` classes within the `src/features` and `src/integrations` directories. The application is now fully testable.

---

## Phase 2: API Standards Compliance

**Goal:** Now that the new architecture is in place, iterate through each feature and align its API with the standards defined in `Part 3: API Design Guide` and `Part 1.10: Service Layer Method Naming` of the `STANDARDS.md`.

1.  **Standardize Error Responses:** (Completed)

    - Go through each endpoint in every feature.
    - Replace all old error formats (e.g., `{ error: "..." }`) with the new standard: `{ error: { message: "...", code: "..." } }`.
    - Create a shared `ApiError` class in `src/lib` to make this easier.

2.  **Correct HTTP Methods:** (Completed)

    - For any endpoint that performs a partial update (like the profile update), change its method in the router from `PUT` to `PATCH`.

3.  **Make Implicit Includes Explicit:** (Completed)

    - Identify any endpoint that automatically embeds related data (e.g., `GET /leagues/:id/members` including profiles).
    - Modify the service and repository layers to only include that data when a `?include=` parameter is present in the request.

4.  **Implement Common Features (As Needed):** (Completed)

    - Add pagination (`?limit`/`?offset`) to endpoints that return large collections.
    - Add `?include=` support for other desired resources.

5.  **Enforce Explicit Return Types:** (Completed)

    - Go through each function in the refactored feature's `service` and `repository` files.
    - Add explicit return types to all function signatures (e.g., `Promise<DBProfile | null>`, `Promise<void>`).

---

## Phase 3: Implement Testing

**Goal:** Establish a robust testing suite for the application to ensure long-term stability and catch regressions.

**Note:** This phase should only be started after the API standards compliance is complete.

1.  **Set Up Testing Environment:** (Completed)

    - Configure a testing framework (e.g., Jest or Vitest).
    - Create a global setup file to mock the `db` client, preventing unit tests from making real database connections, as detailed in `STANDARDS.md`.
    - Set up a process for running integration tests against a test database.

2.  **Write Service Unit Tests:** (In Progress)

    - For each feature, write comprehensive unit tests for the service class, mocking its dependencies (repositories and other services).
    - **`leagueInvites`:** Completed. This is the reference implementation for service-layer testing.

3.  **Write Repository Integration Tests:**
    - For each feature, write integration tests for the repository class, verifying its methods against a real database schema.

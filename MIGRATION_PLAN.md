# API & Architecture Migration Plan

This document outlines the tactical steps to refactor the codebase to align with the new `STANDARDS.md`. It should be executed in the order presented to minimize disruption.

## Phase 1: Foundational Setup

**Goal:** Prepare the workspace for the new architecture.

1.  **Create Directories:**
    - Create the primary `src/features` directory.

---

## Phase 2: Architectural Refactoring (Feature by Feature)

**Goal:** Migrate the entire codebase to the feature-sliced architecture. This should be done one feature at a time to ensure stability.

**Guiding Principle:** Each feature should correspond to a single primary data entity (e.g., `leagues` for the `leaguesTable`, `leagueMembers` for the `leagueMembersTable`). When migrating, ensure you are creating granular, single-purpose features.

**Repeat this process for each feature (`profiles`, `leagues`, `leagueInvites`, `sportsData`, etc.):**

### Example Migration: The `profiles` Feature

1.  **Consolidate and Move Files:**

    - Create `src/features/profiles/`.
    - **Router:** Move `src/api/routes/v1/profiles.ts` to `src/features/profiles/profiles.router.ts`.
    - **Types:** Create a new `src/features/profiles/profiles.types.ts` and consolidate the contents of `src/lib/models/profiles/` and any other related types into it.
    - **Repository:** Move `src/db/helpers/profiles.ts` to `src/features/profiles/profiles.repository.ts`.

2.  **Refactor to Class-Based Architecture:**

    - **Repository:** Convert the repository from a collection of functions to a `ProfilesRepository` class.
    - **Service:** Create a new `ProfilesService` class in `src/features/profiles/profiles.service.ts`. Move all business logic into its methods.
    - **Dependency Injection:** The `ProfilesService` constructor must accept a `ProfilesRepository` instance.
    - **Router/Composition Root:** Update `profiles.router.ts` to be the "composition root" for the feature. It should instantiate the `ProfilesRepository`, inject it into a new `ProfilesService` instance, and then have its route handlers call methods on the service instance.

3.  **Update Imports and Finalize:**

    - Update the main API router in `src/api/routes/v1/index.ts` to point to the new `profiles.router.ts`.
    - Fix any other broken imports across the application that referenced the moved files.

4.  **Manual Testing:**
    - Thoroughly test all profile-related endpoints to ensure no regressions were introduced.

---

## Phase 3: API Standards Compliance

**Goal:** Once the new architecture is in place, iterate through each feature and align its API with the standards guide.

1.  **Standardize Error Responses:**

    - Go through each endpoint in every feature.
    - Replace all old error formats (e.g., `{ error: "..." }`) with the new standard: `{ error: { message: "...", code: "..." } }`.
    - Consider creating a shared `ApiError` class in `src/lib` to make this easier.

2.  **Correct HTTP Methods:**

    - For any endpoint that performs a partial update (like the profile update), change its method in the router from `PUT` to `PATCH`.

3.  **Make Implicit Includes Explicit:**

    - Identify any endpoint that automatically embeds related data (e.g., `GET /leagues/:id/members` including profiles).
    - Modify the service and repository layers to only include that data when a `?include=` parameter is present in the request.

4.  **Implement Common Features (As Needed):**

    - Add pagination (`?limit`/`?offset`) to endpoints that return large collections.
    - Add `?include=` support for other desired resources.

5.  **Enforce Explicit Return Types:**
    - Go through each function in the refactored feature's `service` and `repository` files.
    - Add explicit return types to all function signatures (e.g., `Promise<DBProfile | null>`, `Promise<void>`).

---

## Phase 4: External Service Refactoring

**Goal:** Refactor the ESPN client to use the Adapter Pattern.

1.  **Isolate `sportsData` Feature:** Ensure all logic related to sports data syncing (from `src/api/routes/crons` and `src/db/helpers`) has been moved into the `src/features/sportsData` directory.

2.  **Create Adapter Interface:**

    - Create `src/features/sportsData/adapters/sportsData.provider.ts`.
    - Define a generic `ISportsDataProvider` interface with methods like `getSeasons`, `getWeeks`, etc.

3.  **Implement ESPN Adapter:**

    - Create `src/features/sportsData/adapters/espn.adapter.ts`.
    - Move the existing ESPN API client logic into a class that implements the `ISportsDataProvider` interface.

4.  **Refactor Service:**
    - Update `sportsData.service.ts` to depend on the `ISportsDataProvider` interface, not the concrete ESPN adapter.
    - Inject the `espnAdapter` when instantiating the service.

---

## Phase 5: Implement Testing (Future Goal)

**Goal:** Establish a robust testing suite for the application to ensure long-term stability and catch regressions.

**Note:** This phase should only be started after the architectural refactoring is complete. The goal of the current migration is to _enable_ testability.

1.  **Set Up Testing Environment:**

    - Configure a testing framework (e.g., Jest or Vitest).
    - Create a global setup file to mock the `db` client, preventing unit tests from making real database connections, as detailed in `STANDARDS.md`.
    - Set up a process for running integration tests against a test database.

2.  **Write Service Unit Tests:**

    - For each feature, write comprehensive unit tests for the service class, mocking its dependencies (repositories and other services).

3.  **Write Repository Integration Tests:**
    - For each feature, write integration tests for the repository class, verifying its methods against a real database schema.

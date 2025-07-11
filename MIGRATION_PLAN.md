# API & Architecture Migration Plan

This document outlines the tactical steps to refactor the codebase to align with the new `STANDARDS.md`. It should be executed in the order presented to minimize disruption.

## Phase 1: Foundational Setup

**Goal:** Prepare the workspace for the new architecture.

1.  **Create Directories:**
    - Create the primary `src/features` directory.

---

## Phase 2: Architectural Refactoring (Feature by Feature)

**Goal:** Migrate the entire codebase to the feature-sliced architecture. This should be done one feature at a time to ensure stability.

**Repeat this process for each feature (`profiles`, `leagues`, `leagueInvites`, `sportsData`, etc.):**

### Example Migration: The `profiles` Feature

1.  **Create Feature Directory:**

    - Create `src/features/profiles/`.

2.  **Move and Rename Files:**

    - **Router:** Move `src/api/routes/v1/profiles.ts` to `src/features/profiles/profiles.router.ts`.
    - **Repository:** Move `src/db/helpers/profiles.ts` to `src/features/profiles/profiles.repository.ts`.
    - **Types:** Create a new `src/features/profiles/profiles.types.ts` and consolidate the contents of `src/lib/models/profiles/` into it. This includes Zod schemas from `validations.ts` and any related types or constants.

3.  **Create Service Layer:**

    - Create a new `src/features/profiles/profiles.service.ts`.
    - Extract all business logic from `profiles.router.ts` and move it into service functions within this new file.

4.  **Refactor and Update Imports:**

    - **Router:** The `profiles.router.ts` should now be a thin wrapper that imports from `profiles.service.ts`.
    - **Service:** The `profiles.service.ts` will import from `profiles.repository.ts`.
    - **Update Main Router:** In `src/api/routes/v1/index.ts`, update the import path to point to the new `profiles.router.ts` location.
    - Fix any other broken imports across the application that referenced the moved files.

5.  **Test:**
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

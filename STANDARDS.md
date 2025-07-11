# PicksLeagues Engineering Standards

This document is the single source of truth for the architectural patterns and API design standards used in this repository. All new code should adhere to these guidelines.

## Part 1: Architecture

### 1.1. Feature-Sliced Architecture

We use a feature-sliced architecture. The primary principle is that all files related to a single business feature are co-located in the same directory. This promotes high cohesion and discoverability.

- **Primary Directory:** `src/features/`
- Each feature gets its own subdirectory (e.g., `src/features/leagues/`, `src/features/profiles/`).

### 1.2. Directory Structure Overview

```
src/
├── api/                  # Express server setup and feature router mounting
├── features/             # All business features
│   ├── leagues/          # Example user-facing feature
│   └── sportsData/       # Example backend capability feature
├── db/                   # Global Drizzle ORM schema and client
├── lib/                  # Truly generic, cross-cutting concerns (auth, loggers)
└── views/                # Server-rendered pages (EJS)
```

### 1.3. Layers of a Feature

Each feature directory should be internally structured by technical responsibility.

```
src/features/leagues/
├── leagues.router.ts      # (Router) Handles HTTP req/res, calls service.
├── leagues.service.ts     # (Service) Core business logic, orchestrates repository.
├── leagues.repository.ts  # (Repository) All database interactions for this feature.
├── leagues.types.ts       # All TypeScript types and interfaces for this feature.
├── leagues.validators.ts  # Zod schemas for request validation.
└── adapters/              # (Optional) For connecting to external services.
```

- **Router:** The thinnest possible layer. Its only job is to parse the request, call a single service function, and format the response or error. It is the only layer that should depend on `express`.
- **Service:** The core of the feature. Contains all business logic, validation, and orchestration. It is framework-agnostic (no `req`/`res`).
- **Repository:** The database access layer. All Drizzle ORM queries related to the feature live here.

### 1.4. Cross-Feature Communication

- **Rule:** A feature may only communicate with another feature by importing from its **service** file. Never directly access another feature's repository. This treats each feature as a "black box" with a well-defined public API.
- **Data Models:** A feature that "owns" a data model (e.g., `profiles` owns the `Profile` type) is the source of truth for that type. Other features should import types directly from the owning feature's `.types.ts` file.

### 1.5. External Services (The Adapter Pattern)

When a feature needs to communicate with an external API (e.g., ESPN), it must use the Adapter Pattern.

1.  **Define an Interface:** Inside `src/features/[featureName]/adapters/`, create a generic interface that defines the data and methods the service needs, independent of any specific provider.
2.  **Create an Adapter:** Create a concrete implementation of the interface for a specific provider (e.g., `espn.adapter.ts`). This file contains the API client logic and data transformation.
3.  **Inject the Dependency:** The feature's service should depend on the **interface**, not the concrete adapter. This decouples the business logic from the specific external API client.

---

## Part 2: API Design Guide

### 2.1. URL Structure & Naming

- **Plural Nouns:** Use plural nouns for collections (e.g., `/leagues`).
- **Nesting:** Nest for clear parent-child relationships (e.g., `/leagues/:id/members`).
- **Versioning:** All endpoints are prefixed with `/v1`.
- **Case:** Use `camelCase` for all JSON keys and query parameters.

### 2.2. HTTP Methods

- `GET`: Retrieve resources.
- `POST`: Create a new resource.
- `PATCH`: Partially update an existing resource.
- `PUT`: Completely replace an existing resource.
- `DELETE`: Delete a resource.

### 2.3. Request & Response Format

- **JSON Everywhere:** API accepts and returns JSON. `Content-Type: application/json` is required for requests with a body.
- **Error Format:** All `4xx` and `5xx` errors **must** return a consistent JSON object:
  ```json
  {
    "error": {
      "message": "A human-readable error description.",
      "code": "a_stable_machine_readable_code"
    }
  }
  ```

### 2.4. Common Features

These features should be implemented consistently _when required_ by a client.

- **Pagination:** Use `?limit=` (default `25`, max `100`) and `?offset=` (default `0`).
- **Resource Inclusion:** Use `?include=` with comma-separated values. Use dot notation for nested includes (e.g., `?include=members.profile`).
- **Filtering:** Use simple, `camelCase` key-value query parameters (e.g., `?status=active`).

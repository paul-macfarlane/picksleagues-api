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
├── leagues.types.ts       # (Types) Zod schemas, TS types, and constants.
└── adapters/              # (Optional) For connecting to external services.
```

- **Router:** The thinnest possible layer. Its only job is to parse the request, call a single service function, and format the response or error. It is the only layer that should depend on `express`.
- **Service:** The core of the feature. Contains all business logic, validation, and orchestration. It is framework-agnostic (no `req`/`res`).
- **Repository:** The database access layer. All Drizzle ORM queries related to the feature live here.
- **Types:** Defines the data contract for the feature. Contains Zod schemas for validation, infers TypeScript types from them, and holds any feature-specific constants.

### 1.4. Validation Strategy

We employ a two-tiered validation strategy:

- **Shape Validation (in the Router):** The router is responsible for validating the _shape_ and _data types_ of the incoming request payload. It should use `zodSchema.parse()` to achieve this. This ensures that the service layer never receives a malformed request. If parsing fails, a `ZodError` is thrown and handled by our central error handler.
- **Business Rule Validation (in the Service):** The service is responsible for validating the data against _business rules_ (e.g., checking if a username is already taken). This logic requires application context and often database access.

### 1.5. Cross-Feature Communication

- **Rule:** A feature may only communicate with another feature by importing from its **service** file. Never directly access another feature's repository. This treats each feature as a "black box" with a well-defined public API.
- **Data Models:** A feature that "owns" a data model (e.g., `profiles` owns the `Profile` type) is the source of truth for that type. Other features should import types and schemas directly from the owning feature's `.types.ts` file.

### 1.6. External Services (The Adapter Pattern)

When a feature needs to communicate with an external API (e.g., ESPN), it must use the Adapter Pattern.

1.  **Define an Interface:** Inside `src/features/[featureName]/adapters/`, create a generic interface that defines the data and methods the service needs, independent of any specific provider.
2.  **Create an Adapter:** Create a concrete implementation of the interface for a specific provider (e.g., `espn.adapter.ts`). This file contains the API client logic and data transformation.
3.  **Inject the Dependency:** The feature's service should depend on the **interface**, not the concrete adapter. This decouples the business logic from the specific external API client.

---

## Part 2: API Design Guide

### 2.1. URL Structure

- **Use Plural Nouns for Collections:**

  - _Good_: `/leagues`, `/users`, `/leagues/abc-123/members`
  - _Bad_: `/league`, `/getUser`, `/leagueMembers`

- **Nesting for Relationships**: Nest resources to represent clear parent-child relationships.

  - `GET /leagues/:leagueId/members` - Get all members for a specific league.
  - `GET /leagues/:leagueId/members/:memberId` - Get a specific member from a specific league.

- **Versioning**: All API endpoints are prefixed with a version number.
  - _Example_: `/api/v1/leagues`

### 2.2. Naming Conventions

- **JSON Keys**: Use `camelCase` for all keys in JSON request and response bodies.
  ```json
  {
    "leagueId": "uuid-goes-here",
    "createdAt": "2023-10-27T10:00:00Z"
  }
  ```
- **Query Parameters**: Use `camelCase` for query parameters.
  - _Example_: `/leagues?leagueType=pick-em`

### 2.3. HTTP Methods

Use the standard HTTP methods to describe the action being performed.

- `GET`: Retrieve one or more resources.
- `POST`: Create a new resource.
- `PATCH`: Partially update an existing resource. The request body should contain only the fields to be changed.
- `PUT`: Completely replace an existing resource. The request body should contain the complete resource representation.
- `DELETE`: Delete a resource.

### 2.4. Request & Response Format

- **JSON Everywhere**: The API accepts and returns JSON exclusively. Clients must send `Content-Type: application/json` for `POST`, `PUT`, and `PATCH` requests with a body.

- **Successful `GET` Response (Single Resource)**

  ```json
  {
    "id": "league-uuid-1",
    "name": "The Grand Tournament",
    "status": "active"
  }
  ```

- **Successful `GET` Response (Collection)**

  ```json
  [
    { "id": "league-uuid-1", "name": "The Grand Tournament" },
    { "id": "league-uuid-2", "name": "The Winter Classic" }
  ]
  ```

- **Error Response**: All `4xx` and `5xx` errors **must** return a consistent JSON error object. This allows clients to have a single way of handling all API errors.
  ```json
  // Status: 403 Forbidden
  {
    "error": {
      "message": "You do not have permission to view these members.",
      "code": "permission_denied" // A stable, machine-readable error code
    }
  }
  ```

### 2.5. HTTP Status Codes

Use standard HTTP status codes to indicate the outcome of a request.

- `200 OK`: The request was successful (used for `GET`, `PUT`, `PATCH`).
- `201 Created`: The resource was successfully created (used for `POST`).
- `204 No Content`: The request was successful, but there is no data to return (used for `DELETE`).
- `400 Bad Request`: The request was malformed (e.g., invalid JSON, missing parameters).
- `401 Unauthorized`: The request requires authentication, but none was provided.
- `403 Forbidden`: The authenticated user does not have permission to perform the action.
- `404 Not Found`: The requested resource does not exist.
- `

---

## Part 3: TypeScript Best Practices

### 3.1. Return Type Explicitness

We favor explicit return types to act as enforced documentation and prevent accidental data leaks. This is especially critical at architectural boundaries.

#### ALWAYS Use Explicit Return Types For:

1.  **All Functions at Architectural Boundaries:**

    - **Repository Functions:** Must return a clearly defined database model (e.g., `Promise<DBProfile | null>`).
    - **Service Functions:** Must return a well-defined entity or DTO.
    - **Router/Controller Handlers:** While often `Promise<void>`, being explicit prevents bugs.

2.  **All Exported Functions (`export function ...`):**
    - If a function is exported from a file, it is part of that file's public API. Its contract must be explicit.

#### It's OK to Use Implicit Return Types For:

1.  **Short, Single-Line Arrow Functions:**

    - Especially inside other functions like array methods (`.map`, `.filter`). The local context makes the return type obvious.
    - _Example_: `const userIds = users.map(user => user.id); // Implicit is fine here`

2.  **Private, Internal Helper Functions:**
    - If a function is not exported and is only used as a simple helper within the same file, inference is acceptable.

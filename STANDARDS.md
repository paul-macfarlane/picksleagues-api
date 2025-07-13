# PicksLeagues Engineering Standards

This document is the single source of truth for the architectural patterns and API design standards used in this repository. All new code should adhere to these guidelines.

## Part 1: Architecture

### 1.1. Core Principles: Feature-Sliced and Object-Oriented

Our architecture is built on two core principles:

1.  **Feature-Sliced:** Logic is grouped by business domain, not technical layer.
2.  **Object-Oriented with Dependency Injection:** Layers within a feature are represented by classes, and their dependencies are "injected" into their constructors. This promotes loose coupling and high testability.

### 1.2. What is a "Feature"?

A "feature" is a vertical slice of business functionality that is centered around a **single primary data entity or business domain**.

- **Good:** `leagues`, `profiles`, `leagueMembers`. Each of these corresponds to a specific table in our database and a clear set of business rules.
- **Bad:** `userManagement`, `settings`. These are too broad and should be broken down.

The goal is for each feature directory to be the single source of truth for all logic related to its domain.

### 1.3. Layers of a Feature

Each feature is composed of class-based layers, each with a distinct responsibility.

```
src/features/leagues/
├── leagues.router.ts      # (Composition Root) Instantiates and wires dependencies. Handles HTTP.
├── leagues.service.ts     # (Service Class) Core business logic.
├── leagues.repository.ts  # (Repository Class) All database interactions.
└── leagues.types.ts       # (Shared) Zod schemas, TS types, and constants.
```

- **Repository (`ProfilesRepository`):** A class whose methods map directly to database operations (e.g., `create`, `findById`). It knows _nothing_ about other features.
- **Service (`ProfilesService`):** A class that contains the core business logic. It depends on one or more repositories and potentially other services, which are injected into its constructor.
- **Router (Composition Root):** For now, the router file acts as the "composition root." It is responsible for instantiating the repository and service classes for its feature and wiring them together. It then handles HTTP requests by calling methods on the service instance.

### 1.4. The Integrations Layer

While "features" represent our internal business domains, the `src/integrations` directory is responsible for communicating with the outside world.

- **Purpose:** This directory houses clients or adapters for third-party services (e.g., ESPN API, Stripe for payments, etc.).
- **Structure:** Each integration should be encapsulated within its own `@injectable` service (e.g., `EspnService`). This service will contain all the logic for making network requests and translating the external data into a format our application can use.

This pattern is critical for testability. By wrapping external calls in an injectable service, we can easily provide a mock version of that service in our unit tests, preventing real network calls and allowing us to simulate any API response.

### 1.5. Dependency Injection and Inversion of Control (IoC)

To keep our code decoupled and testable, we strictly follow the principle of Inversion of Control. A class **must not** create its own dependencies. Instead, its dependencies must be passed (injected) into its constructor.

```typescript
// Good: Dependencies are injected
export class ProfilesService {
  private profilesRepository: ProfilesRepository;
  private notificationsService: NotificationsService;

  constructor(
    profilesRepository: ProfilesRepository,
    notificationsService: NotificationsService,
  ) {
    this.profilesRepository = profilesRepository;
    this.notificationsService = notificationsService;
  }
}
```

This is a **strict rule**. It is what allows us to swap implementations and, critically, to provide _mock_ dependencies during testing.

### 1.6. Validation Strategy

We employ a two-tiered validation strategy:

- **Shape Validation (in the Router):** The router is responsible for validating the _shape_ and _data types_ of the incoming request payload. It should use `zodSchema.parse()` to achieve this. This ensures that the service layer never receives a malformed request. If parsing fails, a `ZodError` is thrown and handled by our central error handler.
- **Business Rule Validation (in the Service):** The service is responsible for validating the data against _business rules_ (e.g., checking if a username is already taken). This logic requires application context and often database access.

### 1.7. Cross-Feature Communication: Avoiding Circular Dependencies

The relationship between services is governed by a "Command vs. Query" distinction to prevent circular dependencies.

- **For Commands (Write Operations): Services MUST Call Services.**
  When a business process requires changing data across multiple domains (e.g., creating a league and its first member), the primary service (`LeaguesService`) **must** call the other service (`LeagueMembersService`) to ensure all business rules are enforced. This is essential for data integrity.

- **For Queries (Read Operations): Routers Compose Views.**
  When a use case requires fetching data from multiple domains for a read-only view (e.g., getting a profile and all their leagues), this composition should happen in the **router**. The router will call `profilesService.get(...)` and `leaguesService.get(...)` and assemble the response. This prevents services from needing to know about each other for simple read operations, which is the primary cause of circular dependencies.

### 1.8. Transaction Management

Our approach to transactions remains the same but adapts to the class-based pattern. Service methods that perform writes must accept an optional `dbOrTx` argument, allowing them to participate in transactions started by other services or the router.

- **Repositories are Transaction-Agnostic:** Repository methods must accept an optional `dbOrTx` argument.
- **Services are Transaction-Agnostic:** Service methods that perform database operations must also accept an optional `dbOrTx` argument and pass it down to the repository.

### 1.9. Service Layer Method Naming

To make inter-service communication predictable, all services **must** adhere to the following conventions for methods that retrieve data.

#### General Structure: `{get|find|list}By{Filter}With{Relations}`

This structure makes method names self-documenting.

- **Prefix (`get`, `find`, `list`):** Defines the "not found" behavior (see below).
- **`By{Filter}`:** The primary `where` clause of the query (e.g., `ById`, `ByEmail`, `ByLeagueId`).
- **`With{Relations}` (Optional):** Specifies any related entities that are being joined and returned with the primary entity (e.g., `WithMembers`, `WithLeagueType`).
- **`ForUser` (Optional):** Indicates that the query is being performed on behalf of a specific user, and the method includes permission checks to ensure that user is authorized to view the data.

**Examples:**

- `getById(id)`
- `findById(id)`
- `findByEmail(email)`
- `listByLeagueId(leagueId)`
- `listByLeagueIdWithMembers(leagueId)`
- `listMembersForUserByLeagueId(userId, leagueId)`
- `getMemberForUserByLeagueId(userId, leagueId)`

#### "Not Found" Behavior by Prefix

The prefix of a method name clearly defines its behavior when the requested resource(s) cannot be found.

- #### `get...` methods (e.g., `getById`, `getUserProfile`)

  - **Returns:** A single, complete entity.
  - **On Not Found:** **Throws a `NotFoundError`**.
  - **Implementation:** Should call its corresponding `find...` method and throw an error if the result is `null`.
  - **Use When:** The resource is essential for the current operation to continue.

- #### `find...` methods (e.g., `findById`, `findUserByEmail`)

  - **Returns:** A single entity or `null`.
  - **On Not Found:** **Returns `null`**. Must not return `undefined`.
  - **Use When:** Checking for the existence of an entity is part of the business logic.

- #### `list...` methods (e.g., `listByLeagueId`, `listActiveUsers`)
  - **Returns:** An array of entities (`[]`).
  - **On Not Found:** **Returns an empty array (`[]`)**.
  - **Use When:** Retrieving a collection of resources.

---

## Part 2: Testing Strategy

_Note: This section outlines the testing strategy we will adopt. The actual implementation of tests is a future task._

Our testing strategy is pragmatic, focusing effort where it provides the most value.

### 2.1. Service Layer: Unit Tests (High Priority)

The service layer contains our most complex business logic, making it the ideal candidate for unit tests.

- **Goal:** Test each service class in complete isolation from the database and other services.
- **Method:** We will use a testing framework (e.g., Jest, Vitest) to write unit tests for our service classes.
- **Mocking:** Dependencies (repositories, other services) will be provided as mock objects during test setup. This is made easy by our Dependency Injection pattern.

### 2.2. Repository Layer: Integration Tests (Medium Priority)

Unit testing repositories provides little value, as they are simple wrappers around database queries.

- **Goal:** Verify that our database queries are syntactically correct and behave as expected against a real database schema.
- **Method:** We will write integration tests that run against a temporary, containerized test database. Each test will execute a repository method and assert the state of the database before and after.

### 2.4. Mocking Strategy: Pragmatic Mocks over Formal Interfaces

For unit testing our services, we will provide mocks for their dependencies (e.g., repositories). There are two common ways to do this:

1.  **Formal Interfaces:** Define an `interface` for each repository (e.g., `IProfilesRepository`) and create a mock class that `implements` this interface. This provides strong compile-time safety but adds significant boilerplate and maintenance overhead.
2.  **Structural Mocks (Our Choice):** Create a plain JavaScript object that has the same methods and properties as the real repository class, using a library like Jest to create mock functions (`jest.fn()`).

We have chosen **Option 2**. TypeScript's structural typing already gives us a strong degree of safety, ensuring our mock object has the correct "shape." This approach provides almost all of the benefits of formal interfaces with significantly less code duplication and maintenance cost, making it the more pragmatic choice for this project.

### 2.3. Preventing Accidental DB Connections in Unit Tests

To ensure our unit tests are fast and reliable, they must never touch a real database. We will enforce this by globally mocking the application's database client in our unit testing environment setup. This guarantees that any code that accidentally tries to connect to the database will receive a harmless mock object instead.

---

## Part 3: API Design Guide

### 3.1. URL Structure

- **Use Plural Nouns for Collections:**

  - _Good_: `/leagues`, `/users`, `/leagues/abc-123/members`
  - _Bad_: `/league`, `/getUser`, `/leagueMembers`

- **Nesting for Relationships**: Nest resources to represent clear parent-child relationships.

  - `GET /leagues/:leagueId/members` - Get all members for a specific league.
  - `GET /leagues/:leagueId/members/:memberId` - Get a specific member from a specific league.

- **Versioning**: All API endpoints are prefixed with a version number.
  - _Example_: `/api/v1/leagues`

### 3.2. Naming Conventions

- **JSON Keys**: Use `camelCase` for all keys in JSON request and response bodies.
  ```json
  {
    "leagueId": "uuid-goes-here",
    "createdAt": "2023-10-27T10:00:00Z"
  }
  ```
- **Query Parameters**: Use `camelCase` for query parameters.
  - _Example_: `/leagues?leagueType=pick-em`

### 3.3. HTTP Methods

Use the standard HTTP methods to describe the action being performed.

- `GET`: Retrieve one or more resources.
- `POST`: Create a new resource.
- `PATCH`: Partially update an existing resource. The request body should contain only the fields to be changed.
- `PUT`: Completely replace an existing resource. The request body should contain the complete resource representation.
- `DELETE`: Delete a resource.

### 3.4. Request & Response Format

- **JSON Everywhere**: The API accepts and returns JSON exclusively. Clients must send `Content-Type: application/json` for `POST`, `PUT`, and `PATCH` requests with a body.

---

## Part 4: API Versioning Strategy

This section outlines the strategy for evolving the API by introducing new versions without breaking existing clients.

### 4.1. Philosophy: Default + Override

Our versioning strategy is built on a "Default + Override" model. This provides a clear, maintainable path for evolution while maximizing code reuse.

- **The "Default" Implementation**: For any given feature, the primary router file (e.g., `leagues.router.ts`) represents the **current, stable, and recommended implementation**. It is not explicitly versioned in its filename.
- **The "Override" Implementation**: When a new API version introduces a **breaking change** to a feature, we create a new, version-specific router file (e.g., `profiles.v2.router.ts`). This file acts as an override for that specific version.

This approach ensures that a developer can always find the "main" logic in the default, un-versioned file, and only needs to look at versioned files to understand specific historical changes.

### 4.2. How to Introduce a Breaking Change (e.g., for V2)

The following steps should be followed to introduce a breaking change to an existing V1 endpoint.

1.  **Do Not Modify the V1 Router**: The original router (e.g., `profiles.router.ts`) must remain **untouched** to ensure continued support for all V1 clients.

2.  **Create a Versioned "Override" Router**: In the same feature directory, create a new router with a version suffix. Implement the new, breaking logic here.

    - _Example_: `src/features/profiles/profiles.v2.router.ts`

3.  **Create a New V2 Composition Root**: Create a new aggregator for the V2 API.

    - _Example_: `src/api/v2.router.ts`

4.  **Compose the V2 API**: Inside the new `v2.router.ts`, compose the API by:

    - Importing the **new, version-specific override router** (`profiles.v2.router.ts`) for any feature that has changed.
    - Importing and **reusing the stable, un-versioned "default" routers** (`leagues.router.ts`, etc.) for all features that have _not_ changed.

5.  **Activate the New Version**: In the main `src/api/router.ts`, import and mount the new V2 router, making it accessible via the `/api/v2` prefix.

This strategy ensures that `GET /api/v1/profiles` and `GET /api/v2/profiles` can be served simultaneously with different logic, while `GET /api/v1/leagues` and `GET /api/v2/leagues` are both served by the same, reusable code.

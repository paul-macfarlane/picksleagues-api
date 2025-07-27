# PicksLeagues API

This repository contains the backend API for the PicksLeagues application, built with Node.js, Express, and TypeScript.

## Architecture & Engineering Standards

This project follows a feature-sliced architecture. All new code and architectural decisions should adhere to the official guide defined in [**STANDARDS.md**](./STANDARDS.md). This document is the single source of truth for our engineering practices.

The project also includes a comprehensive seeding strategy that supports both real data (ESPN integration) and mock data (development/testing) approaches. See [**SEEDING_STRATEGY.md**](./src/db/seed/SEEDING_STRATEGY.md) for detailed information about our seeding practices.

## Tech Stack

- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Better Auth

## Local Development Setup

These steps will guide you through setting up a local development environment.

### 1. Environment Variables

Copy the example environment file and fill in the required values. The default values are configured to work with the Docker setup below.

```bash
cp .env.example .env
```

### 2. Start the Database

This project includes a Docker Compose configuration for running a local PostgreSQL database.

```bash
docker compose up -d
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Database Migrations & Seeding

This command will apply all necessary database migrations and run the initial seed scripts to populate the database with essential data like league types.

```bash
npm run setup:dev
```

#### Seeding Options

The project supports two types of seeding:

**Real Data Seeding** (ESPN Integration):

```bash
npm run db:seed
```

This populates the database with actual ESPN data via cron jobs. Requires ESPN API credentials.

**Mock Data Seeding** (Development/Testing):

```bash
# Set up minimal base data
npm run db:seed:base

# Seed pick'em leagues with mock data
npm run db:seed:pickem -- preseason --leagues 2 --users 5
```

**Note**: When using npm scripts, you must use the `--` separator before arguments to ensure they are properly passed to the CLI tool.

For detailed seeding documentation, see [src/db/seed/README.md](./src/db/seed/README.md) and [src/db/seed/SEEDING_STRATEGY.md](./src/db/seed/SEEDING_STRATEGY.md).

### 5. Start the Development Server

This will start the API server with hot-reloading enabled.

```bash
npm run dev
```

The API will be available at `http://localhost:3001`.

## Database Seeding

The PicksLeagues API supports two seeding approaches to populate the database with test data:

### Real Data Seeding (ESPN Integration)

For production environments or when you need real sports data:

```bash
npm run db:seed
```

This approach:

- Fetches real data from ESPN APIs
- Populates actual teams, games, and scores

### Mock Data Seeding (Development/Testing)

For development, testing, and demonstration purposes:

```bash
# Set up minimal base data
npm run db:seed:base

# Seed pick'em leagues with mock data
npm run db:seed:pickem preseason --leagues 2 --users 5
```

This approach:

- Generates realistic fictional data
- No external API dependencies
- Fast and reliable execution
- Supports different season phases (offseason, preseason, in-season, end-season)
- Creates proper NFL week structure (10 phases, one per week)
- Includes cleanup functionality for consistent testing

### Quick Start for Development

```bash
# 1. Set up the database
npm run setup:dev

# 2. Seed with mock data for development
npm run db:seed:base
npm run db:seed:pickem -- preseason --cleanup --commissioner my-test-user --leagues 1 --users 3

# 3. Start development server
npm run dev
```

For comprehensive seeding documentation, see:

- [Pick'em Leagues Seeding Tool](./src/db/seed/README.md)
- [Seeding Strategy Guide](./src/db/seed/SEEDING_STRATEGY.md)

## Task Management with Backlog.md

This project uses [Backlog.md](https://github.com/MrLesk/Backlog.md) for managing tasks. All tasks are defined as Markdown files in the `backlog/tasks` directory.

### Using the Command Line

A set of `npm` scripts are provided for common `backlog.md` operations:

- `npm run backlog:list`: Lists all tasks in the backlog.
- `npm run backlog:view <task-id>`: Displays the details of a specific task.
- `npm run backlog:create "Task Title"`: Creates a new task.
- `npm run backlog:edit <task-id>`: Edits an existing task.

### Using the Web Interface

`Backlog.md` also provides a web-based UI for a more visual way to manage tasks.

- `npm run backlog:ui`: Starts the `backlog.md` web interface.

Once started, you can access the UI at the URL provided in the console (usually `http://localhost:6421`).

### 6. (Optional) Populate with Real Sports Data

To populate the database with real-world sports data (leagues and seasons), you can run the cron job endpoints manually.

**Note**: This is for production or integration testing. For development, use the mock data seeding approach above.

_Note: You will need the `CRON_API_KEY` from your `.env` file._

```bash
# assumes you have run the setup:dev script

# First, sync the available sport leagues
curl http://localhost:3001/api/crons/sport-leagues --header "x-cron-api-key: local"

# run the seed script again to populate the database with the phase templates based off of the NFL league that was created
npm run db:seed

# Then, sync the seasons for those leagues
curl http://localhost:3001/api/crons/seasons --header "x-cron-api-key: local"

# Then, sync the teams for those leagues
curl http://localhost:3001/api/crons/teams --header "x-cron-api-key: local"

# Then, sync the phases for those seasons
curl http://localhost:3001/api/crons/phases --header "x-cron-api-key: local"

# Then, sync the events for those phases
curl http://localhost:3001/api/crons/events --header "x-cron-api-key: local"

# You can sync odds for the current or next phase by running the following command
curl http://localhost:3001/api/crons/events/withOdds --header "x-cron-api-key: local"

# You can sync live scores for the current or next phase by running the following command
curl http://localhost:3001/api/crons/events/withLiveScores --header "x-cron-api-key: local"
```

## Available Scripts

### Development

- `npm run dev`: Starts the development server with hot-reloading.
- `npm run setup:dev`: Runs database migrations and initial seeds. A great first step.
- `npm run build`: Compiles the TypeScript code to JavaScript.
- `npm start`: Starts the compiled application (for production).

### Database Management

- `npm run db:migrate`: Applies pending database migrations.
- `npm run db:generate`: Generates a new migration based on schema changes.
- `npm run db:studio`: Opens Drizzle Studio to view and manage your database.

### Seeding

- `npm run db:seed`: Runs the seed scripts to populate the database with real ESPN data.
- `npm run db:seed:base`: Sets up minimal base data for mock seeding.
- `npm run db:seed:pickem`: Seeds pick'em leagues with mock data for development/testing.

### Task Management

- `npm run backlog:list`: Lists all tasks in the backlog.
- `npm run backlog:view <task-id>`: Displays the details of a specific task.
- `npm run backlog:create "Task Title"`: Creates a new task.
- `npm run backlog:edit <task-id>`: Edits an existing task.
- `npm run backlog:ui`: Starts the `backlog.md` web interface.

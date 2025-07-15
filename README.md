# PicksLeagues API

This repository contains the backend API for the PicksLeagues application, built with Node.js, Express, and TypeScript.

## Architecture & Engineering Standards

This project follows a feature-sliced architecture. All new code and architectural decisions should adhere to the official guide defined in [**STANDARDS.md**](./STANDARDS.md). This document is the single source of truth for our engineering practices.

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

### 5. Start the Development Server

This will start the API server with hot-reloading enabled.

```bash
npm run dev
```

The API will be available at `http://localhost:3001`.

### 6. (Optional) Populate with Dynamic Sports Data

To populate the database with real-world sports data (leagues and seasons), you can run the cron job endpoints manually.

_Note: You will need the `CRON_API_KEY` from your `.env` file._

```bash
# First, sync the available sport leagues
curl http://localhost:3001/api/crons/sport-leagues --header "x-cron-api-key: local"

# run the seed script again to populate the database with the phase templates based off of the NFL league that was created
npm run db:seed

# Then, sync the seasons for those leagues
curl http://localhost:3001/api/crons/seasons --header "x-cron-api-key: local"

# Then, sync the phases for those seasons
curl http://localhost:3001/api/crons/phases --header "x-cron-api-key: local"
```

## Available Scripts

- `npm run dev`: Starts the development server with hot-reloading.
- `npm run setup:dev`: Runs database migrations and initial seeds. A great first step.
- `npm run db:migrate`: Applies pending database migrations.
- `npm run db:generate`: Generates a new migration based on schema changes.
- `npm run db:seed`: Runs the seed scripts to populate the database.
- `npm run db:studio`: Opens Drizzle Studio to view and manage your database.
- `npm run build`: Compiles the TypeScript code to JavaScript.
- `npm start`: Starts the compiled application (for production).

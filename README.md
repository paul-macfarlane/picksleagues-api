# Picks Leagues API

## Description

This is the API for the Picks Leagues app.

## Tech Stack

- Node.js
- Express
- PostgreSQL
- TypeScript
- Drizzle ORM
- Better Auth

## API Pattern

RESTful API, with some exceptions for uis that would be shared accross clients and require the same composition of data.

## Running Locally

1. Copy .env.example to .env and fill in the values

2. Run a local database. This is setup to use docker compose, but you could also use a local postgres instance:

   ```bash
   docker compose up -d
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Run the migrations:

   ```bash
   npm run db:migrate
   ```

5. Run the initial seed:

   ```bash
   npm run db:seed
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

7. Run the cron jobs for sport league data:

   ```bash
   curl http://localhost:3001/api/crons/sport-leagues --header "x-cron-api-key: <api-key>"
   ```

8. Re-run the seed job to insert phase templates:

   ```bash
   npm run db:seed
   ```

9. Run the cron jobs for season data:

   ```bash
   curl http://localhost:3001/api/crons/seasons --header "x-cron-api-key: <api-key>"
   ```

10. Now you can use the app with some seeded data!

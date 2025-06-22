# Picks Leagues API

## Description

This is the API for the Picks Leagues app.

## Tech Stack

- Node.js
- Express
- PostgreSQL
- TypeScript
- Drizzle ORM
- Firebase Auth

## API Pattern

RESTful API, with some exceptions for uis that would be shared accross clients and require the same composition of data.

## Running Locally

1. Copy .env.example to .env and fill in the values

2. Run a local database. This is setup to use docker compose, but you could also use a local postgres instance:

   ```bash
   docker compose up -d
   ```

3. Run the migrations:

   ```bash
   npm run db:migrate
   ```

4. Install dependencies:

   ```bash
   npm install
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. For production build:
   ```bash
   npm run build
   npm start
   ```

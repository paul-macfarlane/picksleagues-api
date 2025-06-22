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

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. For production build:
   ```bash
   npm run build
   npm start
   ```

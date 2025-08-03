import "dotenv/config.js";
import * as schema from "./schema.js";
import { ExtractTablesWithRelations } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import {
  NodePgDatabase,
  NodePgQueryResultHKT,
} from "drizzle-orm/node-postgres";
import { Pool } from "@neondatabase/serverless";
import {
  drizzle as drizzleNeon,
  NeonDatabase,
  NeonQueryResultHKT,
} from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";

export type DB = NodePgDatabase<typeof schema> | NeonDatabase<typeof schema>;

export type DBTx = PgTransaction<
  NodePgQueryResultHKT | NeonQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export type DBOrTx = DB | DBTx;

let db: DB;
if (process.env.NODE_ENV === "production") {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  db = drizzleNeon(pool, { schema });
} else {
  db = drizzlePg(process.env.DATABASE_URL!, { schema });
}

export { db };

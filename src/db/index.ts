import "dotenv/config.js";
import * as schema from "./schema.js";

import { ExtractTablesWithRelations } from "drizzle-orm";
import {
  drizzle,
  NodePgDatabase,
  NodePgQueryResultHKT,
} from "drizzle-orm/node-postgres";
import { PgTransaction } from "drizzle-orm/pg-core";

export const db = drizzle(process.env.DATABASE_URL!, { schema });

export type DB = NodePgDatabase<typeof schema>;

export type DBTx = PgTransaction<
  NodePgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export type DBOrTx = DB | DBTx;

import { usersTable } from "../../db/schema.js";

// Constants

// DB Types

export type DBUser = typeof usersTable.$inferSelect;

export type DBUserInsert = typeof usersTable.$inferInsert;

export type DBUserUpdate = Partial<DBUserInsert>;

// Validation Schemas

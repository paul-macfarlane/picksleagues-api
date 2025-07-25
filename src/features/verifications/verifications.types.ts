import { verificationTable } from "../../db/schema.js";

export type DBVerification = typeof verificationTable.$inferSelect;
export type DBVerificationInsert = typeof verificationTable.$inferInsert;
export type DBVerificationUpdate = Partial<DBVerificationInsert>;

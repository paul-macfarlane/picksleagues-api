import z from "zod";
import { profilesTable } from "../../db/schema";

// Constants
export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 50;
export const MIN_NAME_LENGTH = 1;
export const MAX_NAME_LENGTH = 50;

// DB Types
export type DBProfile = typeof profilesTable.$inferSelect;
export type DBProfileInsert = typeof profilesTable.$inferInsert;
export type DBProfileUpdate = Partial<DBProfileInsert>;

// Validation Schemas
export const UserIdSchema = z.string().trim();

export const UpdateProfileSchema = z.object({
  username: z
    .string()
    .min(MIN_USERNAME_LENGTH, {
      message: `Must be at least ${MIN_USERNAME_LENGTH} characters`,
    })
    .max(MAX_USERNAME_LENGTH, {
      message: `Must be at most ${MAX_USERNAME_LENGTH} characters`,
    }),
  firstName: z
    .string()
    .min(MIN_NAME_LENGTH, { message: `Required` })
    .max(MAX_NAME_LENGTH, {
      message: `Must be at most ${MAX_NAME_LENGTH} characters`,
    }),
  lastName: z
    .string()
    .min(MIN_NAME_LENGTH, { message: `Last name is required` })
    .max(MAX_NAME_LENGTH, {
      message: `Must be at most ${MAX_NAME_LENGTH} characters`,
    }),
  avatarUrl: z.union([
    z.string().trim().url().optional(),
    z.literal(""),
    z.null(),
  ]),
});

export const SearchProfilesSchema = z.object({
  username: z.string().trim().min(1).optional(),
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
});

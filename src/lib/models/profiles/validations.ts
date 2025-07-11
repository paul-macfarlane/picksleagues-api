import z from "zod";
import {
  MIN_USERNAME_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_NAME_LENGTH,
  MAX_NAME_LENGTH,
} from "./constants";

export const UserIdSchema = z.string().trim();

export const UpdateProfileSchema = z.object({
  username: z
    .string()
    .min(MIN_USERNAME_LENGTH, {
      message: `Username must be at least ${MIN_USERNAME_LENGTH} characters`,
    })
    .max(MAX_USERNAME_LENGTH, {
      message: `Username must be at most ${MAX_USERNAME_LENGTH} characters`,
    }),
  firstName: z
    .string()
    .min(MIN_NAME_LENGTH, { message: `First name is required ` })
    .max(MAX_NAME_LENGTH, {
      message: `First name must be at most ${MAX_NAME_LENGTH} characters`,
    }),
  lastName: z
    .string()
    .min(MIN_NAME_LENGTH, { message: `Last name is required` })
    .max(MAX_NAME_LENGTH, {
      message: `Last name must be at most ${MAX_NAME_LENGTH} characters`,
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

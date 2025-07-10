import { z } from "zod";

export const SearchProfilesSchema = z.object({
  username: z.string().trim().min(1).optional(),
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
});

export type SearchProfiles = z.infer<typeof SearchProfilesSchema>;

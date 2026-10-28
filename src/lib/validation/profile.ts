import { z } from "zod";
import { RESERVED_USERNAMES } from "./reserved";

export const USERNAME_REGEX = /^[a-z0-9_]{3,15}$/;

export const usernameSchema = z
  .string()
  .trim()
  .regex(USERNAME_REGEX, "3–15 characters: lowercase letters, numbers and underscores")
  .refine((username) => !RESERVED_USERNAMES.has(username), "That username is reserved");

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Name can't be empty")
  .max(50, "Name can be at most 50 characters");

export const profileSchema = z.object({
  username: usernameSchema,
  displayName: displayNameSchema,
  bio: z.string().trim().max(160, "Bio can be at most 160 characters"),
  avatarPath: z.string().min(1).nullable(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

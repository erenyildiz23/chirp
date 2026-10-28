import { z } from "zod";
import { displayNameSchema, usernameSchema } from "./profile";

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export const signupSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: usernameSchema,
  displayName: displayNameSchema,
});

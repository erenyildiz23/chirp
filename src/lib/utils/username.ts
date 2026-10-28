import { USERNAME_REGEX } from "@/lib/validation/profile";

export function isValidUsername(s: string): boolean {
  return USERNAME_REGEX.test(s);
}

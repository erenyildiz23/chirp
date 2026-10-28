import type { EmailOtpType } from "@supabase/supabase-js";
import { safeNext } from "./redirect";

// Link types this app sends by email. Others (invite, recovery, ...) are not used yet.
const ALLOWED_TYPES: EmailOtpType[] = ["email", "signup", "email_change"];

export type ConfirmParams = { tokenHash: string; type: EmailOtpType; next: string };

/** Reads an email confirmation link (token_hash flow) and rejects anything malformed. */
export function parseConfirmParams(searchParams: URLSearchParams): ConfirmParams | null {
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  if (!tokenHash || !type || !ALLOWED_TYPES.includes(type)) return null;
  return { tokenHash, type, next: safeNext(searchParams.get("next")) };
}

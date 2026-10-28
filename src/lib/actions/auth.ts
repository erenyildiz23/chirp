"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/utils/redirect";
import { loginSchema, signupSchema } from "@/lib/validation/auth";
import { type ActionResult, fail, fromZodError, ok } from "./result";

const USERNAME_TAKEN = "Username is already taken";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function signUp(_prev: ActionResult<string> | null, formData: FormData): Promise<ActionResult<string>> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    username: String(formData.get("username") ?? "").toLowerCase(),
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) return fromZodError(parsed.error);

  const { email, password, username, displayName } = parsed.data;
  const supabase = await createClient();

  const { data: taken } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
  if (taken) return fail(USERNAME_TAKEN, { username: USERNAME_TAKEN });

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, display_name: displayName },
      emailRedirectTo: `${siteUrl()}/auth/callback`,
    },
  });
  if (error) return fail(error.message);

  // With email confirmation enabled there is no session yet.
  if (!data.session) return ok("Check your email to confirm your account.");
  redirect("/home");
}

export async function signIn(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return fromZodError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return fail("Wrong email or password");

  redirect(safeNext(formData.get("next")?.toString()));
}

export async function signInWithGithub(formData: FormData): Promise<void> {
  const next = safeNext(formData.get("next")?.toString());
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/login?error=github");
  redirect(data.url);
}

export async function signInAsDemo(): Promise<ActionResult> {
  const email = process.env.DEMO_EMAIL;
  const password = process.env.DEMO_PASSWORD;
  if (!email || !password) return fail("Demo is not configured");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return fail("Demo account is unavailable right now");

  redirect("/home");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

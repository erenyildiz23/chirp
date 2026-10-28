"use server";

import { createClient } from "@/lib/supabase/server";
import { type ActionResult, fail, ok } from "./result";

export async function markAllRead(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("You need to log in first");

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .is("read_at", null);
  if (error) return fail("Couldn't update notifications");
  return ok();
}

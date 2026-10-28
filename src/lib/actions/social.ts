"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isIdempotentSuccess } from "./idempotent";
import { type ActionResult, fail, ok } from "./result";

async function currentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

export async function setLike(postId: number, liked: boolean): Promise<ActionResult> {
  const { supabase, userId } = await currentUserId();
  if (!userId) return fail("You need to log in first");

  // Deleting a row that is already gone affects 0 rows and returns no error.
  const { error } = liked
    ? await supabase.from("likes").insert({ user_id: userId, post_id: postId })
    : await supabase.from("likes").delete().eq("user_id", userId).eq("post_id", postId);
  if (!isIdempotentSuccess(error)) return fail(liked ? "Couldn't like the post" : "Couldn't remove the like");

  revalidatePath("/", "layout");
  return ok();
}

export async function setRepost(postId: number, reposted: boolean): Promise<ActionResult> {
  const { supabase, userId } = await currentUserId();
  if (!userId) return fail("You need to log in first");

  const { error } = reposted
    ? await supabase.from("reposts").insert({ user_id: userId, post_id: postId })
    : await supabase.from("reposts").delete().eq("user_id", userId).eq("post_id", postId);
  if (!isIdempotentSuccess(error)) return fail(reposted ? "Couldn't repost" : "Couldn't undo the repost");

  revalidatePath("/", "layout");
  return ok();
}

export async function setFollow(userId: string, following: boolean): Promise<ActionResult> {
  const { supabase, userId: me } = await currentUserId();
  if (!me) return fail("You need to log in first");
  if (me === userId) return fail("You can't follow yourself");

  const { error } = following
    ? await supabase.from("follows").insert({ follower_id: me, followee_id: userId })
    : await supabase.from("follows").delete().eq("follower_id", me).eq("followee_id", userId);
  if (!isIdempotentSuccess(error)) return fail(following ? "Couldn't follow" : "Couldn't unfollow");

  revalidatePath("/", "layout");
  return ok();
}

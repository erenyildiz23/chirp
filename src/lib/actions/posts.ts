"use server";

import { revalidatePath } from "next/cache";
import { getHomeFeed, getProfileTimeline, type TimelineTab } from "@/lib/queries/feed";
import type { FeedCursor, FeedPage } from "@/lib/queries/feed-page";
import { createClient } from "@/lib/supabase/server";
import { isOwnStoragePath } from "@/lib/utils/storage";
import { postSchema } from "@/lib/validation/post";
import { type ActionResult, fail, fromZodError, ok } from "./result";

export async function createPost(input: {
  content: string;
  imagePath: string | null;
  replyToId: number | null;
}): Promise<ActionResult<{ id: number }>> {
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("You need to log in first");

  const { content, imagePath, replyToId } = parsed.data;
  if (imagePath && !isOwnStoragePath(imagePath, user.id)) return fail("Invalid image");

  const { data, error } = await supabase
    .from("posts")
    .insert({ author_id: user.id, content: content || null, image_path: imagePath, reply_to_id: replyToId })
    .select("id")
    .single();
  if (error) {
    return fail(error.code === "23503" ? "The post you're replying to was deleted" : "Couldn't publish your post");
  }

  revalidatePath("/home");
  if (replyToId) revalidatePath("/[username]/status/[id]", "page");
  return ok({ id: data.id });
}

export async function deletePost(postId: number): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("You need to log in first");

  const { data: post, error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", user.id)
    .select("image_path")
    .maybeSingle();
  if (error) return fail("Couldn't delete the post");
  if (!post) return fail("Post not found");

  if (post.image_path) await supabase.storage.from("post-images").remove([post.image_path]);

  revalidatePath("/", "layout");
  return ok();
}

export async function loadMoreHomeFeed(cursor: FeedCursor): Promise<ActionResult<FeedPage>> {
  try {
    return ok(await getHomeFeed(cursor));
  } catch {
    return fail("Couldn't load more posts");
  }
}

export async function loadMoreProfileTimeline(
  username: string,
  tab: TimelineTab,
  cursor: FeedCursor,
): Promise<ActionResult<FeedPage>> {
  try {
    return ok(await getProfileTimeline(username, tab, cursor));
  } catch {
    return fail("Couldn't load more posts");
  }
}

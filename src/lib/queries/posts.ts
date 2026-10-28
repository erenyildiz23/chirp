import { createClient } from "@/lib/supabase/server";
import type { FeedItem } from "./feed-page";

export type PostThread = {
  post: FeedItem;
  parent: FeedItem | null;
  parentDeleted: boolean;
  replies: FeedItem[];
};

export async function getPostThread(postId: number): Promise<PostThread | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("post_thread_items", { p_post_id: postId });
  if (error) throw error;

  const post = data.find((item) => item.post_id === postId);
  if (!post) return null;

  const parent = data.find((item) => post.reply_to_id !== null && item.post_id === post.reply_to_id) ?? null;
  return {
    post,
    parent,
    parentDeleted: Boolean(post.is_reply) && parent === null,
    replies: data.filter((item) => item.reply_to_id === postId),
  };
}

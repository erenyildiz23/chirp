import { createClient } from "@/lib/supabase/server";
import type { Profile } from "./profiles";

export type NotificationItem = {
  id: number;
  type: "follow" | "like" | "repost" | "reply";
  created_at: string;
  read_at: string | null;
  actor: Pick<Profile, "username" | "display_name" | "avatar_url">;
  post: { id: number; content: string | null; author_username: string } | null;
};

export async function getNotifications(): Promise<NotificationItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select(
      `id, type, created_at, read_at,
       actor:profiles!notifications_actor_id_fkey(username, display_name, avatar_url),
       post:posts(id, content, author:profiles!posts_author_id_fkey(username))`,
    )
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    type: row.type,
    created_at: row.created_at,
    read_at: row.read_at,
    actor: row.actor,
    post: row.post ? { id: row.post.id, content: row.post.content, author_username: row.post.author.username } : null,
  }));
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .is("read_at", null);
  return count ?? 0;
}

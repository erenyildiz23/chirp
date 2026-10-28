import { createClient } from "@/lib/supabase/server";
import { FEED_PAGE_SIZE, type FeedCursor, type FeedPage, toFeedPage } from "./feed-page";

export type TimelineTab = "posts" | "replies";

export async function getHomeFeed(cursor?: FeedCursor): Promise<FeedPage> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("home_feed", {
    p_cursor_at: cursor?.at,
    p_cursor_key: cursor?.key,
    p_limit: FEED_PAGE_SIZE,
  });
  if (error) throw error;
  return toFeedPage(data, FEED_PAGE_SIZE);
}

export async function getProfileTimeline(username: string, tab: TimelineTab, cursor?: FeedCursor): Promise<FeedPage> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("profile_timeline", {
    p_username: username,
    p_tab: tab,
    p_cursor_at: cursor?.at,
    p_cursor_key: cursor?.key,
    p_limit: FEED_PAGE_SIZE,
  });
  if (error) throw error;
  return toFeedPage(data, FEED_PAGE_SIZE);
}

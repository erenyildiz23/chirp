import { createClient } from "@/lib/supabase/server";
import { FEED_PAGE_SIZE, type FeedCursor, type FeedPage, toFeedPage } from "./feed-page";

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

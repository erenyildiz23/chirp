import type { Database } from "@/lib/supabase/database.types";

export type FeedItem = Database["public"]["CompositeTypes"]["feed_item"];
export type FeedCursor = { at: string; key: string };
export type FeedPage = { items: FeedItem[]; nextCursor: FeedCursor | null };

export const FEED_PAGE_SIZE = 20;

/** Wraps one page of feed rows; a full page means there may be more. */
export function toFeedPage(rows: FeedItem[] | null, limit: number): FeedPage {
  const items = rows ?? [];
  const last = items.at(-1);
  const nextCursor =
    items.length === limit && last?.activity_at && last.item_key
      ? { at: last.activity_at, key: last.item_key }
      : null;
  return { items, nextCursor };
}

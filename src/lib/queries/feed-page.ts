import type { Database } from "@/lib/supabase/database.types";

export type FeedItem = Database["public"]["CompositeTypes"]["feed_item"];
export type FeedCursor = { at: string; key: string };
export type FeedPage = { items: FeedItem[]; nextCursor: FeedCursor | null };

export const FEED_PAGE_SIZE = 20;

function isNewer(a: FeedItem, b: FeedItem): boolean {
  const at = (a.activity_at ?? "").localeCompare(b.activity_at ?? "");
  return at !== 0 ? at > 0 : (a.item_key ?? "") > (b.item_key ?? "");
}

/**
 * Merges a freshly fetched page into what is already on screen. Nothing already
 * shown is dropped, each post appears once at its newest activity, and fresh rows
 * win over stale copies of the same item (updated counters).
 */
export function mergeFeedItems(fresh: FeedItem[], existing: FeedItem[]): FeedItem[] {
  const byPost = new Map<number, FeedItem>();
  for (const item of [...fresh, ...existing]) {
    const current = byPost.get(item.post_id!);
    if (!current || isNewer(item, current)) byPost.set(item.post_id!, item);
  }
  return [...byPost.values()].sort((a, b) => (isNewer(a, b) ? -1 : isNewer(b, a) ? 1 : 0));
}

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

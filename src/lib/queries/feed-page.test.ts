import { expect, test } from "vitest";
import { type FeedItem, mergeFeedItems, toFeedPage } from "./feed-page";

function item(key: string, at: string, extra: Partial<FeedItem> = {}): FeedItem {
  const postId = Number(key.split(":").at(-1));
  return { item_key: key, activity_at: at, post_id: postId, ...extra } as FeedItem;
}

test("items that fall off a refreshed first page are kept", () => {
  const old = [item("p:2", "2026-10-28T10:00:00Z"), item("p:1", "2026-10-28T09:00:00Z")];
  const fresh = [item("p:3", "2026-10-28T11:00:00Z"), item("p:2", "2026-10-28T10:00:00Z")];
  expect(mergeFeedItems(fresh, old).map((i) => i.item_key)).toEqual(["p:3", "p:2", "p:1"]);
});

test("a post shows once, at its newest activity", () => {
  const old = [item("p:5", "2026-10-28T09:00:00Z")];
  const fresh = [item("r:u:5", "2026-10-28T12:00:00Z")];
  expect(mergeFeedItems(fresh, old).map((i) => i.item_key)).toEqual(["r:u:5"]);
});

test("fresh data replaces stale data for the same item", () => {
  const old = [item("p:7", "2026-10-28T09:00:00Z", { like_count: 1 })];
  const fresh = [item("p:7", "2026-10-28T09:00:00Z", { like_count: 4 })];
  expect(mergeFeedItems(fresh, old)[0].like_count).toBe(4);
});

test("a full page has a cursor pointing at its last item", () => {
  const items = [item("p:2", "2026-10-28T10:00:00Z"), item("p:1", "2026-10-28T09:00:00Z")];
  expect(toFeedPage(items, 2)).toEqual({ items, nextCursor: { at: "2026-10-28T09:00:00Z", key: "p:1" } });
});

test("a short page has no cursor", () => {
  const items = [item("p:1", "2026-10-28T09:00:00Z")];
  expect(toFeedPage(items, 2).nextCursor).toBeNull();
});

test("null rows from the database become an empty page", () => {
  expect(toFeedPage(null, 20)).toEqual({ items: [], nextCursor: null });
});

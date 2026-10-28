import { expect, test } from "vitest";
import { type FeedItem, toFeedPage } from "./feed-page";

function item(key: string, at: string): FeedItem {
  return { item_key: key, activity_at: at } as FeedItem;
}

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

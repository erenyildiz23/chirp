"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/actions/result";
import { type FeedCursor, type FeedItem, type FeedPage, mergeFeedItems } from "@/lib/queries/feed-page";
import { PostCard, type Viewer } from "./post-card";

type FeedListProps = {
  initialPage: FeedPage;
  viewer: Viewer;
  loadMore: (cursor: FeedCursor) => Promise<ActionResult<FeedPage>>;
  emptyMessage: React.ReactNode;
};

/**
 * Renders the server-rendered first page plus any pages loaded with "Load more".
 * When router.refresh() brings a new first page (after posting), it is merged into
 * what is already shown, so nothing that scrolled past page one disappears.
 */
export function FeedList({ initialPage, viewer, loadMore, emptyMessage }: FeedListProps) {
  const [shown, setShown] = useState<FeedItem[]>(initialPage.items);
  const [lastInitial, setLastInitial] = useState(initialPage);
  const [cursor, setCursor] = useState<FeedCursor | null | undefined>(undefined);
  const [deleted, setDeleted] = useState<Set<number>>(new Set());
  const [pending, startTransition] = useTransition();

  if (initialPage !== lastInitial) {
    setLastInitial(initialPage);
    setShown((prev) => mergeFeedItems(initialPage.items, prev));
  }

  const nextCursor = cursor === undefined ? initialPage.nextCursor : cursor;
  const items = shown.filter((item) => !deleted.has(item.post_id!));

  function more() {
    if (!nextCursor) return;
    startTransition(async () => {
      const result = await loadMore(nextCursor);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setShown((prev) => mergeFeedItems(prev, result.data.items));
      setCursor(result.data.nextCursor);
    });
  }

  if (items.length === 0) {
    return <div className="px-8 py-12 text-center text-muted-foreground">{emptyMessage}</div>;
  }

  return (
    <div>
      {items.map((item) => (
        <PostCard
          key={item.item_key}
          item={item}
          viewer={viewer}
          onDeleted={(id) => setDeleted((prev) => new Set(prev).add(id))}
        />
      ))}
      {nextCursor && (
        <div className="flex justify-center p-4">
          <Button variant="ghost" className="rounded-full text-primary" disabled={pending} onClick={more}>
            {pending ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}

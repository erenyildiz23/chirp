"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/actions/result";
import type { FeedCursor, FeedItem, FeedPage } from "@/lib/queries/feed-page";
import { PostCard, type Viewer } from "./post-card";

type FeedListProps = {
  initialPage: FeedPage;
  viewer: Viewer;
  loadMore: (cursor: FeedCursor) => Promise<ActionResult<FeedPage>>;
  emptyMessage: React.ReactNode;
};

/**
 * Renders the server-rendered first page plus any pages loaded with "Load more".
 * The first page stays a prop so router.refresh() (after posting) updates it.
 */
export function FeedList({ initialPage, viewer, loadMore, emptyMessage }: FeedListProps) {
  const [extra, setExtra] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState<FeedCursor | null | undefined>(undefined);
  const [deleted, setDeleted] = useState<Set<number>>(new Set());
  const [pending, startTransition] = useTransition();

  const nextCursor = cursor === undefined ? initialPage.nextCursor : cursor;
  const seen = new Set<string>();
  const items = [...initialPage.items, ...extra].filter((item) => {
    if (!item.item_key || seen.has(item.item_key) || deleted.has(item.post_id!)) return false;
    seen.add(item.item_key);
    return true;
  });

  function more() {
    if (!nextCursor) return;
    startTransition(async () => {
      const result = await loadMore(nextCursor);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setExtra((prev) => [...prev, ...result.data.items]);
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

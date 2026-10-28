import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { FeedItem } from "@/lib/queries/feed-page";
import { LikeButton } from "./like-button";
import { RepostButton } from "./repost-button";

type PostActionsProps = {
  item: FeedItem;
  href: string;
  signedIn: boolean;
};

export function PostActions({ item, href, signedIn }: PostActionsProps) {
  const postId = item.post_id!;
  return (
    <div className="relative z-10 mt-1 -ml-2 flex max-w-md justify-between text-[13px] text-muted-foreground">
      <Link
        href={href}
        className="group flex items-center gap-1 hover:text-primary"
        aria-label={`${item.reply_count ?? 0} replies. Reply`}
      >
        <span className="rounded-full p-2 group-hover:bg-primary/10">
          <MessageCircle className="size-[18px]" />
        </span>
        <span className="min-w-3 tabular-nums">{item.reply_count || ""}</span>
      </Link>
      <RepostButton
        key={`r-${item.reposted_by_me}-${item.repost_count}`}
        postId={postId}
        reposted={item.reposted_by_me ?? false}
        count={item.repost_count ?? 0}
        disabled={!signedIn}
      />
      <LikeButton
        key={`l-${item.liked_by_me}-${item.like_count}`}
        postId={postId}
        liked={item.liked_by_me ?? false}
        count={item.like_count ?? 0}
        disabled={!signedIn}
      />
    </div>
  );
}

import Link from "next/link";
import { Heart, MessageCircle, Repeat2 } from "lucide-react";
import type { FeedItem } from "@/lib/queries/feed-page";

type PostActionsProps = {
  item: FeedItem;
  href: string;
  signedIn: boolean;
};

export function PostActions({ item, href }: PostActionsProps) {
  return (
    <div className="relative z-10 mt-2 flex max-w-md justify-between text-[13px] text-muted-foreground">
      <Link href={href} className="group flex items-center gap-1 hover:text-primary" aria-label={`${item.reply_count ?? 0} replies. Reply`}>
        <span className="rounded-full p-2 group-hover:bg-primary/10">
          <MessageCircle className="size-[18px]" />
        </span>
        {item.reply_count || ""}
      </Link>
      <span className="flex items-center gap-1">
        <span className="p-2">
          <Repeat2 className="size-[18px]" />
        </span>
        {item.repost_count || ""}
      </span>
      <span className="flex items-center gap-1">
        <span className="p-2">
          <Heart className="size-[18px]" />
        </span>
        {item.like_count || ""}
      </span>
    </div>
  );
}

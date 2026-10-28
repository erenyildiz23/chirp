"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Repeat2, UserPlus, type LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { markAllRead } from "@/lib/actions/notifications";
import type { NotificationItem } from "@/lib/queries/notifications";
import { formatRelative } from "@/lib/utils/time";
import { cn } from "@/lib/utils";

const KINDS: Record<NotificationItem["type"], { icon: LucideIcon; color: string; text: string }> = {
  follow: { icon: UserPlus, color: "text-primary", text: "followed you" },
  like: { icon: Heart, color: "text-like fill-current", text: "liked your post" },
  repost: { icon: Repeat2, color: "text-repost", text: "reposted your post" },
  reply: { icon: MessageCircle, color: "text-primary", text: "replied to your post" },
};

function hrefFor(n: NotificationItem): string {
  if (n.type === "follow" || !n.post) return `/${n.actor.username}`;
  return `/${n.post.author_username}/status/${n.post.id}`;
}

export function NotificationList({ items }: { items: NotificationItem[] }) {
  // Remember what was unread when the page opened so it stays highlighted
  // after marking everything read refreshes the page.
  const [unread] = useState(() => new Set(items.filter((n) => !n.read_at).map((n) => n.id)));
  const router = useRouter();

  useEffect(() => {
    if (unread.size === 0) return;
    markAllRead().then((result) => {
      if (result.ok) router.refresh();
    });
  }, [unread, router]);

  if (items.length === 0) {
    return (
      <p className="px-8 py-12 text-center text-muted-foreground">
        Nothing yet. Likes, reposts, replies and new followers will show up here.
      </p>
    );
  }

  return (
    <ul>
      {items.map((n) => {
        const { icon: Icon, color, text } = KINDS[n.type];
        return (
          <li key={n.id} className={cn("relative border-b transition-colors hover:bg-muted/40", unread.has(n.id) && "bg-primary/5")}>
            <Link href={hrefFor(n)} className="flex gap-3 px-4 py-3">
              <Icon className={cn("mt-1 size-7 shrink-0", color)} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <Avatar className="size-8">
                  {n.actor.avatar_url && <AvatarImage src={n.actor.avatar_url} alt="" />}
                  <AvatarFallback>{n.actor.display_name.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <p className="mt-2 text-[15px]">
                  <span className="font-bold">@{n.actor.username}</span> {text}
                  <span className="text-muted-foreground" suppressHydrationWarning>
                    {" "}
                    · {formatRelative(n.created_at)}
                  </span>
                  {unread.has(n.id) && <span className="sr-only"> (new)</span>}
                </p>
                {n.post?.content && n.type !== "follow" && (
                  <p className="mt-1 line-clamp-3 text-[15px] break-words text-muted-foreground">{n.post.content}</p>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

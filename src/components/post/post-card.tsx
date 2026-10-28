import Image from "next/image";
import Link from "next/link";
import { Repeat2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { FeedItem } from "@/lib/queries/feed-page";
import { formatRelative } from "@/lib/utils/time";
import { publicImageUrl } from "@/lib/utils/storage";
import { cn } from "@/lib/utils";
import { DeletePostButton } from "./delete-post-button";
import { PostActions } from "./post-actions";

export type Viewer = { id: string; username: string } | null;

type PostCardProps = {
  item: FeedItem;
  viewer: Viewer;
  /** Larger text and no overlay link, for the post detail page. */
  focused?: boolean;
  onDeleted?: (postId: number) => void;
};

export function PostCard({ item, viewer, focused = false, onDeleted }: PostCardProps) {
  const postId = item.post_id!;
  const username = item.author_username!;
  const displayName = item.author_display_name ?? username;
  const href = `/${username}/status/${postId}`;
  const createdAt = item.created_at!;

  return (
    <article
      className={cn("relative border-b px-4 py-3", !focused && "transition-colors hover:bg-muted/40")}
      aria-labelledby={`post-${postId}-author`}
    >
      {!focused && <Link href={href} className="absolute inset-0" aria-label={`View post by @${username}`} />}

      {item.reposted_by_username && (
        <p className="relative mb-1 ml-8 flex items-center gap-2 text-[13px] font-bold text-muted-foreground">
          <Repeat2 className="size-4" />
          <Link href={`/${item.reposted_by_username}`} className="relative z-10 hover:underline">
            {item.reposted_by_username === viewer?.username
              ? "You reposted"
              : `${item.reposted_by_display_name ?? item.reposted_by_username} reposted`}
          </Link>
        </p>
      )}

      <div className="flex gap-3">
        <Link href={`/${username}`} className="relative z-10 h-fit shrink-0" aria-label={`@${username}`}>
          <Avatar className="size-10">
            {item.author_avatar_url && <AvatarImage src={item.author_avatar_url} alt="" />}
            <AvatarFallback>{displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-[15px]">
            <Link
              id={`post-${postId}-author`}
              href={`/${username}`}
              className="relative z-10 truncate font-bold hover:underline"
            >
              {displayName}
            </Link>
            <span className="truncate text-muted-foreground">@{username}</span>
            <span className="text-muted-foreground" aria-hidden="true">
              ·
            </span>
            <time
              dateTime={createdAt}
              title={new Date(createdAt).toLocaleString("en-US")}
              className="shrink-0 text-muted-foreground"
              suppressHydrationWarning
            >
              {formatRelative(createdAt)}
            </time>
            {viewer?.id === item.author_id && (
              <div className="relative z-10 ml-auto">
                <DeletePostButton postId={postId} onDeleted={onDeleted} />
              </div>
            )}
          </div>

          {item.is_reply && (
            <p className="text-[15px] text-muted-foreground">
              {item.reply_to_username ? (
                <>
                  Replying to{" "}
                  <Link href={`/${item.reply_to_username}`} className="relative z-10 text-primary hover:underline">
                    @{item.reply_to_username}
                  </Link>
                </>
              ) : (
                "Replying to a deleted post"
              )}
            </p>
          )}

          {item.content && (
            <p
              className={cn(
                "mt-0.5 break-words whitespace-pre-wrap",
                focused ? "text-[17px] leading-relaxed" : "text-[15px] leading-normal",
              )}
            >
              {item.content}
            </p>
          )}

          {item.image_path && (
            <div className="relative z-10 mt-3 overflow-hidden rounded-2xl border">
              <Image
                src={publicImageUrl("post-images", item.image_path)}
                alt=""
                width={600}
                height={400}
                unoptimized
                className="h-auto max-h-[510px] w-full object-cover"
              />
            </div>
          )}

          <PostActions item={item} href={href} signedIn={viewer !== null} />
        </div>
      </div>
    </article>
  );
}


import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/layout/back-button";
import { PageHeader } from "@/components/layout/page-header";
import { Composer } from "@/components/post/composer";
import { PostCard, type Viewer } from "@/components/post/post-card";
import { getPostThread } from "@/lib/queries/posts";
import { getCurrentProfile } from "@/lib/queries/profiles";

type Props = { params: Promise<{ username: string; id: string }> };

function parseId(id: string): number | null {
  return /^\d{1,15}$/.test(id) ? Number(id) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `Post by @${username}` };
}

export default async function PostPage({ params }: Props) {
  const { username, id } = await params;
  const postId = parseId(id);
  if (postId === null) notFound();

  const [thread, me] = await Promise.all([getPostThread(postId), getCurrentProfile()]);
  if (!thread || thread.post.author_username !== username) notFound();

  const viewer: Viewer = me ? { id: me.id, username: me.username } : null;

  return (
    <>
      <PageHeader title="Post">
        <BackButton />
      </PageHeader>

      {thread.parent && <PostCard item={thread.parent} viewer={viewer} />}
      {thread.parentDeleted && (
        <p className="border-b px-4 py-3 text-[15px] text-muted-foreground">This post was deleted.</p>
      )}

      <PostCard item={thread.post} viewer={viewer} focused />

      {me && (
        <Composer
          currentUserId={me.id}
          displayName={me.display_name}
          avatarUrl={me.avatar_url}
          replyToId={postId}
          placeholder="Post your reply"
        />
      )}

      {thread.replies.map((reply) => (
        <PostCard key={reply.item_key} item={reply} viewer={viewer} />
      ))}
    </>
  );
}

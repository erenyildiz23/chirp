import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Composer } from "@/components/post/composer";
import { FeedList } from "@/components/post/feed-list";
import { loadMoreHomeFeed } from "@/lib/actions/posts";
import { getHomeFeed } from "@/lib/queries/feed";
import { getCurrentProfile } from "@/lib/queries/profiles";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/home");

  const page = await getHomeFeed();

  return (
    <>
      <PageHeader title="Home" />
      <Composer currentUserId={profile.id} displayName={profile.display_name} avatarUrl={profile.avatar_url} />
      <FeedList
        initialPage={page}
        viewer={{ id: profile.id, username: profile.username }}
        loadMore={loadMoreHomeFeed}
        emptyMessage="Your feed is empty. Follow some people or write your first post."
      />
    </>
  );
}

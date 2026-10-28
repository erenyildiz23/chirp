import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/layout/back-button";
import { PageHeader } from "@/components/layout/page-header";
import { FeedList } from "@/components/post/feed-list";
import { ProfileHeader } from "@/components/profile/profile-header";
import { loadMoreProfileTimeline } from "@/lib/actions/posts";
import { getProfileTimeline, type TimelineTab } from "@/lib/queries/feed";
import { getCurrentProfile, getProfileByUsername } from "@/lib/queries/profiles";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  return { title: profile ? `${profile.display_name} (@${profile.username})` : "Profile" };
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const { username } = await params;
  const { tab: rawTab } = await searchParams;
  const tab: TimelineTab = rawTab === "replies" ? "replies" : "posts";

  const [profile, viewer] = await Promise.all([getProfileByUsername(username), getCurrentProfile()]);
  if (!profile) notFound();

  const page = await getProfileTimeline(profile.username, tab);

  return (
    <>
      <PageHeader title={profile.display_name} subtitle={`@${profile.username}`}>
        <BackButton />
      </PageHeader>
      <ProfileHeader profile={profile} viewerId={viewer?.id ?? null} />

      <nav className="flex border-b" aria-label="Profile tabs">
        {(["posts", "replies"] as const).map((t) => (
          <Link
            key={t}
            href={t === "posts" ? `/${profile.username}` : `/${profile.username}?tab=replies`}
            aria-current={tab === t ? "page" : undefined}
            className="flex flex-1 justify-center text-[15px] hover:bg-muted/50"
          >
            <span
              className={cn(
                "border-b-4 py-3.5 capitalize",
                tab === t ? "border-primary font-bold" : "border-transparent text-muted-foreground",
              )}
            >
              {t}
            </span>
          </Link>
        ))}
      </nav>

      <FeedList
        key={tab}
        initialPage={page}
        viewer={viewer ? { id: viewer.id, username: viewer.username } : null}
        loadMore={loadMoreProfileTimeline.bind(null, profile.username, tab)}
        emptyMessage={tab === "posts" ? `@${profile.username} hasn't posted yet.` : `@${profile.username} hasn't replied to anyone yet.`}
      />
    </>
  );
}

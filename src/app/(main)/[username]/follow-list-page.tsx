import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/layout/back-button";
import { PageHeader } from "@/components/layout/page-header";
import { UserRow } from "@/components/profile/user-row";
import { getCurrentProfile, getFollowers, getFollowing, getProfileByUsername } from "@/lib/queries/profiles";
import { cn } from "@/lib/utils";

/** Shared body of /[username]/followers and /[username]/following. */
export async function FollowListPage({ username, kind }: { username: string; kind: "followers" | "following" }) {
  const [profile, viewer] = await Promise.all([getProfileByUsername(username), getCurrentProfile()]);
  if (!profile) notFound();

  const people = kind === "followers" ? await getFollowers(profile.id) : await getFollowing(profile.id);
  const empty =
    kind === "followers" ? `@${profile.username} doesn't have any followers yet.` : `@${profile.username} isn't following anyone yet.`;

  return (
    <>
      <PageHeader title={profile.display_name} subtitle={`@${profile.username}`}>
        <BackButton />
      </PageHeader>
      <nav className="flex border-b" aria-label="Connections">
        {(["followers", "following"] as const).map((k) => (
          <Link
            key={k}
            href={`/${profile.username}/${k}`}
            aria-current={kind === k ? "page" : undefined}
            className="flex flex-1 justify-center text-[15px] hover:bg-muted/50"
          >
            <span
              className={cn(
                "border-b-4 py-3.5 capitalize",
                kind === k ? "border-primary font-bold" : "border-transparent text-muted-foreground",
              )}
            >
              {k}
            </span>
          </Link>
        ))}
      </nav>
      {people.length === 0 ? (
        <p className="px-8 py-12 text-center text-muted-foreground">{empty}</p>
      ) : (
        people.map((person) => <UserRow key={person.id} profile={person} viewerId={viewer?.id ?? null} />)
      )}
    </>
  );
}

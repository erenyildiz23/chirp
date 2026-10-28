import type { Metadata } from "next";
import Link from "next/link";
import { SearchBox } from "@/components/layout/search-box";
import { PostCard } from "@/components/post/post-card";
import { UserRow } from "@/components/profile/user-row";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { searchPeople, searchPosts } from "@/lib/queries/search";
import { cn } from "@/lib/utils";

type Props = { searchParams: Promise<{ q?: string; tab?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q?.trim() ? `${q.trim()} - Search` : "Search" };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q: rawQ, tab: rawTab } = await searchParams;
  const q = (rawQ ?? "").trim().slice(0, 100);
  const tab = rawTab === "posts" ? "posts" : "people";
  const me = await getCurrentProfile();
  const viewer = me ? { id: me.id, username: me.username } : null;

  return (
    <>
      <div className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="px-4 py-2">
          <SearchBox defaultValue={q} autoFocus={!q} />
        </div>
        {q && (
          <nav className="flex" aria-label="Search results">
            {(["people", "posts"] as const).map((t) => (
              <Link
                key={t}
                href={`/search?q=${encodeURIComponent(q)}${t === "posts" ? "&tab=posts" : ""}`}
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
        )}
      </div>

      {!q ? (
        <p className="px-8 py-12 text-center text-muted-foreground">Search for people by name or username, or for words in posts.</p>
      ) : tab === "people" ? (
        <PeopleResults q={q} viewerId={me?.id ?? null} />
      ) : (
        <PostResults q={q} viewer={viewer} />
      )}
    </>
  );
}

async function PeopleResults({ q, viewerId }: { q: string; viewerId: string | null }) {
  const people = await searchPeople(q);
  if (people.length === 0) return <NoResults q={q} />;
  return people.map((person) => <UserRow key={person.id} profile={person} viewerId={viewerId} />);
}

async function PostResults({ q, viewer }: { q: string; viewer: { id: string; username: string } | null }) {
  const posts = await searchPosts(q);
  if (posts.length === 0) return <NoResults q={q} />;
  return posts.map((item) => <PostCard key={item.item_key} item={item} viewer={viewer} />);
}

function NoResults({ q }: { q: string }) {
  return (
    <div className="px-8 py-12 text-center">
      <p className="text-xl font-extrabold break-words">No results for &ldquo;{q}&rdquo;</p>
      <p className="mt-1 text-muted-foreground">Try searching for something else.</p>
    </div>
  );
}

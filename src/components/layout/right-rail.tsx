import { UserRow } from "@/components/profile/user-row";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { getWhoToFollow } from "@/lib/queries/search";
import { SearchBox } from "./search-box";

/** Desktop-only right column: search box and follow suggestions. */
export async function RightRail() {
  const [me, suggestions] = await Promise.all([getCurrentProfile(), getWhoToFollow()]);

  return (
    <div className="sticky top-0 flex flex-col gap-4 py-3">
      <SearchBox />
      {suggestions.length > 0 && (
        <section className="overflow-hidden rounded-2xl border" aria-labelledby="who-to-follow">
          <h2 id="who-to-follow" className="px-4 pt-3 pb-1 text-xl font-extrabold">
            Who to follow
          </h2>
          {suggestions.map((profile) => (
            <UserRow key={profile.id} profile={{ ...profile, followed_by_me: false }} viewerId={me?.id ?? null} compact />
          ))}
        </section>
      )}
    </div>
  );
}

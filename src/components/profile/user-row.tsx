import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ListedProfile } from "@/lib/queries/profiles";
import { FollowButton } from "./follow-button";

export function UserRow({ profile, viewerId, compact = false }: { profile: ListedProfile; viewerId: string | null; compact?: boolean }) {
  return (
    <div className="relative flex gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
      <Link href={`/${profile.username}`} className="absolute inset-0" aria-label={`View @${profile.username}`} />
      <Avatar className="size-10 shrink-0">
        {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt="" />}
        <AvatarFallback>{profile.display_name.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 leading-tight">
            <p className="truncate font-bold">{profile.display_name}</p>
            <p className="truncate text-[15px] text-muted-foreground">@{profile.username}</p>
          </div>
          {viewerId && viewerId !== profile.id && (
            <div className="relative z-10">
              <FollowButton key={String(profile.followed_by_me)} userId={profile.id} following={profile.followed_by_me} />
            </div>
          )}
        </div>
        {!compact && profile.bio && <p className="mt-1 text-[15px] break-words">{profile.bio}</p>}
      </div>
    </div>
  );
}

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { ProfileWithStats } from "@/lib/queries/profiles";
import { FollowButton } from "./follow-button";

const joinedFormat = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

export function ProfileHeader({ profile, viewerId }: { profile: ProfileWithStats; viewerId: string | null }) {
  const isMe = viewerId === profile.id;

  return (
    <section className="border-b">
      <div className="h-32 bg-gradient-to-br from-primary/40 to-primary/10 sm:h-48" />
      <div className="px-4 pb-4">
        <div className="flex items-start justify-between">
          <Avatar className="-mt-12 size-24 border-4 border-background sm:-mt-16 sm:size-32">
            {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt="" />}
            <AvatarFallback className="text-3xl">{profile.display_name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="pt-3">
            {isMe ? (
              <Button asChild variant="outline" className="h-9 rounded-full px-4 font-bold">
                <Link href="/settings/profile">Edit profile</Link>
              </Button>
            ) : viewerId ? (
              <FollowButton key={String(profile.followed_by_me)} userId={profile.id} following={profile.followed_by_me} />
            ) : null}
          </div>
        </div>

        <h2 className="mt-3 text-xl font-extrabold leading-tight">{profile.display_name}</h2>
        <p className="text-[15px] text-muted-foreground">@{profile.username}</p>

        {profile.bio && <p className="mt-3 text-[15px] break-words whitespace-pre-wrap">{profile.bio}</p>}

        <p className="mt-3 flex items-center gap-1 text-[15px] text-muted-foreground">
          <CalendarDays className="size-4" />
          Joined {joinedFormat.format(new Date(profile.created_at))}
        </p>

        <div className="mt-3 flex gap-5 text-[15px]">
          <Link href={`/${profile.username}/following`} className="hover:underline">
            <span className="font-bold">{profile.following_count}</span>{" "}
            <span className="text-muted-foreground">Following</span>
          </Link>
          <Link href={`/${profile.username}/followers`} className="hover:underline">
            <span className="font-bold">{profile.followers_count}</span>{" "}
            <span className="text-muted-foreground">{profile.followers_count === 1 ? "Follower" : "Followers"}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

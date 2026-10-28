import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileWithStats = Profile & { followers_count: number; following_count: number; followed_by_me: boolean };
export type ListedProfile = Profile & { followed_by_me: boolean };

/** The signed-in user's profile, or null for visitors. Cached per request. */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data;
});

export const getProfileByUsername = cache(async (username: string): Promise<ProfileWithStats | null> => {
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
  if (!profile) return null;

  const me = await getCurrentProfile();
  const [followers, following, mine] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("followee_id", profile.id),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profile.id),
    me
      ? supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", me.id)
          .eq("followee_id", profile.id)
      : Promise.resolve({ count: 0 }),
  ]);

  return {
    ...profile,
    followers_count: followers.count ?? 0,
    following_count: following.count ?? 0,
    followed_by_me: (mine.count ?? 0) > 0,
  };
});

/** Adds followed_by_me for the signed-in user to a list of profiles. */
export async function withFollowedByMe(profiles: Profile[]): Promise<ListedProfile[]> {
  const me = await getCurrentProfile();
  if (!me || profiles.length === 0) return profiles.map((p) => ({ ...p, followed_by_me: false }));

  const supabase = await createClient();
  const { data } = await supabase
    .from("follows")
    .select("followee_id")
    .eq("follower_id", me.id)
    .in(
      "followee_id",
      profiles.map((p) => p.id),
    );
  const followed = new Set((data ?? []).map((row) => row.followee_id));
  return profiles.map((p) => ({ ...p, followed_by_me: followed.has(p.id) }));
}

const LIST_LIMIT = 50;

export async function getFollowers(userId: string): Promise<ListedProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("follows")
    .select("created_at, profile:profiles!follows_follower_id_fkey(*)")
    .eq("followee_id", userId)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);
  if (error) throw error;
  return withFollowedByMe(data.map((row) => row.profile));
}

export async function getFollowing(userId: string): Promise<ListedProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("follows")
    .select("created_at, profile:profiles!follows_followee_id_fkey(*)")
    .eq("follower_id", userId)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);
  if (error) throw error;
  return withFollowedByMe(data.map((row) => row.profile));
}

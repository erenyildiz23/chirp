import { createClient } from "@/lib/supabase/server";
import type { FeedItem } from "./feed-page";
import { getCurrentProfile, type ListedProfile, type Profile, withFollowedByMe } from "./profiles";

export async function searchPeople(q: string): Promise<ListedProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_people", { p_query: q });
  if (error) throw error;
  return withFollowedByMe(data);
}

export async function searchPosts(q: string): Promise<FeedItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_posts", { p_query: q });
  if (error) throw error;
  return data;
}

/** Three people the signed-in user doesn't follow yet, newest accounts first. */
export async function getWhoToFollow(): Promise<Profile[]> {
  const me = await getCurrentProfile();
  if (!me) return [];

  const supabase = await createClient();
  const { data: follows } = await supabase.from("follows").select("followee_id").eq("follower_id", me.id);
  const exclude = [me.id, ...(follows ?? []).map((f) => f.followee_id)];

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .not("id", "in", `(${exclude.join(",")})`)
    .order("created_at", { ascending: false })
    .limit(3);
  if (error) throw error;
  return data;
}

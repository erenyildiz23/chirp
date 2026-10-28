"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isOwnStoragePath, publicImageUrl } from "@/lib/utils/storage";
import { profileSchema } from "@/lib/validation/profile";
import { type ActionResult, fail, fromZodError } from "./result";

const USERNAME_TAKEN = "Username is already taken";

/** The storage path of an avatar URL we issued for this user, if it is one. */
function ownAvatarPath(avatarUrl: string | null, userId: string): string | null {
  const marker = "/storage/v1/object/public/avatars/";
  const index = avatarUrl?.indexOf(marker) ?? -1;
  if (!avatarUrl || index === -1) return null;
  const path = avatarUrl.slice(index + marker.length);
  return isOwnStoragePath(path, userId) ? path : null;
}

export async function updateProfile(
  _prev: ActionResult<{ username: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ username: string }>> {
  const parsed = profileSchema.safeParse({
    username: String(formData.get("username") ?? "").toLowerCase(),
    displayName: formData.get("displayName"),
    bio: formData.get("bio") ?? "",
    avatarPath: formData.get("avatarPath") || null,
  });
  if (!parsed.success) return fromZodError(parsed.error);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("You need to log in first");

  const { username, displayName, bio, avatarPath } = parsed.data;
  if (avatarPath && !isOwnStoragePath(avatarPath, user.id)) return fail("Invalid image");

  const { data: current } = await supabase.from("profiles").select("username, avatar_url").eq("id", user.id).single();
  if (!current) return fail("Profile not found");

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      display_name: displayName,
      bio: bio || null,
      ...(avatarPath ? { avatar_url: publicImageUrl("avatars", avatarPath) } : {}),
    })
    .eq("id", user.id);
  if (error) {
    if (error.code === "23505") return fail(USERNAME_TAKEN, { username: USERNAME_TAKEN });
    return fail("Couldn't save your profile");
  }

  const oldAvatar = avatarPath ? ownAvatarPath(current.avatar_url, user.id) : null;
  if (oldAvatar && oldAvatar !== avatarPath) await supabase.storage.from("avatars").remove([oldAvatar]);

  revalidatePath("/", "layout");
  redirect(`/${username}`);
}

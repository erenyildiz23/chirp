"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/auth/field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/lib/actions/profile";
import type { ActionResult } from "@/lib/actions/result";
import type { Profile } from "@/lib/queries/profiles";
import { createBrowserClient } from "@/lib/supabase/client";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/utils/storage";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

type Result = ActionResult<{ username: string }> | null;

export function EditProfileForm({ profile }: { profile: Profile }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [bio, setBio] = useState(profile.bio ?? "");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Upload the avatar from the browser first, then let the server action save the path.
  const [state, action, pending] = useActionState(async (prev: Result, formData: FormData): Promise<Result> => {
    if (file) {
      const path = `${profile.id}/avatar-${Date.now()}.${EXTENSIONS[file.type]}`;
      const { error } = await createBrowserClient().storage.from("avatars").upload(path, file, { contentType: file.type });
      if (error) return { ok: false, error: "Couldn't upload the image" };
      formData.set("avatarPath", path);
    }
    return updateProfile(prev, formData);
  }, null);

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  useEffect(() => {
    if (state && !state.ok && !state.fieldErrors) toast.error(state.error);
  }, [state]);

  function pickFile(picked: File | undefined) {
    if (fileInput.current) fileInput.current.value = "";
    if (!picked) return;
    if (!ALLOWED_IMAGE_TYPES.includes(picked.type)) return toast.error("Only JPEG, PNG, WebP and GIF images are supported");
    if (picked.size > MAX_IMAGE_BYTES) return toast.error("Images can be at most 5 MB");
    setFile(picked);
  }

  const avatarSrc = preview ?? profile.avatar_url;

  return (
    <form action={action} className="grid gap-5 px-4 py-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="group relative rounded-full"
          aria-label="Change profile photo"
        >
          <Avatar className="size-24">
            {avatarSrc && <AvatarImage src={avatarSrc} alt="" />}
            <AvatarFallback className="text-3xl">{profile.display_name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-80 group-hover:opacity-100">
            <Camera className="size-6" />
          </span>
        </button>
        <p className="text-sm text-muted-foreground">JPEG, PNG, WebP or GIF, up to 5 MB.</p>
        <input
          ref={fileInput}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
          aria-label="Profile photo"
        />
      </div>

      <Field label="Name" name="displayName" defaultValue={profile.display_name} maxLength={50} required error={fieldErrors?.displayName} />
      <Field
        label="Username"
        name="username"
        defaultValue={profile.username}
        maxLength={15}
        required
        error={fieldErrors?.username}
      />

      <div className="grid gap-1.5">
        <div className="flex justify-between">
          <Label htmlFor="field-bio">Bio</Label>
          <span className="text-xs text-muted-foreground tabular-nums">{bio.length}/160</span>
        </div>
        <Textarea
          id="field-bio"
          name="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={160}
          rows={3}
          aria-invalid={fieldErrors?.bio ? true : undefined}
        />
        {fieldErrors?.bio && <p className="text-sm text-destructive">{fieldErrors.bio}</p>}
      </div>

      <Button type="submit" className="h-10 rounded-full font-bold" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}

"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createPost } from "@/lib/actions/posts";
import { createBrowserClient } from "@/lib/supabase/client";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/utils/storage";
import { cn } from "@/lib/utils";
import { countChars, POST_MAX } from "@/lib/validation/post";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

type ComposerProps = {
  currentUserId: string;
  displayName: string;
  avatarUrl: string | null;
  replyToId?: number;
  placeholder?: string;
  onPosted?: () => void;
};

export function Composer({ currentUserId, displayName, avatarUrl, replyToId, placeholder, onPosted }: ComposerProps) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const length = countChars(content.trim());
  const tooLong = length > POST_MAX;
  const canSubmit = !pending && !tooLong && (length > 0 || file !== null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [content]);

  function pickFile(picked: File | undefined) {
    if (fileInput.current) fileInput.current.value = "";
    if (!picked) return;
    if (!ALLOWED_IMAGE_TYPES.includes(picked.type)) return toast.error("Only JPEG, PNG, WebP and GIF images are supported");
    if (picked.size > MAX_IMAGE_BYTES) return toast.error("Images can be at most 5 MB");
    setFile(picked);
  }

  function submit() {
    startTransition(async () => {
      const supabase = createBrowserClient();
      let imagePath: string | null = null;

      if (file) {
        imagePath = `${currentUserId}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
        const { error } = await supabase.storage.from("post-images").upload(imagePath, file, { contentType: file.type });
        if (error) {
          toast.error("Couldn't upload the image");
          return;
        }
      }

      const result = await createPost({ content, imagePath, replyToId: replyToId ?? null });
      if (!result.ok) {
        if (imagePath) await supabase.storage.from("post-images").remove([imagePath]);
        toast.error(result.error);
        return;
      }

      setContent("");
      setFile(null);
      toast.success(replyToId ? "Reply sent" : "Posted");
      onPosted?.();
      router.refresh();
    });
  }

  const remaining = POST_MAX - length;

  return (
    <form
      className="flex gap-3 border-b px-4 py-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) submit();
      }}
    >
      <Avatar className="size-10 shrink-0">
        {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
        <AvatarFallback>{displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <label htmlFor={replyToId ? `reply-${replyToId}` : "compose"} className="sr-only">
          {replyToId ? "Reply" : "What's happening?"}
        </label>
        <textarea
          ref={textarea}
          id={replyToId ? `reply-${replyToId}` : "compose"}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canSubmit) submit();
          }}
          placeholder={placeholder ?? "What's happening?"}
          rows={replyToId ? 1 : 2}
          className="w-full resize-none bg-transparent py-2 text-xl outline-none placeholder:text-muted-foreground"
        />

        {preview && (
          <div className="relative mt-2 overflow-hidden rounded-2xl border">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
            <img src={preview} alt="Selected image" className="max-h-80 w-full object-cover" />
            <Button
              type="button"
              size="icon-sm"
              variant="secondary"
              className="absolute top-2 right-2 rounded-full bg-black/70 text-white hover:bg-black/80"
              aria-label="Remove image"
              onClick={() => setFile(null)}
            >
              <X className="size-4" />
            </Button>
          </div>
        )}

        <div className="mt-2 flex items-center justify-between border-t pt-2">
          <input
            ref={fileInput}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
            aria-label="Add image"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full text-primary hover:bg-primary/10 hover:text-primary"
            aria-label="Add image"
            onClick={() => fileInput.current?.click()}
          >
            <ImagePlus className="size-5" />
          </Button>

          <div className="flex items-center gap-3">
            {length > 0 && (
              <span
                className={cn(
                  "text-sm tabular-nums",
                  remaining < 0 ? "text-destructive" : remaining <= 20 ? "text-amber-500" : "text-muted-foreground",
                )}
                aria-live="polite"
              >
                {remaining}
              </span>
            )}
            <Button type="submit" className="h-9 rounded-full px-4 font-bold" disabled={!canSubmit}>
              {pending ? "Posting…" : replyToId ? "Reply" : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

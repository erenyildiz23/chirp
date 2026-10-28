export type ImageBucket = "avatars" | "post-images";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function publicImageUrl(bucket: ImageBucket, path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

/** True when the object path sits directly inside the user's own folder. */
export function isOwnStoragePath(path: string, userId: string): boolean {
  const parts = path.split("/");
  return parts.length === 2 && parts[0] === userId && parts[1] !== "" && parts[1] !== ".." && parts[1] !== ".";
}

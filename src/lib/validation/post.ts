import { z } from "zod";

export const POST_MAX = 280;

/** Counts Unicode code points, the same way Postgres char_length does. */
export function countChars(s: string): number {
  return [...s].length;
}

export const postSchema = z
  .object({
    content: z
      .string()
      .trim()
      .refine((s) => countChars(s) <= POST_MAX, `Posts can be at most ${POST_MAX} characters`),
    imagePath: z.string().min(1).nullable(),
    replyToId: z.number().int().positive().nullable(),
  })
  .refine((post) => post.content.length > 0 || post.imagePath !== null, {
    message: "Write something or add an image",
    path: ["content"],
  });

export type PostInput = z.infer<typeof postSchema>;

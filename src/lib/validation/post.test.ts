import { describe, expect, test } from "vitest";
import { countChars, POST_MAX, postSchema } from "./post";

describe("postSchema", () => {
  test("rejects whitespace-only content without an image", () => {
    expect(postSchema.safeParse({ content: "   ", imagePath: null, replyToId: null }).success).toBe(false);
  });

  test("rejects 281 characters", () => {
    expect(postSchema.safeParse({ content: "a".repeat(281), imagePath: null, replyToId: null }).success).toBe(false);
  });

  test("accepts 280 emoji", () => {
    expect(postSchema.safeParse({ content: "😀".repeat(280), imagePath: null, replyToId: null }).success).toBe(true);
  });

  test("accepts an image without text", () => {
    expect(postSchema.safeParse({ content: "", imagePath: "u/x.png", replyToId: null }).success).toBe(true);
  });

  test("trims content", () => {
    const result = postSchema.parse({ content: "  hi  ", imagePath: null, replyToId: null });
    expect(result.content).toBe("hi");
  });
});

test("countChars counts code points", () => {
  expect(countChars("😀😀")).toBe(2);
  expect(POST_MAX).toBe(280);
});

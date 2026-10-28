import { describe, expect, test } from "vitest";
import { profileSchema } from "./profile";

const valid = { username: "eren_1", displayName: "Eren", bio: "", avatarPath: null };

describe("profileSchema", () => {
  test.each(["Eren", "ab", "a".repeat(16), "bad name"])("rejects username %s", (username) => {
    expect(profileSchema.safeParse({ ...valid, username }).success).toBe(false);
  });

  test("rejects usernames that collide with app routes", () => {
    const result = profileSchema.safeParse({ ...valid, username: "settings" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("That username is reserved");
  });

  test("accepts a valid profile", () => {
    expect(profileSchema.safeParse(valid).success).toBe(true);
  });

  test("rejects a bio over 160 characters", () => {
    expect(profileSchema.safeParse({ ...valid, bio: "a".repeat(161) }).success).toBe(false);
  });

  test("rejects an empty display name", () => {
    expect(profileSchema.safeParse({ ...valid, displayName: "  " }).success).toBe(false);
  });
});

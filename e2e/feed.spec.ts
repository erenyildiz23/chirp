import { expect, test } from "@playwright/test";
import { signIn, writePost } from "./helpers";

// Uses the seeded demo account from supabase/seed.sql, whose feed has more than one page.
test("posts loaded with Load more stay visible after posting", async ({ page }) => {
  await signIn(page, "demo@chirp.local", "password123");

  const posts = page.getByRole("article");
  await expect(posts).toHaveCount(20);
  await page.getByRole("button", { name: "Load more" }).click();
  await expect(posts).not.toHaveCount(20);

  const twentieth = await posts.nth(19).getByRole("link", { name: /View post by/ }).getAttribute("href");
  await writePost(page, `load more regression check ${Date.now()}`);

  await expect(page.locator(`a[aria-label^="View post"][href="${twentieth}"]`)).toHaveCount(1);
});

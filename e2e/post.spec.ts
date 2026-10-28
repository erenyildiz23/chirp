import { expect, test } from "@playwright/test";
import { signUpNewUser, writePost } from "./helpers";

test("a new user can post and see it at the top of the feed", async ({ page }) => {
  await signUpNewUser(page, "poster");
  await writePost(page, "hello from e2e");

  await expect(page.getByRole("article").first()).toContainText("hello from e2e");
});

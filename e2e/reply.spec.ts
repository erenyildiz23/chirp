import { expect, test } from "@playwright/test";
import { signUpNewUser, writePost } from "./helpers";

test("a reply shows up on the post's detail page", async ({ page }) => {
  await signUpNewUser(page, "replier");
  await writePost(page, "what do you think?");

  await page.getByRole("link", { name: /View post by/ }).first().click();
  await expect(page).toHaveURL(/\/status\/\d+$/);

  await page.getByLabel("Reply", { exact: true }).fill("nice");
  await page.getByRole("button", { name: "Reply", exact: true }).click();

  await expect(page.getByRole("article").filter({ hasText: "nice" })).toBeVisible();
  await expect(page.getByRole("link", { name: "1 reply. Reply" }).first()).toBeVisible();
});

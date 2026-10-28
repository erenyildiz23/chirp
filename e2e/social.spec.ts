import { expect, test } from "@playwright/test";
import { signUpNewUser, writePost } from "./helpers";

test("following, liking and reposting notify the author", async ({ browser }) => {
  const authorPage = await (await browser.newContext()).newPage();
  const author = await signUpNewUser(authorPage, "author");
  await writePost(authorPage, "something worth liking");

  const fanPage = await (await browser.newContext()).newPage();
  await signUpNewUser(fanPage, "fan");
  await fanPage.goto(`/${author.username}`);
  const header = fanPage.getByRole("region", { name: "Profile" });
  await header.getByRole("button", { name: "Follow" }).click();
  await expect(header.getByRole("button", { pressed: true })).toBeVisible();

  const post = fanPage.getByRole("article").filter({ hasText: "something worth liking" });
  await post.getByRole("button", { name: /Like$/ }).click();
  await expect(post.getByRole("button", { name: /Unlike$/ })).toBeVisible();
  await post.getByRole("button", { name: /Repost$/ }).click();
  await expect(post.getByRole("button", { name: /Undo repost$/ })).toBeVisible();

  // Give the server actions time to land before the author looks.
  await expect(async () => {
    await authorPage.goto("/notifications");
    await expect(authorPage.getByText("followed you")).toBeVisible({ timeout: 1000 });
    await expect(authorPage.getByText("liked your post")).toBeVisible({ timeout: 1000 });
    await expect(authorPage.getByText("reposted your post")).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });
});

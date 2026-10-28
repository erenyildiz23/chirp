import { expect, type Page } from "@playwright/test";

export type TestUser = { username: string; email: string; password: string };

/** Signs up a fresh user through the UI and lands on /home. */
export async function signUpNewUser(page: Page, prefix: string): Promise<TestUser> {
  const suffix = Math.random().toString(36).slice(2, 8);
  const username = `${prefix}${suffix}`.slice(0, 15);
  const user = { username, email: `${username}@e2e.local`, password: "password123" };

  await page.goto("/signup");
  await page.getByLabel("Name", { exact: true }).fill(`E2E ${prefix}`);
  await page.getByLabel("Username", { exact: true }).fill(user.username);
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/home$/);
  return user;
}

export async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/home$/);
}

export async function writePost(page: Page, text: string): Promise<void> {
  await page.getByLabel("What's happening?").fill(text);
  await page.getByRole("button", { name: "Post", exact: true }).click();
  await expect(page.getByRole("article").filter({ hasText: text })).toBeVisible();
}

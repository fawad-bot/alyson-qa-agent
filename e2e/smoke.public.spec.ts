import { test, expect } from "@playwright/test";

test("auth page renders sign-in options", async ({ page }) => {
  await page.goto("/auth");
  await expect(page).toHaveTitle(/Alyson/i);
  // Google sign-in button OR email form must be present
  const google = page.getByRole("button", { name: /google/i });
  const email = page.getByLabel(/email/i);
  await expect(google.or(email).first()).toBeVisible();
});

test("root redirects unauthenticated users to /auth", async ({ page }) => {
  await page.goto("/");
  await page.waitForURL(/\/auth/, { timeout: 10_000 });
  expect(page.url()).toContain("/auth");
});

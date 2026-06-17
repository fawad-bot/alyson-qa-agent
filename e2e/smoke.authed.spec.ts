import { test, expect } from "@playwright/test";
import fs from "node:fs";

test.skip(!fs.existsSync(".auth/user.json"), "Run `bun run test:e2e:auth` once to capture session, see e2e/README.md");

const NAV = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Agent Engines", path: "/engines" },
  { label: "Applications & Targets", path: "/targets" },
  { label: "QA Runs", path: "/runs" },
  { label: "Reports", path: "/reports" },
  { label: "Test Suites", path: "/suites" },
  { label: "Quality Gates", path: "/gates" },
  { label: "Findings", path: "/findings" },
  { label: "Evidence", path: "/evidence" },
  { label: "Alerts", path: "/alerts" },
  { label: "Fix Tasks", path: "/fix-tasks" },
  { label: "Human Review", path: "/human-review" },
  { label: "Auto-Fix Queue", path: "/auto-fix" },
  { label: "Test Personas", path: "/personas" },
  { label: "Credentials", path: "/credentials" },
  { label: "Triggers", path: "/triggers" },
  { label: "Integrations", path: "/integrations" },
  { label: "Settings", path: "/settings" },
];

test.describe("Navigation smoke", () => {
  for (const item of NAV) {
    test(`navigates to ${item.label}`, async ({ page }) => {
      await page.goto("/dashboard");
      await page.getByRole("link", { name: item.label, exact: true }).first().click();
      await page.waitForURL(`**${item.path}`);
      // Page renders without an unhandled error boundary
      await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
    });
  }
});

test("Run detail: tabs switch and evidence/findings/logs panels mount", async ({ page }) => {
  await page.goto("/runs");
  // Open first run row
  const firstRun = page.locator("table tbody tr").first();
  await expect(firstRun).toBeVisible({ timeout: 10_000 });
  await firstRun.click();
  await page.waitForURL(/\/runs\/[0-9a-f-]+/);

  for (const tab of ["Summary", "Pipeline", "Findings", "Evidence", "Alerts", "Logs", "Settings"]) {
    await page.getByRole("tab", { name: new RegExp(`^${tab}`) }).click();
    await expect(page.getByRole("tabpanel")).toBeVisible();
  }
});

test("Evidence drawer opens when a card is clicked", async ({ page }) => {
  await page.goto("/evidence");
  const empty = page.getByText(/no evidence yet/i);
  if (await empty.isVisible().catch(() => false)) {
    test.skip(true, "No evidence rows yet — run a few QA runs to seed data");
  }
  await page.locator("button.card-surface").first().click();
  // Sheet exposes a dialog role
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText(/^Payload$/)).toBeVisible();
});

test("New Run flow creates a run and redirects to the detail page", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /new run/i }).first().click();

  // Pick first available target
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("combobox").first().click();
  await page.getByRole("option").first().click();

  // Submit
  await dialog.getByRole("button", { name: /start|launch|create|run/i }).first().click();

  // Should land on the run detail page
  await page.waitForURL(/\/runs\/[0-9a-f-]+/, { timeout: 15_000 });
  await expect(page.getByRole("tab", { name: /pipeline/i })).toBeVisible();
});

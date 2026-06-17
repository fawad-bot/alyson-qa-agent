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
      await page.getByTestId(`nav-${item.path.slice(1)}`).click();
      await page.waitForURL(`**${item.path}`);
      await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
    });
  }
});

test("Run detail: all 7 tabs switch and panels mount", async ({ page }) => {
  await page.goto("/runs");
  const firstRun = page.getByTestId("runs-row").first();
  await expect(firstRun).toBeVisible({ timeout: 10_000 });
  await firstRun.click();
  await page.waitForURL(/\/runs\/[0-9a-f-]+/);

  for (const tab of ["summary", "pipeline", "findings", "evidence", "alerts", "logs", "settings"]) {
    await page.getByTestId(`run-tab-${tab}`).click();
    await expect(page.getByRole("tabpanel")).toBeVisible();
  }
});

test("Evidence drawer opens when a card is clicked", async ({ page }) => {
  await page.goto("/evidence");
  const card = page.getByTestId("evidence-card").first();
  if (!(await card.isVisible().catch(() => false))) {
    test.skip(true, "No evidence rows yet — run a few QA runs to seed data");
  }
  await card.click();
  await expect(page.getByTestId("evidence-drawer")).toBeVisible();
  await expect(page.getByText(/^Payload$/)).toBeVisible();
});

test("New Run flow: target step → branch step → submit → redirect", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByTestId("new-run-button").click();

  const dialog = page.getByTestId("new-run-dialog");
  await expect(dialog).toBeVisible();

  // Step 1: pick target
  await expect(dialog.getByTestId("new-run-step-target")).toBeVisible();
  await dialog.getByTestId("new-run-target-select").click();
  await page.locator('[data-testid^="new-run-target-option-"]').first().click();

  // Step 2: branch is pre-filled with "main" but verify visible/editable
  await expect(dialog.getByTestId("new-run-step-branch")).toBeVisible();
  await dialog.getByTestId("new-run-branch-input").fill("main");

  // Submit
  await dialog.getByTestId("new-run-submit").click();

  // Redirects to detail
  await page.waitForURL(/\/runs\/[0-9a-f-]+/, { timeout: 15_000 });
  await expect(page.getByTestId("run-tab-pipeline")).toBeVisible();
});

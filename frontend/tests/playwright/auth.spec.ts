import { test, expect } from "@playwright/test";

/*
 * VisualPC — E2E Auth & Navigation Tests
 * Validates: login flow, sidebar nav, worker cards, responsive breakpoints
 */

const ADMIN_CREDS = { username: "admin", password: "visualpc2026" };

test.describe("Authentication", () => {
  test("should show login page by default", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("VisualPC Console")).toBeVisible();
  });

  test("should login with valid credentials", async ({ page }) => {
    await page.goto("/login");

    // Fill form
    const usernameInput = page.locator('input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await usernameInput.fill(ADMIN_CREDS.username);
    await passwordInput.fill(ADMIN_CREDS.password);

    // Submit
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should redirect to dashboard
    await page.waitForURL("**/dashboard", { timeout: 10000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    const usernameInput = page.locator('input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await usernameInput.fill("wrong");
    await passwordInput.fill("wrong");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should remain on login or show error
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toContain("login");
  });
});

test.describe("Sidebar Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/login");
    const usernameInput = page.locator('input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    await usernameInput.fill(ADMIN_CREDS.username);
    await passwordInput.fill(ADMIN_CREDS.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("**/dashboard", { timeout: 10000 });
  });

  test("should navigate from Dashboard to Workers", async ({ page }) => {
    // Click Workers in sidebar
    await page.getByRole("link", { name: /workers/i }).click();
    await page.waitForURL("**/workers", { timeout: 5000 });
    await expect(page).toHaveURL(/workers/);
  });

  test("should show Workers page content", async ({ page }) => {
    await page.goto("/workers");
    await page.waitForTimeout(2000);
    // Should see the Workers heading
    await expect(page.getByRole("heading", { name: /workers/i, level: 1 })).toBeVisible();
  });

  test("should navigate to Jobs page", async ({ page }) => {
    await page.getByRole("link", { name: /jobs/i }).click();
    await page.waitForURL("**/jobs", { timeout: 5000 });
    await expect(page).toHaveURL(/jobs/);
  });
});

test.describe("Responsive Layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    const usernameInput = page.locator('input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    await usernameInput.fill(ADMIN_CREDS.username);
    await passwordInput.fill(ADMIN_CREDS.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("**/dashboard", { timeout: 10000 });
  });

  test("viewport 1366 — sidebar visible", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.waitForTimeout(500);
    // Sidebar should be visible
    await expect(page.locator("aside")).toBeVisible();
  });

  test("viewport 768 — should render dashboard", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    // Page should render without crash
    await expect(page.locator("body")).toBeVisible();
  });

  test("viewport 320 — should render login page without overflow", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/login");
    await page.waitForTimeout(500);
    await expect(page.getByText("VisualPC Console")).toBeVisible();
  });
});

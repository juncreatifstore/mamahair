import { test, expect } from "@playwright/test";

test("home renders with MAMAHAIR branding", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("header")).toContainText(/MAMAHAIR/i);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("visit a product, choose options, add to cart, reach checkout", async ({ page }) => {
  await page.goto("/products/body-wave-lace-front-wig");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Body Wave");
  await page.getByRole("button", { name: /add to cart/i }).click();
  await expect(page.getByRole("status")).toContainText(/added/i);
  await page.goto("/cart");
  await expect(page.getByText(/Body Wave Lace Front Wig/)).toBeVisible();
  await page.getByRole("link", { name: /check out/i }).click();
  await expect(page).toHaveURL(/\/checkout/);
  await page.getByLabel("Email").fill("e2e@example.com");
  await page.getByRole("button", { name: /continue/i }).first().click();
  await page.getByLabel("Full name").fill("E2E Tester");
  await page.getByLabel("Address").fill("1 Main St");
  await page.getByLabel("City").fill("Miami");
  await page.getByLabel("ZIP / postal code").fill("33101");
  await page.getByRole("button", { name: /continue/i }).first().click();
  await expect(page.getByText(/business days/i).first()).toBeVisible();
});

test("search suggests products", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /search/i }).first().click();
  await page.getByPlaceholder(/search/i).fill("body wave");
  await expect(page.getByText(/Body Wave/).first()).toBeVisible();
});

test("login page and admin redirect for anonymous users", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel("Email")).toBeVisible();
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);
});

test("admin login (requires E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD)", async ({ page }) => {
  test.skip(!process.env.E2E_ADMIN_EMAIL, "no admin credentials");
  await page.goto("/login?next=/admin");
  await page.getByLabel("Email").fill(process.env.E2E_ADMIN_EMAIL!);
  await page.getByLabel("Password").fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

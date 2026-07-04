import { expect, test } from "@playwright/test";
import { installErrorGuards } from "./support/error-guard";

test("dashboard navigation reaches the primary pages", async ({ page }, testInfo) => {
  const guard = installErrorGuards(page, testInfo);

  await page.goto("/");
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.locator("main")).toContainText("4");

  await page.locator('nav a[href="/companies"]').click();
  await expect(page).toHaveURL(/\/companies$/);
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.locator('input[name="q"]')).toBeVisible();

  await page.locator('nav a[href="/jobs"]').click();
  await expect(page).toHaveURL(/\/jobs$/);
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.locator('form[action="/api/jobs/priority"]').first()).toBeVisible();

  await guard.assertClean();
});

test("company search filters rows and opens a detail page", async ({ page }, testInfo) => {
  const guard = installErrorGuards(page, testInfo);

  await page.goto("/companies");
  await page.locator('input[name="q"]').fill("3234567890123");
  await page.locator('form button[type="submit"]').click();

  await expect(page).toHaveURL(/q=3234567890123/);
  await expect(page.locator("tbody tr")).toHaveCount(1);
  const companyLink = page.locator('tbody a[href^="/companies/"]').first();
  await expect(companyLink).toHaveAttribute("href", "/companies/33333333-3333-4333-8333-333333333333");

  await companyLink.click();
  await expect(page).toHaveURL(/\/companies\/33333333-3333-4333-8333-333333333333$/);
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.locator("main")).toContainText("annual_revenue");
  await expect(page.locator("main")).toContainText("estimated");

  await guard.assertClean();
});

test("CSV export calls the API, creates a success state, and returns CSV content", async ({ page }, testInfo) => {
  const guard = installErrorGuards(page, testInfo);

  const apiResponse = await page.request.get("/api/companies/export", { headers: { accept: "text/csv" } });
  expect(apiResponse.ok()).toBe(true);
  expect(apiResponse.headers()["content-type"]).toContain("text/csv");
  await expect(apiResponse.text()).resolves.toContain("corporate_number,company_name,official_url,industry");

  await page.goto("/companies");
  const responsePromise = page.waitForResponse((response) => response.url().includes("/api/companies/export") && response.status() === 200);
  await page.getByRole("button", { name: "CSV" }).click();
  const response = await responsePromise;

  expect(response.headers()["content-type"]).toContain("text/csv");
  await expect(page.getByRole("status")).toContainText("CSV");

  await guard.assertClean();
});

test("CSV export API failure shows an error without crashing", async ({ page }, testInfo) => {
  const guard = installErrorGuards(page, testInfo, {
    // This test intentionally injects a 500 for the export API; Chromium reports that resource failure as console.error.
    allowConsoleError: (text) => text.includes("Failed to load resource") && text.includes("500"),
    allowFailedResponse: (url, status) => url.includes("/api/companies/export") && status === 500,
  });

  await page.route("**/api/companies/export", async (route) => {
    await route.fulfill({ status: 500, body: "fixture upstream failure" });
  });

  await page.goto("/companies");
  await page.getByRole("button", { name: "CSV" }).click();
  await expect(page.locator('p[role="alert"]')).toContainText("CSV");
  await expect(page.locator("main h1")).toBeVisible();

  await guard.assertClean();
});

test("job priority form rejects invalid input and accepts safe dry-run updates", async ({ page }, testInfo) => {
  const guard = installErrorGuards(page, testInfo);

  await page.goto("/jobs");
  const jobRow = page.locator("tbody tr").first();
  await expect(jobRow).toBeVisible();

  await jobRow.locator('input[name="priority"]').fill("abc");
  await jobRow.locator('form[action="/api/jobs/priority"] button[type="submit"]').click();
  await expect(page.getByRole("alert")).toContainText(/1.*999/);

  await page.goto("/jobs");
  const refreshedRow = page.locator("tbody tr").first();
  await refreshedRow.locator('input[name="priority"]').fill("55");
  await refreshedRow.locator('form[action="/api/jobs/priority"] button[type="submit"]').click();
  await expect(page.getByRole("alert")).toContainText("Supabase");

  await guard.assertClean();
});

import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { installErrorGuards } from "./support/error-guard";

test("dashboard navigation reaches the primary pages", async ({ page }, testInfo) => {
  const guard = installErrorGuards(page, testInfo);

  await page.goto("/");
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.locator("main")).toContainText("4");

  await page.locator('nav a[href="/lists"]').click();
  await expect(page).toHaveURL(/\/lists$/);
  await expect(page.locator("main h1")).toContainText("リスト生成");
  await expect(page.locator('input[name="name"]')).toBeVisible();

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

test("list generation supports conditions, save dry-run, CSV upload preview, and saved list reuse", async ({ page }, testInfo) => {
  const guard = installErrorGuards(page, testInfo);

  await page.goto("/lists");
  await page.locator('input[name="name"]').fill("大阪物流フォロー");
  await page.locator('input[name="prefecture"]').fill("大阪府");
  await page.locator('select[name="hasRevenue"]').selectOption("no");
  await page.locator('select[name="sort"]').selectOption("employee_desc");
  await page.getByRole("button", { name: "リスト生成" }).click();

  await expect(page).toHaveURL(/\/lists\?/);
  await expect(page.locator("main")).toContainText("北浜物流合同会社");
  await expect(page.locator("main")).toContainText("1");
  await expect(page.locator("main")).toContainText("重複法人番号は検出されていません");
  await expect(page.locator("main")).toContainText("品質メモ");
  await expect(page.locator("main")).toContainText("年商なし");

  const previewDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV", exact: true }).click();
  const previewDownload = await previewDownloadPromise;
  const previewPath = await previewDownload.path();
  expect(previewPath).toBeTruthy();
  expect(readFileSync(previewPath!, "utf8")).toContain("北浜物流合同会社");

  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByRole("alert")).toContainText("Supabase未設定");

  await page.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), "tests", "fixtures", "csv", "list-upload.csv"));
  await page.getByRole("button", { name: "CSVを検査" }).click();
  await expect(page.getByRole("status")).toContainText("必須欠損");
  await expect(page.getByRole("status")).toContainText("2234567890123");

  await page.getByRole("link", { name: /高信頼URLあり営業リスト/ }).click();
  await expect(page).toHaveURL(/\/lists\/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/);
  await expect(page.locator("main")).toContainText("東都精密工業株式会社");
  await expect(page.locator("main")).toContainText("保存条件");
  await expect(page.locator("main")).toContainText("品質メモ");
  await expect(page.locator("main")).toContainText("良好");
  await expect(page.locator("main")).toContainText("信頼度80以上");
  await expect(page.locator("main")).toContainText("並び替え: 信頼度が高い順");

  const savedDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV", exact: true }).click();
  const savedDownload = await savedDownloadPromise;
  const savedPath = await savedDownload.path();
  expect(savedPath).toBeTruthy();
  expect(readFileSync(savedPath!, "utf8")).toContain("company_name");

  await page.getByRole("link", { name: "条件を再編集" }).click();
  await expect(page).toHaveURL(/\/lists\?.*listId=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/);
  await expect(page.getByRole("textbox", { name: "リスト名" })).toHaveValue("高信頼URLあり営業リスト");
  await expect(page.locator('select[name="hasUrl"]')).toHaveValue("yes");

  await page.getByRole("link", { name: "年商ありのみ" }).click();
  await expect(page).toHaveURL(/hasRevenue=yes/);
  await expect(page.locator("main")).toContainText("年商あり");

  await page.getByRole("button", { name: "更新" }).click();
  await expect(page.getByRole("alert")).toContainText("Supabase未設定");

  await page.goto("/lists/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("保存済みリスト");
    await dialog.dismiss();
  });
  await page.getByRole("button", { name: "削除" }).click();
  await expect(page).toHaveURL(/\/lists\/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa$/);

  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("元に戻せない");
    await dialog.accept();
  });
  await page.getByRole("button", { name: "削除" }).click();
  await expect(page).toHaveURL(/\/lists\?notice=dry-run-delete/);
  await expect(page.getByRole("alert")).toContainText("削除");

  await guard.assertClean();
});

test("company search filters rows and opens a detail page", async ({ page }, testInfo) => {
  const guard = installErrorGuards(page, testInfo);

  await page.goto("/companies");
  await page.locator('input[name="q"]').fill("3234567890123");
  await page.locator('form button[type="submit"]').click();

  await expect(page).toHaveURL(/q=3234567890123/);
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("main")).toContainText("1件");
  await expect(page.locator("main")).toContainText("LLM");
  const companyLink = page.locator('tbody a[href^="/companies/"]').first();
  await expect(companyLink).toHaveAttribute("href", "/companies/33333333-3333-4333-8333-333333333333");

  await companyLink.click();
  await expect(page).toHaveURL(/\/companies\/33333333-3333-4333-8333-333333333333$/);
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.locator("main")).toContainText("annual_revenue");
  await expect(page.locator("main")).toContainText("estimated");

  await guard.assertClean();
});

test("company filters support ranges, confidence, empty states, and detail actions", async ({ page }, testInfo) => {
  const guard = installErrorGuards(page, testInfo);

  await page.goto("/companies");
  await page.locator('select[name="employeeRange"]').selectOption("50-299名");
  await page.locator('select[name="hasRevenue"]').selectOption("no");
  await page.locator('select[name="sort"]').selectOption("employee_desc");
  await page.locator('form button[type="submit"]').click();

  await expect(page).toHaveURL(/employeeRange=50-299/);
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody")).toContainText("北浜物流合同会社");

  await page.locator('input[name="q"]').fill("存在しない企業");
  await page.locator('form button[type="submit"]').click();
  await expect(page.locator("tbody")).toContainText("条件に一致する企業はありません");

  await page.goto("/companies/11111111-1111-4111-8111-111111111111");
  await page.getByRole("button", { name: "再クロール" }).click();
  await expect(page.getByRole("alert")).toContainText("Supabase未設定");
  await page.getByRole("button", { name: "手動修正" }).click();
  await expect(page.getByRole("alert")).toContainText("Supabase未設定");

  await guard.assertClean();
});

test("CSV export calls the API, creates a success state, and returns CSV content", async ({ page }, testInfo) => {
  const guard = installErrorGuards(page, testInfo);

  const apiResponse = await page.request.get("/api/companies/export", { headers: { accept: "text/csv" } });
  expect(apiResponse.ok()).toBe(true);
  expect(apiResponse.headers()["content-type"]).toContain("text/csv");
  await expect(apiResponse.text()).resolves.toContain("corporate_number,company_name,official_url,industry");

  await page.goto("/companies");
  await page.locator('input[name="prefecture"]').fill("宮城県");
  await page.locator('select[name="valueKind"]').selectOption("estimated");
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/prefecture=%E5%AE%AE%E5%9F%8E%E7%9C%8C/);
  const responsePromise = page.waitForResponse((response) => response.url().includes("/api/companies/export") && response.status() === 200);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV" }).click();
  const response = await responsePromise;
  const download = await downloadPromise;
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();
  const filteredCsv = readFileSync(downloadPath!, "utf8");

  expect(response.headers()["content-type"]).toContain("text/csv");
  expect(response.url()).toContain("prefecture=");
  expect(download.suggestedFilename()).toBe("companies.csv");
  expect(filteredCsv).toContain("青葉食品株式会社");
  expect(filteredCsv).not.toContain("東都精密工業株式会社");
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

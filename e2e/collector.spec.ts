import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { csvImportMaxBytes, csvImportMaxSizeLabel } from "@/lib/csv-import-preview";
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
  let allowSavedListExportFailureAbort = false;
  const guard = installErrorGuards(page, testInfo, {
    // This flow intentionally submits invalid CSV preview input and injects one saved-list CSV export failure to verify recovery UI.
    allowConsoleError: (text) => text.includes("Failed to load resource") && (text.includes("400") || text.includes("500")),
    allowFailedResponse: (url, status) => (url.includes("/api/lists/import-preview") && status === 400) || (url.includes("/api/lists/export") && status === 500),
    allowRequestFailed: (url, errorText) => allowSavedListExportFailureAbort && url.includes("/api/lists/export") && errorText === "net::ERR_ABORTED",
  });

  await page.goto("/lists");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("textbox", { name: "リスト名" })).toHaveAttribute("maxlength", "100");
  await expect(page.getByRole("textbox", { name: "用途メモ" })).toHaveAttribute("maxlength", "300");
  await expect(page.getByRole("textbox", { name: "検索" })).toHaveAttribute("placeholder", "企業名・法人番号・URL・業種・所在地");
  await page.getByRole("textbox", { name: "リスト名" }).fill("名前だけのリスト");
  await page.getByRole("button", { name: "リスト生成" }).click();
  await expect(page.locator("main")).toContainText("全企業を対象にする場合は、対象範囲で明示的に選択してください");
  await expect(page.getByRole("button", { name: "保存" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "CSV", exact: true })).toHaveCount(0);

  await page.locator('select[name="scope"]').selectOption("all");
  await page.getByRole("button", { name: "リスト生成" }).click();
  await expect(page).toHaveURL(/scope=all/);
  await expect(page.locator("main")).toContainText("対象: 全企業");
  await expect(page.locator("tbody tr")).toHaveCount(4);

  await page.goto("/lists?scope=all");
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await page.getByRole("button", { name: "保存" }).click();
  await expect(appAlert(page)).toContainText("リスト名を入力してください");
  await page.goto(
    "/lists?error=operation-failed&scope=all&name=%E4%BF%9D%E5%AD%98%E5%A4%B1%E6%95%97%E5%BE%8C%E3%82%82%E6%9D%A1%E4%BB%B6%E3%82%92%E4%BF%9D%E6%8C%81",
  );
  await expect(appAlert(page)).toContainText("リスト操作に失敗しました");
  await expect(appAlert(page)).toContainText("入力条件は保持されています");
  await expect(appAlert(page)).toContainText("Supabase設定");
  await expect(page.getByRole("textbox", { name: "リスト名" })).toHaveValue("保存失敗後も条件を保持");
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await page.goto("/lists?error=operation-failed&action=delete");
  await expect(appAlert(page)).toContainText("リスト削除に失敗しました");
  await expect(appAlert(page)).toContainText("対象リストは削除されていません");
  await page.goto("/lists?scope=all");
  await page.getByRole("textbox", { name: "リスト名" }).fill("後から名前を付けたリスト");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(appAlert(page)).toContainText("Supabase未設定");
  await expect(page).toHaveURL(/name=/);
  await expect(page.getByRole("textbox", { name: "リスト名" })).toHaveValue("後から名前を付けたリスト");

  await page.goto("/lists?listId=not-a-uuid&hasUrl=yes");
  await expect(page.locator('form[action="/api/lists/update"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "保存" })).toHaveAttribute("formaction", "/api/lists/create");

  await page.goto("/lists?error=invalid-list-id");
  await expect(appAlert(page)).toContainText("保存済みリストを特定できませんでした");

  await page.goto("/lists?error=invalid-description");
  await expect(appAlert(page)).toContainText("用途メモは300文字以内");

  await page.goto("/lists?minConfidence=101");
  await expect(page.getByRole("spinbutton", { name: "最低信頼度" })).toHaveValue("100");
  await expect(page.locator("main")).toContainText("信頼度100以上");
  await expect(page.locator("tbody tr")).toHaveCount(1);

  await page.goto("/lists?excludedCompanyIds=22222222-2222-4222-8222-222222222222");
  await expect(page.getByRole("button", { name: "保存" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "CSV", exact: true })).toHaveCount(0);
  await expect(page.locator("tbody tr")).toHaveCount(0);

  await page.goto("/lists?scope=all&excludedCompanyIds=22222222-2222-4222-8222-222222222222");
  await expect(page.locator("tbody tr")).toHaveCount(3);
  await expect(page.locator("tbody")).not.toContainText("北浜物流合同会社");
  await page.getByRole("textbox", { name: "リスト名" }).fill("除外を保持するリスト");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(appAlert(page)).toContainText("Supabase未設定");
  await expect(page).toHaveURL(/excludedCompanyIds=22222222-2222-4222-8222-222222222222/);
  await expect(page).toHaveURL(/rowCount=3/);
  await expect(page.locator("tbody")).not.toContainText("北浜物流合同会社");

  await page.goto("/lists");
  await page.waitForLoadState("networkidle");
  await page.locator('input[name="prefecture"]').fill("宮城県");
  await page.getByRole("button", { name: "リスト生成" }).click();
  await expect(page).toHaveURL(/prefecture=%E5%AE%AE%E5%9F%8E%E7%9C%8C/);
  await expect(page.locator("main")).toContainText("青葉食品株式会社");
  await expect(page.getByRole("textbox", { name: "リスト名" })).toHaveValue("");

  await page.goto("/lists");
  await page.getByRole("textbox", { name: "検索" }).fill("3234567890123");
  await page.getByRole("button", { name: "リスト生成" }).click();
  await expect(page).toHaveURL(/q=3234567890123/);
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("main")).toContainText("検索: 3234567890123");
  await expect(page.locator("main")).toContainText("青葉食品株式会社");

  await page.goto("/lists");
  await page.getByRole("textbox", { name: "検索" }).fill("kitahama-logi");
  await page.getByRole("button", { name: "リスト生成" }).click();
  await expect(page).toHaveURL(/q=kitahama-logi/);
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("main")).toContainText("北浜物流合同会社");
  await expect(page.locator('tbody a[href="https://example.jp/kitahama-logi"]')).toBeVisible();

  await page.goto("/lists");
  await page.waitForLoadState("networkidle");
  await page.getByRole("textbox", { name: "検索" }).fill("KITAHAMA-LOGI");
  await page.getByRole("button", { name: "リスト生成" }).click();
  await expect(page).toHaveURL(/q=KITAHAMA-LOGI/);
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("main")).toContainText("北浜物流合同会社");

  await page.goto("/lists");
  await page.getByRole("textbox", { name: "リスト名" }).fill("0件から復旧するリスト");
  await page.getByRole("textbox", { name: "検索" }).fill("存在しない企業");
  await page.getByRole("button", { name: "リスト生成" }).click();
  await expect(page.locator("tbody")).toContainText("条件に一致する企業はありません");
  await expect(page.getByText("条件に一致する企業がありません。まず条件を1つ外して再生成できます。")).toBeVisible();
  await expect(page.getByRole("link", { name: "検索語を外す" })).toBeVisible();
  await page.getByRole("link", { name: "全企業で再生成" }).click();
  await expect(page).toHaveURL(/scope=all/);
  await expect(page.getByRole("textbox", { name: "リスト名" })).toHaveValue("0件から復旧するリスト");
  await expect(page.locator("tbody tr")).toHaveCount(4);

  await page.goto("/lists?scope=all");
  await page.getByRole("textbox", { name: "リスト名" }).fill("法人番号あり確認リスト");
  await page.getByRole("textbox", { name: "用途メモ" }).fill("法人番号がある企業だけで出力する");
  await page.getByRole("link", { name: "法人番号ありのみ" }).click();
  await expect(page).toHaveURL(/hasCorporateNumber=yes/);
  await expect(page.getByRole("textbox", { name: "リスト名" })).toHaveValue("法人番号あり確認リスト");
  await expect(page.getByRole("textbox", { name: "用途メモ" })).toHaveValue("法人番号がある企業だけで出力する");
  await expect(page.locator("main")).toContainText("法人番号あり");
  await expect(page.locator("tbody tr")).toHaveCount(4);

  await page.goto("/lists");
  await page.locator('input[name="name"]').fill("大阪物流フォロー");
  await page.locator('input[name="prefecture"]').fill("大阪府");
  await page.locator('select[name="hasRevenue"]').selectOption("no");
  await page.locator('select[name="sort"]').selectOption("employee_desc");
  await page.getByRole("button", { name: "リスト生成" }).click();

  await expect(page).toHaveURL(/\/lists\?/);
  await expect(page.locator("main")).toContainText("北浜物流合同会社");
  await expect(page.locator("main")).toContainText("1");
  await expect(page.getByRole("list", { name: "次の一手" }).locator("li")).toHaveCount(1);
  await expect(page.getByRole("list", { name: "次の一手" })).toContainText("年商");
  await expect(page.locator("main")).toContainText("重複法人番号は検出されていません");
  await expect(page.locator("main")).toContainText("現在の条件");
  await expect(page.locator("main")).toContainText("都道府県: 大阪府");
  await expect(page.locator("main")).toContainText("並び替え: 従業員数が多い順");
  await expect(page.locator("main")).toContainText("品質メモ");
  await expect(page.locator("main")).toContainText("業務利用目安");
  await expect(page.locator("main")).toContainText("要確認");
  await expect(page.locator("main")).toContainText("年商なし");

  await page.getByRole("textbox", { name: "リスト名" }).fill("除外後も名前を保持するリスト");
  await page.getByRole("textbox", { name: "用途メモ" }).fill("除外後も用途メモを保持する");
  await page.getByRole("link", { name: "除外", exact: true }).click();
  await expect(page).toHaveURL(/excludedCompanyIds=22222222-2222-4222-8222-222222222222/);
  await expect(page.getByRole("textbox", { name: "リスト名" })).toHaveValue("除外後も名前を保持するリスト");
  await expect(page.getByRole("textbox", { name: "用途メモ" })).toHaveValue("除外後も用途メモを保持する");
  await expect(page.locator("main")).toContainText("手動で1件を除外中です");
  await expect(page.locator("tbody")).toContainText("条件に一致する企業はありません");
  await expect(page.locator("tbody")).not.toContainText("北浜物流合同会社");

  await page.getByRole("link", { name: "除外をリセット" }).click();
  await expect(page.locator("tbody")).toContainText("北浜物流合同会社");

  const previewDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV", exact: true }).click();
  const previewDownload = await previewDownloadPromise;
  const previewPath = await previewDownload.path();
  expect(previewPath).toBeTruthy();
  const previewCsv = readFileSync(previewPath!, "utf8");
  expect(previewCsv.startsWith("\uFEFF")).toBe(true);
  expect(previewCsv).toContain("北浜物流合同会社");

  await page.getByRole("button", { name: "保存" }).click();
  await expect(appAlert(page)).toContainText("Supabase未設定");

  await page.getByRole("button", { name: "CSVを検査" }).click();
  await expect(page.locator('p[role="alert"]')).toContainText("CSV");
  await page.locator('input[type="file"]').setInputFiles({
    name: "too-large.csv",
    mimeType: "text/csv",
    buffer: Buffer.alloc(csvImportMaxBytes + 1, "x"),
  });
  await page.getByRole("button", { name: "CSVを検査" }).click();
  await expect(page.locator('p[role="alert"]')).toContainText(csvImportMaxSizeLabel);
  await page.getByText("対応している列名").click();
  await expect(page.locator("main")).toContainText("ホームページ");
  await expect(page.locator("main")).toContainText("産業分類");
  await assertNoPageHorizontalOverflow(page);

  const sampleDownloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "サンプルCSV" }).click();
  const sampleDownload = await sampleDownloadPromise;
  const samplePath = await sampleDownload.path();
  expect(samplePath).toBeTruthy();
  const sampleCsv = readFileSync(samplePath!, "utf8");
  expect(sampleDownload.suggestedFilename()).toBe("list-import-sample.csv");
  expect(sampleCsv.startsWith("\uFEFF")).toBe(true);
  expect(sampleCsv).toContain("法人番号,企業名,公式URL,業種");
  expect(sampleCsv).toContain("サンプル株式会社");

  await page.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), "tests", "fixtures", "csv", "list-upload.csv"));
  await expect(page.locator('p[role="alert"]')).toHaveCount(0);
  await page.getByRole("button", { name: "CSVを検査" }).click();
  await expect(page.locator("main")).toContainText("DBには保存せず");
  await expect(page.locator("main")).toContainText("corporate_number, company_name");
  await expect(page.getByRole("status")).toContainText("必須欠損");
  await expect(page.getByRole("status")).toContainText("修正が必要");
  await expect(page.getByRole("status")).toContainText("CSVを修正して再検査");
  await expect(page.getByRole("status")).toContainText("法人番号不正");
  await expect(page.getByRole("status")).toContainText("修正が必要な行");
  await expect(page.getByRole("status")).toContainText("3 / 3件を表示");
  await expect(page.getByRole("status")).toContainText("プレビュー表示は4 / 4行すべてです");
  await expect(page.getByRole("status")).toContainText("4行目");
  await expect(page.getByRole("status")).toContainText("2234567890123");

  await page.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), "tests", "fixtures", "csv", "missing-columns-list-upload.csv"));
  await page.getByRole("button", { name: "CSVを検査" }).click();
  await expect(page.getByRole("status")).toContainText("必須列不足");
  await expect(page.getByRole("status")).toContainText("corporate_number");

  await page.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), "tests", "fixtures", "csv", "japanese-headers-list-upload.csv"));
  await page.getByRole("button", { name: "CSVを検査" }).click();
  await expect(page.getByRole("status")).toContainText("取込確認OK");
  await expect(page.getByRole("status")).toContainText("日本語ヘッダー株式会社");
  await expect(page.getByRole("status")).toContainText("https://example.jp/nihongo");

  await page.locator('input[type="file"]').setInputFiles({
    name: "many-valid-rows.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      [
        "\uFEFF法人番号,企業名,公式URL,業種",
        "1234567890123,大量テスト1,https://example.jp/row-1,IT",
        "1234567890124,大量テスト2,https://example.jp/row-2,製造業",
        "1234567890125,大量テスト3,https://example.jp/row-3,小売業",
        "1234567890126,大量テスト4,https://example.jp/row-4,物流",
        "1234567890127,大量テスト5,https://example.jp/row-5,建設業",
        "1234567890128,大量テスト6,https://example.jp/row-6,サービス業",
      ].join("\n"),
      "utf8",
    ),
  });
  await page.getByRole("button", { name: "CSVを検査" }).click();
  await expect(page.getByRole("status")).toContainText("取込確認OK");
  await expect(page.getByRole("status")).toContainText("確認不要");
  await expect(page.getByRole("status")).toContainText("プレビュー表示は先頭5 / 6行です");
  await expect(page.getByRole("status")).toContainText("大量テスト5");
  await expect(page.getByRole("status")).not.toContainText("大量テスト6");

  const savedListCard = page.getByRole("link", { name: /高信頼URLあり営業リスト/ }).locator("xpath=ancestor::div[contains(@class, 'rounded-md') and contains(@class, 'border')][1]");
  await expect(savedListCard).toContainText("URLあり");
  await expect(savedListCard).toContainText("信頼度80以上");
  await expect(savedListCard).toContainText("並び替え: 信頼度が高い順");
  await page.getByRole("link", { name: /高信頼URLあり営業リスト/ }).click();
  await expect(page).toHaveURL(/\/lists\/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/);
  await expect(page.locator("main")).toContainText("東都精密工業株式会社");
  await expect(page.locator("main")).toContainText("保存条件");
  await expect(page.locator("main")).toContainText("再生成チェック");
  await expect(page.locator("main")).toContainText("値変更");
  await expect(page.locator("main")).toContainText("保存済みリストは現在の条件結果と一致しています。");
  await expect(page.locator("main")).toContainText("品質メモ");
  await expect(page.locator("main")).toContainText("業務利用目安");
  await expect(page.locator("main")).toContainText("良好");
  await expect(page.getByRole("region", { name: "次のアクション" })).toContainText("保存CSV");
  await expect(page.getByRole("region", { name: "次のアクション" })).toContainText("保存時点の3件");
  await expect(page.getByRole("region", { name: "次のアクション" })).toContainText("条件再編集");
  await expect(page.getByRole("region", { name: "次のアクション" })).toContainText("差分比較");
  await expect(page.locator("main")).toContainText("信頼度80以上");
  await expect(page.locator("main")).toContainText("並び替え: 信頼度が高い順");
  await expect(page.getByText("保存リスト比較", { exact: true })).toBeVisible();
  await expect(page.getByText("別の保存リストを選ぶと")).toBeVisible();
  const compareSelect = page.getByLabel("比較する保存リスト");
  await expect(compareSelect).toHaveJSProperty("required", true);
  await page.getByRole("button", { name: "比較" }).click();
  await expect(page).not.toHaveURL(/compareListId=/);
  await expect(compareSelect.evaluate((element) => (element as HTMLSelectElement).validity.valueMissing)).resolves.toBe(true);
  await compareSelect.selectOption("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
  await page.getByRole("button", { name: "比較" }).click();
  await expect(page).toHaveURL(/compareListId=bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/);
  await expect(page.locator("main")).toContainText("vs");
  await expect(page.locator("main")).toContainText("保存元");
  await expect(page.locator("main")).toContainText("比較先");
  await expect(page.locator("main")).toContainText("除外");
  await expect(page.locator("main")).toContainText("1234567890123");
  const comparisonRegion = page.getByRole("region", { name: "保存リスト比較" });
  const comparisonResponsePromise = page.waitForResponse((response) => response.url().includes("/api/lists/compare-export") && response.status() === 200);
  const comparisonDownloadPromise = page.waitForEvent("download");
  await comparisonRegion.getByRole("button", { name: "CSV" }).click();
  const comparisonResponse = await comparisonResponsePromise;
  const comparisonDownload = await comparisonDownloadPromise;
  const comparisonPath = await comparisonDownload.path();
  expect(comparisonPath).toBeTruthy();
  const comparisonCsv = readFileSync(comparisonPath!, "utf8");
  expect(comparisonResponse.headers()["content-type"]).toContain("text/csv");
  expect(comparisonDownload.suggestedFilename()).toContain("comparison");
  expect(comparisonCsv.startsWith("\uFEFF")).toBe(true);
  expect(comparisonCsv).toContain("change_type,base_list_name,target_list_name,corporate_number,company_name,changed_fields,before_values,after_values");
  expect(comparisonCsv).toContain("removed");
  expect(comparisonCsv).toContain("1234567890123");
  await page.goto("/lists/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa?compareListId=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  await expect(appAlert(page)).toContainText("別の保存リストを選択してください。");
  await page.goto("/lists/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  await expect(page.locator("main .overflow-x-auto table").first()).toBeVisible();
  await expect(page.getByRole("status")).toContainText("画面表示は3 / 3件です");
  await expect(page.getByRole("status")).toContainText("CSV出力は保存済みの3件すべて");
  await assertNoPageHorizontalOverflow(page);
  await expect(page.locator('tbody a[href="https://example.com/touto"]')).toBeVisible();

  const savedDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV", exact: true }).click();
  const savedDownload = await savedDownloadPromise;
  const savedPath = await savedDownload.path();
  expect(savedPath).toBeTruthy();
  const savedCsv = readFileSync(savedPath!, "utf8");
  expect(savedCsv.startsWith("\uFEFF")).toBe(true);
  expect(savedCsv).toContain("company_name");
  expect(savedCsv).toContain("https://disclosure.edinet-fsa.go.jp/");

  await page.route(/\/api\/lists\/export\?/, async (route) => {
    await route.fulfill({ status: 500, body: "saved list export failed" });
  });
  const savedListExportFailurePromise = page.waitForResponse((response) => response.url().includes("/api/lists/export") && response.status() === 500);
  allowSavedListExportFailureAbort = true;
  await page.getByRole("button", { name: "CSV", exact: true }).click();
  await savedListExportFailurePromise;
  await expect(page.locator('p[role="alert"]')).toContainText("CSV出力に失敗しました");

  await page.goto("/lists/cccccccc-cccc-4ccc-8ccc-cccccccccccc");
  await expect(page.getByRole("status")).toContainText("画面表示は0 / 0件です");
  await expect(page.locator("main")).toContainText("この保存リストには企業がありません。");
  await expect(page.locator("main")).toContainText("条件を広げて再編集するか");
  await page.getByRole("link", { name: "条件を広げて再編集" }).click();
  await expect(page).toHaveURL(/\/lists\?.*listId=cccccccc-cccc-4ccc-8ccc-cccccccccccc/);
  await expect(page.getByRole("textbox", { name: "検索" })).toHaveValue("存在しない企業");
  await page.goto("/lists/cccccccc-cccc-4ccc-8ccc-cccccccccccc");
  await page.getByRole("link", { name: "リスト生成へ戻る" }).click();
  await expect(page).toHaveURL(/\/lists$/);
  await page.goto("/lists/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");

  const firstSavedRow = page.locator("tbody tr").filter({ hasText: "東都精密工業株式会社" });
  await firstSavedRow.getByRole("link", { name: "除外して再編集" }).click();
  await expect(page).toHaveURL(/\/lists\?.*listId=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/);
  await expect(page).toHaveURL(/excludedCompanyIds=11111111-1111-4111-8111-111111111111/);
  await expect(page.getByRole("textbox", { name: "リスト名" })).toHaveValue("高信頼URLあり営業リスト");
  await expect(page.locator('select[name="hasUrl"]')).toHaveValue("yes");
  await expect(page.locator("main")).toContainText("手動で1件を除外中です");
  await expect(page.locator("tbody")).not.toContainText("東都精密工業株式会社");
  await expect(page.locator("tbody")).toContainText("北浜物流合同会社");

  await page.getByRole("link", { name: "除外をリセット" }).click();
  await expect(page.locator("tbody")).toContainText("東都精密工業株式会社");

  await page.getByRole("textbox", { name: "リスト名" }).fill("品質アクション後も残すリスト");
  await page.getByRole("textbox", { name: "用途メモ" }).fill("品質アクション後も残すメモ");
  await page.getByRole("link", { name: "年商ありのみ" }).click();
  await expect(page).toHaveURL(/hasRevenue=yes/);
  await expect(page.getByRole("textbox", { name: "リスト名" })).toHaveValue("品質アクション後も残すリスト");
  await expect(page.getByRole("textbox", { name: "用途メモ" })).toHaveValue("品質アクション後も残すメモ");
  await expect(page.locator("main")).toContainText("年商あり");

  await page.getByRole("button", { name: "更新" }).click();
  await expect(appAlert(page)).toContainText("Supabase未設定");

  await page.goto("/lists/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("保存済みリスト");
    expect(dialog.message()).toContain("先にCSVを出力");
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
  await expect(appAlert(page)).toContainText("削除");

  await guard.assertClean();
});

test("company search filters rows and opens a detail page", async ({ page }, testInfo) => {
  const guard = installErrorGuards(page, testInfo);

  await page.goto("/companies");
  await expect(page.getByRole("textbox", { name: "検索" })).toHaveAttribute("placeholder", "企業名・法人番号・URL・業種・所在地");
  await page.locator('input[name="q"]').fill("KITAHAMA-LOGI");
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/q=KITAHAMA-LOGI/);
  await expect(page.locator("main .overflow-x-auto table").first()).toBeVisible();
  await assertNoPageHorizontalOverflow(page);
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody")).toContainText("北浜物流合同会社");
  await expect(page.locator('tbody a[href="https://example.jp/kitahama-logi"]')).toBeVisible();

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
  await page.locator('select[name="hasCorporateNumber"]').selectOption("yes");
  await page.locator('select[name="hasRevenue"]').selectOption("no");
  await page.locator('select[name="sort"]').selectOption("employee_desc");
  await page.locator('form button[type="submit"]').click();

  await expect(page).toHaveURL(/employeeRange=50-299/);
  await expect(page).toHaveURL(/hasCorporateNumber=yes/);
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody")).toContainText("北浜物流合同会社");

  await page.locator('input[name="q"]').fill("存在しない企業");
  await page.locator('form button[type="submit"]').click();
  await expect(page.locator("tbody")).toContainText("条件に一致する企業はありません");

  await page.goto("/companies?error=invalid-company");
  await expect(appAlert(page)).toContainText("企業を特定できなかったため");

  await page.goto("/companies/11111111-1111-4111-8111-111111111111");
  await page.getByRole("button", { name: "再クロール" }).click();
  await expect(appAlert(page)).toContainText("Supabase未設定");
  await page.getByRole("button", { name: "手動修正" }).click();
  await expect(appAlert(page)).toContainText("Supabase未設定");

  await guard.assertClean();
});

test("missing company and list pages show recovery navigation", async ({ page }, testInfo) => {
  const guard = installErrorGuards(page, testInfo, {
    // These direct navigations intentionally exercise the custom 404 UI.
    allowConsoleError: (text) => text.includes("Failed to load resource") && text.includes("404"),
    allowFailedResponse: (url, status) =>
      status === 404 &&
      (url.includes("/companies/00000000-0000-4000-8000-000000000000") ||
        url.includes("/companies/not-a-uuid") ||
        url.includes("/lists/00000000-0000-4000-8000-000000000000") ||
        url.includes("/lists/not-a-uuid")),
  });

  await page.goto("/companies/00000000-0000-4000-8000-000000000000");
  await expect(page.locator("main")).toContainText("対象データが見つかりません");
  await page.getByRole("link", { name: "企業を検索" }).click();
  await expect(page).toHaveURL(/\/companies$/);

  await page.goto("/companies/not-a-uuid");
  await expect(page.locator("main")).toContainText("対象データが見つかりません");
  await page.getByRole("link", { name: "企業を検索" }).click();
  await expect(page).toHaveURL(/\/companies$/);

  await page.goto("/lists/00000000-0000-4000-8000-000000000000");
  await expect(page.locator("main")).toContainText("対象データが見つかりません");
  await page.getByRole("link", { name: "リスト生成へ" }).click();
  await expect(page).toHaveURL(/\/lists$/);

  await page.goto("/lists/not-a-uuid");
  await expect(page.locator("main")).toContainText("対象データが見つかりません");
  await page.getByRole("link", { name: "リスト生成へ" }).click();
  await expect(page).toHaveURL(/\/lists$/);

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
  expect(filteredCsv.startsWith("\uFEFF")).toBe(true);
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

test("job management accepts priority, retry, and stop actions safely", async ({ page }, testInfo) => {
  const guard = installErrorGuards(page, testInfo);

  await page.goto("/jobs");
  await page.locator('input[name="limit"]').fill("4");
  await page.getByRole("button", { name: "補完ジョブを計画" }).click();
  await expect(page).toHaveURL(/notice=dry-run-coverage/);
  await expect(appAlert(page)).toContainText("補完ジョブ");
  await expect(appAlert(page)).toContainText("Supabase未設定");
  await page.getByRole("button", { name: "次のジョブを1件実行" }).click();
  await expect(page).toHaveURL(/notice=dry-run-run/);
  await expect(appAlert(page)).toContainText("ジョブ実行は行わず");

  await page.locator('select[name="status"]').selectOption("failed");
  await page.getByRole("button", { name: "絞り込み" }).click();
  await expect(page).toHaveURL(/status=failed/);
  await expect(page.locator("main")).toContainText("1 / 4件を表示中");
  await expect(page.locator("tbody")).toContainText("青葉食品株式会社");
  await expect(page.locator("tbody")).not.toContainText("北浜物流合同会社");

  await page.locator('input[name="q"]').fill("存在しないジョブ");
  await page.getByRole("button", { name: "絞り込み" }).click();
  await expect(page.locator("tbody")).toContainText("条件に一致するジョブはありません");

  await page.getByRole("link", { name: "解除" }).click();
  await expect(page).toHaveURL(/\/jobs$/);
  const jobRow = page.locator("tbody tr").first();
  await expect(jobRow).toBeVisible();

  await jobRow.locator('input[name="priority"]').fill("abc");
  await jobRow.locator('form[action="/api/jobs/priority"] button[type="submit"]').click();
  await expect(appAlert(page)).toContainText(/1.*999/);

  await page.goto("/jobs");
  const refreshedRow = page.locator("tbody tr").first();
  await refreshedRow.locator('input[name="priority"]').fill("55");
  await refreshedRow.locator('form[action="/api/jobs/priority"] button[type="submit"]').click();
  await expect(appAlert(page)).toContainText("Supabase");

  await page.goto("/jobs");
  const failedJobRow = page.locator("tbody tr").filter({ hasText: "青葉食品株式会社" });
  await expect(failedJobRow).toBeVisible();
  await failedJobRow.getByRole("button", { name: "青葉食品株式会社をリトライ" }).click();
  await expect(page).toHaveURL(/notice=dry-run/);
  await expect(appAlert(page)).toContainText("Supabase");

  await page.goto("/jobs");
  const runningJobRow = page.locator("tbody tr").filter({ hasText: "北浜物流合同会社" });
  await expect(runningJobRow).toBeVisible();
  await runningJobRow.getByRole("button", { name: "北浜物流合同会社を停止" }).click();
  await expect(page).toHaveURL(/notice=dry-run/);
  await expect(appAlert(page)).toContainText("Supabase");

  await guard.assertClean();
});

function appAlert(page: Page) {
  return page.locator('main [role="alert"]').first();
}

async function assertNoPageHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

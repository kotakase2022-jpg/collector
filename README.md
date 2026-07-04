# Japan Company DB Collector

日本に存在する企業の「企業名、URL、業種、従業員数、年商」を、法人番号を第一キーに収集・更新する Next.js + Supabase のWebアプリ兼ETLクローラーです。

## セットアップ

```bash
npm install
cp .env.example .env.local
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。Supabase未設定でもモックデータで画面確認できます。

## 環境変数

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: サーバー側ETL/API専用。ブラウザへ露出させないでください
- `OPENAI_API_KEY`: LLM抽出を使う場合のみ設定
- `OPENAI_EXTRACTION_MODEL`: 既定は `gpt-5.4-mini`
- `GBIZINFO_API_TOKEN`: gBizINFO API利用時
- `EDINET_API_KEY`: EDINET API利用時
- `SEARCH_API_ENDPOINT`: 任意の検索API抽象化エンドポイント

## Supabase migration

```bash
supabase db push
```

または Supabase SQL Editor で `supabase/migrations/` 配下のSQLを順番に実行します。SupabaseのData API権限変更に備え、migrationには `service_role` への明示 `GRANT` とRLS有効化を含めています。保存済みリストのRPCも `service_role` のみ実行可能にし、公開クライアントから直接テーブルやRPCを操作する設計ではありません。

## 取り込み実行

国税庁「法人番号公表サイト」のCSVを取得し、ローカルに展開してから実行します。

```bash
npm run etl:import-nta -- ./data/nta.csv
```

法人番号、商号/名称、住所、都道府県、市区町村、閉鎖/合併状態をupsertします。重複は `corporate_number` で防ぎます。

## クロール実行

欠損項目に応じて補完ジョブを計画します。

```bash
npm run etl:plan-coverage -- --dry-run
npm run etl:plan-coverage -- --limit=1000
```

`official_url`、業種、従業員数、年商、推定年商の状態から、gBizINFO、EDINET、公式URL探索、公式サイトクロールのpendingジョブを作成します。既に `pending` または `running` の同種ジョブがある場合は重複投入しません。
同じ操作は `/jobs` の「補完ジョブを計画」からも実行できます。

```bash
npm run etl:run-job
```

`crawl_jobs` の `pending` を1件取り出し、gBizINFO連携または公式サイトクロールを実行します。cron運用ではこのコマンドを低頻度で呼び出してください。
同じ1件実行は `/jobs` の「次のジョブを1件実行」からも行えます。ブラウザ操作では一括実行せず、アクセス負荷とエラー内容を確認しながら進めてください。

```bash
npm run etl:self-evaluate
```

現在の収集カバレッジ、未達項目、次アクション、運用リスクをJSONで出力します。Supabase未設定時は `dataMode: "mock"` として開発用モックデータのサンプル評価であることを明示します。

## レート制限設定

- `CRAWLER_MAX_DEPTH`: 初期値 2
- `CRAWLER_MAX_PAGES`: 初期値 20
- `CRAWLER_MIN_DOMAIN_DELAY_MS`: 初期値 3000ms
- 1ドメインあたり逐次アクセスを前提にしています
- 並列化する場合もドメイン単位の間隔を維持してください

## robots.txt遵守方針

公式サイトクロールは取得前に `robots.txt` を読み、対象URLが禁止されている場合は取得しません。robots取得に失敗した場合は安全側に倒してクロールを拒否します。CAPTCHA突破、ログイン突破、アクセス制限回避、問い合わせフォーム送信、IPローテーションは実装しません。

## データソース一覧

- Tier 1: 国税庁 法人番号公表サイト
- Tier 1: gBizINFO
- Tier 1: EDINET
- Tier 1: 厚生労働省 職場情報総合サイト
- Tier 2: 企業公式サイト
- Tier 3: robots.txt・規約・負荷に問題がない第三者サイト

すべての採用値は `company_sources` と `company_observations` に `source_url`、取得日時、抽出方法、信頼度を保存します。

## 推定値の扱い

年商推定は任意機能です。推定値は必ず:

- `annual_revenue_type = estimated`
- `confidence_score <= 30`
- `source_type = llm_extraction`
- notesまたは根拠に「推定値であり、公式開示値ではない」と保存

公式値・準公式値・第三者掲載値とはUI上もDB上も混同しません。

## LLM抽出

`src/lib/etl/llm.ts` にOpenAI Responses APIのStructured Outputs用JSON schemaとプロンプトを実装しています。`OPENAI_API_KEY` が未設定の場合、ライブAPI呼び出しは行いません。

## CSVエクスポート

`/api/companies/export` から以下の列を出力します。

`corporate_number, company_name, official_url, industry, employee_count, employee_count_type, annual_revenue, annual_revenue_type, revenue_range, confidence_score, source_urls, updated_at`

## リスト生成とCSV取込チェック

`/lists` では、都道府県、業種、URL有無、年商/従業員数、信頼度、並び替え条件から業務用リストを生成できます。生成結果は欠損、推定値、低信頼、法人番号重複を確認してから保存できます。URLあり、年商あり、従業員数あり、推定年商除外、信頼度60以上の品質改善プリセットも用意しています。Supabase未設定時は本番データに触れないdry-runとして動作します。

保存済みリストは `saved_company_lists` と `saved_company_list_items` に保存され、`/lists/[id]` から再表示・CSV出力・条件再編集・削除できます。CSV取込チェックはアップロードファイルをDBへ保存せず、必須列欠損、法人番号重複、URL不正、先頭行プレビューのみを返します。

## テスト

```bash
npm test
npm run lint
npm run build
```

テスト対象:

1. 法人番号データ取り込み
2. 企業名正規化
3. URL候補判定
4. robots.txt遵守
5. HTML会社概要抽出
6. 従業員数正規化
7. 年商正規化
8. 信頼度スコア選定
9. 重複企業名寄せ
10. CSVエクスポート

## 既知の限界

- 「日本に存在する全企業」の完全網羅は保証しません
- 非上場企業の年商・従業員数は未公表が多く、`unknown` が自然な結果です
- EDINET対象外企業の年商は公式に取得できないことがあります
- 外部検索APIは抽象化のみで、利用契約に応じて差し替えてください
- gBizINFO/EDINETの本番利用には各サービスの最新仕様と利用条件を確認してください

## 本番運用時の注意点

このツールは、日本企業データの収集・整備を支援するものであり、全企業の完全網羅や全項目の完全正確性を保証するものではない。特に非上場企業の年商・従業員数は未公表の場合が多く、取得できない場合はunknown、または明示的にestimatedとして扱う。営業・与信・審査等に利用する場合は、必ずsource_urlとconfidence_scoreを確認し、重要判断には公式資料または本人確認済み資料を用いること。

## 実装済みファイル

- `src/app/*`: ダッシュボード、企業一覧、企業詳細、ジョブ管理、CSV/API
- `src/app/lists/*`: リスト生成、保存済みリスト再表示、CSV取込チェック
- `src/lib/etl/*`: 正規化、名寄せ、robots、HTML抽出、LLM抽出、gBizINFO、EDINET、公式サイトクロール、ジョブ実行
- `supabase/migrations/*`: DBスキーマ
- `scripts/*`: 取り込み、ジョブ実行、自己評価
- `tests/etl.test.ts`: 最低限テスト

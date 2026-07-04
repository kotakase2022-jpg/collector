import { parse } from "csv-parse/sync";
import { normalizeCorporateNumber } from "@/lib/etl/normalize";

export type NtaCorporateRecord = {
  corporateNumber: string;
  name: string;
  nameKana?: string | null;
  postalCode?: string | null;
  prefecture?: string | null;
  city?: string | null;
  address?: string | null;
  status: "active" | "closed" | "merged" | "unknown";
  raw: Record<string, unknown>;
};

export function parseNtaCsv(csvText: string): NtaCorporateRecord[] {
  const rows = parse(csvText, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  }) as Record<string, string>[];

  return rows
    .map(mapNtaRow)
    .filter((record): record is NtaCorporateRecord => Boolean(record));
}

export async function importNtaCsv(csvText: string) {
  const { addCompanySource, upsertCompany } = await import("@/lib/etl/store");
  const records = parseNtaCsv(csvText);
  let imported = 0;
  let skipped = 0;

  for (const record of records) {
    const company = await upsertCompany({
      corporateNumber: record.corporateNumber,
      name: record.name,
      nameKana: record.nameKana,
      postalCode: record.postalCode,
      prefecture: record.prefecture,
      city: record.city,
      address: record.address,
      status: record.status,
    });

    await addCompanySource({
      companyId: company.id,
      sourceType: "nta",
      sourceUrl: process.env.NTA_SOURCE_URL ?? "https://www.houjin-bangou.nta.go.jp/download/",
      sourceTitle: "国税庁 法人番号公表サイト",
      rawJson: record.raw,
      confidenceScore: 100,
    });
    imported += 1;
  }

  skipped = records.length - imported;
  return { imported, skipped, total: records.length };
}

function mapNtaRow(row: Record<string, string>): NtaCorporateRecord | null {
  const get = (...keys: string[]) => {
    for (const key of keys) {
      if (row[key] != null && row[key] !== "") return row[key];
    }
    return null;
  };

  const corporateNumber = normalizeCorporateNumber(get("corporateNumber", "法人番号", "corporate_number"));
  const name = get("name", "商号又は名称", "商号/名称", "company_name");
  if (!corporateNumber || !name) return null;

  const prefecture = get("prefectureName", "都道府県名", "prefecture");
  const city = get("cityName", "市区町村名", "city");
  const street = get("streetNumber", "丁目番地等", "street");
  const closeDate = get("closeDate", "登記記録の閉鎖等年月日");
  const successor = get("successorCorporateNumber", "承継先法人番号");

  return {
    corporateNumber,
    name,
    nameKana: get("furigana", "フリガナ", "name_kana"),
    postalCode: get("postCode", "郵便番号", "postal_code")?.replace(/\D/g, "") ?? null,
    prefecture,
    city,
    address: [prefecture, city, street].filter(Boolean).join(""),
    status: successor ? "merged" : closeDate ? "closed" : "active",
    raw: row,
  };
}

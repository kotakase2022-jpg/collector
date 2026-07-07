import { decodeCsvBuffer } from "@/lib/csv";
import { csvImportMaxBytes, csvImportMaxSizeLabel } from "@/lib/csv-import-preview";
import { parseCompanyCsvImportPreview } from "@/lib/list-quality";

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "CSVファイルを選択してください。" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "CSVファイルを選択してください。" }, { status: 400 });
  }
  if (file.size > csvImportMaxBytes) {
    return Response.json({ error: `CSVファイルは${csvImportMaxSizeLabel}以下にしてください。` }, { status: 400 });
  }

  try {
    return Response.json(parseCompanyCsvImportPreview(decodeCsvBuffer(await file.arrayBuffer())));
  } catch {
    return Response.json({ error: "CSVを解析できませんでした。ヘッダーと文字コードを確認してください。" }, { status: 400 });
  }
}

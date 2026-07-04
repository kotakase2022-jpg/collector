import { decodeCsvBuffer } from "@/lib/csv";
import { parseCompanyCsvImportPreview } from "@/lib/list-quality";

const maxUploadBytes = 1_000_000;

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "CSVファイルを選択してください。" }, { status: 400 });
  }
  if (file.size > maxUploadBytes) {
    return Response.json({ error: "CSVファイルは1MB以下にしてください。" }, { status: 400 });
  }

  try {
    return Response.json(parseCompanyCsvImportPreview(decodeCsvBuffer(await file.arrayBuffer())));
  } catch {
    return Response.json({ error: "CSVを解析できませんでした。ヘッダーと文字コードを確認してください。" }, { status: 400 });
  }
}

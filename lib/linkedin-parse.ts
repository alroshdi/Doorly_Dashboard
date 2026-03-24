import * as XLSX from "xlsx";
import { readFileSync } from "fs";

/**
 * LinkedIn XLS/XLSX exports often put a long disclaimer or a date-range row
 * before the real header row. Detect header index and return uniform row objects.
 */
function detectHeaderRowIndex(rows: unknown[][]): number {
  if (!rows.length) return 0;
  const r0 = rows[0];
  const c0 = String(r0[0] ?? "").trim();
  const c1 = r0[1];

  if (c0.length > 80) return 1;

  const dateLike = (s: string) => /^\d{1,2}\/\d{1,2}\/\d{4}/.test(s.trim());
  if (c1 != null && dateLike(c0) && dateLike(String(c1))) return 1;

  return 0;
}

function normalizeSheetRows(worksheet: XLSX.WorkSheet): Record<string, string | number>[] {
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: false,
    defval: "",
  }) as unknown[][];

  if (!rows.length) return [];

  const headerIdx = detectHeaderRowIndex(rows);
  const headers = (rows[headerIdx] ?? []).map((h) => String(h ?? "").trim());
  const out: Record<string, string | number>[] = [];

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    if (!row?.length) continue;
    const obj: Record<string, string | number> = {};
    let has = false;
    headers.forEach((header, j) => {
      if (!header) return;
      const cell = row[j];
      const v =
        cell === "" || cell == null
          ? ""
          : typeof cell === "number"
            ? cell
            : String(cell).trim();
      obj[header] = v as string | number;
      if (v !== "" && v != null) has = true;
    });
    if (has) out.push(obj);
  }

  return out;
}

export function parseLinkedInWorkbook(filePath: string): Record<string, Record<string, string | number>[]> {
  const fileBuffer = readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const data: Record<string, Record<string, string | number>[]> = {};

  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    if (!ws) continue;
    data[sheetName] = normalizeSheetRows(ws);
  }

  return data;
}

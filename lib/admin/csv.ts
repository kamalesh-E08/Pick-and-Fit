type CsvValue = string | number | boolean | null | undefined;

function escapeCsvValue(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  const needsQuotes = /[",\n\r]/.test(stringValue);
  const escaped = stringValue.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function toCsv(
  rows: Record<string, CsvValue>[],
  columns?: string[],
): string {
  if (rows.length === 0) {
    return columns && columns.length > 0 ? `${columns.join(",")}` : "";
  }

  const header = columns ?? Object.keys(rows[0]);
  const lines = [header.join(",")];

  for (const row of rows) {
    const line = header.map((key) => escapeCsvValue(row[key])).join(",");
    lines.push(line);
  }

  return lines.join("\n");
}

export function csvResponse(filename: string, csv: string) {
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"${filename}\"`,
    },
  });
}

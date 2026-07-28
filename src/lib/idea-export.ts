import type { Venture, Artifact } from "./domain";

function download(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function exportVenturesAsJSON(ventures: Venture[], artifacts: Artifact[]) {
  const rows = ventures.map((venture) => ({
    ...venture,
    artifacts: artifacts.filter((a) => a.ventureId === venture.id),
  }));
  download(
    `nucleus-ventures-${todayStamp()}.json`,
    JSON.stringify(rows, null, 2),
    "application/json"
  );
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function exportVenturesAsCSV(ventures: Venture[]) {
  const headers = ["id", "title", "description", "stage", "verdictScore", "createdAt", "updatedAt"];
  const rows = ventures.map((v) =>
    [v.id, v.title, v.description, v.stage, v.verdictScore ?? "", v.createdAt, v.updatedAt]
      .map((cell) => csvCell(String(cell)))
      .join(",")
  );
  download(`nucleus-ventures-${todayStamp()}.csv`, [headers.join(","), ...rows].join("\n"), "text/csv");
}

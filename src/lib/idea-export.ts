import type { SavedIdea } from "./idea-storage";

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

export function exportIdeasAsJSON(ideas: SavedIdea[]) {
  download(
    `nucleus-ideas-${todayStamp()}.json`,
    JSON.stringify(ideas, null, 2),
    "application/json"
  );
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function exportIdeasAsCSV(ideas: SavedIdea[]) {
  const headers = [
    "id",
    "idea",
    "marketSize",
    "competition",
    "estimatedCost",
    "revenueOpportunity",
    "savedAt",
  ];
  const rows = ideas.map((item) =>
    [
      item.id,
      item.idea,
      item.analysis.marketSize,
      item.analysis.competition,
      item.analysis.estimatedCost,
      item.analysis.revenueOpportunity,
      item.savedAt,
    ]
      .map(csvCell)
      .join(",")
  );
  download(
    `nucleus-ideas-${todayStamp()}.csv`,
    [headers.join(","), ...rows].join("\n"),
    "text/csv"
  );
}

import type { IdeaAnalysis } from "./mock-data";

export interface SavedIdea {
  id: string;
  idea: string;
  analysis: IdeaAnalysis;
  savedAt: string;
}

const STORAGE_KEY = "nucleus:saved-ideas";

// ponytail: localStorage mock store — swap for a real API/DB when a backend exists.
export function getSavedIdeas(): SavedIdea[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveIdea(idea: string, analysis: IdeaAnalysis): SavedIdea[] {
  const saved: SavedIdea = {
    id: crypto.randomUUID(),
    idea,
    analysis,
    savedAt: new Date().toISOString(),
  };
  const updated = [saved, ...getSavedIdeas()];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

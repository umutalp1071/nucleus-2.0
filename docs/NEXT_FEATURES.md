## Feature: Idea Export (JSON + CSV)

### Context
During Nucleus 2.0 Day 2, ideas are currently persisted using a localStorage-backed store.

A Peerlist discussion highlighted a future risk:
Nucleus should not become an idea silo. Users should be able to export their captured ideas and move them into external workflows (Notion, Linear, Figma, spreadsheets, etc.).

### Goal
Add friction-free export functionality for saved ideas.

The first implementation should support:
1. JSON export (full fidelity)
2. CSV export (simple interoperability)

### Requirements

#### JSON Export
- Add an "Export Ideas" action in the Saved Ideas section.
- Export all saved ideas as a downloadable `.json` file.
- Preserve the complete idea object structure.
- Filename format:
  `nucleus-ideas-YYYY-MM-DD.json`

Example structure:

```json
[
  {
    "id": "...",
    "title": "...",
    "description": "...",
    "analysis": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
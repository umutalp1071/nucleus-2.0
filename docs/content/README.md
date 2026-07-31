# CONTENT ENGINE
## Automated Content Generation System

As of Phase 10 (Build-in-Public Engine), drafts are generated through
Nucleus itself at `/content`, not hand-written per the templates that used
to live here -- see `docs/plan/PEERLIST-PLAYBOOK.md` for the rules baked
into the `write-buildinpublic` AI task, and `docs/workflow/PROTOCOL.md` §4
for the workflow.

### How It Works
1. `/content` → "Generate for this venture" or "Generate about Nucleus
   itself" (the dogfooding path, reading this repo's own git log and
   PROGRESS.md/learning.md)
2. Founder reviews, edits in place, approves or rejects (with a one-line
   reason fed back into the next generation) in the drafts inbox
3. Approved drafts → `docs/content/published/`, copy-to-clipboard for
   Peerlist (same text also goes to X/LinkedIn unedited)

### Directory Structure
docs/content/
├── drafts/         # Generated drafts awaiting review
├── published/      # Approved posts, filename date stamp intact
└── README.md       # This file

### No Manual Intervention Needed
- Draft creation (Nucleus generates via `write-buildinpublic`)
- Editorial selection of what's worth posting (`selectStory.ts`, a pure
  scoring function, no AI)
- Voice consistency (calibrated from the founder's own approved posts, not a
  tone slider)

### Manual Intervention Needed
- Screenshot / GIF insertion (the `## Visual` section names what to capture)
- Approve / edit / reject in the `/content` inbox
- Publishing schedule (see "Content is a queue, not a diary" in the
  playbook)

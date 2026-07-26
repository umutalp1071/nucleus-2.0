# CONTENT ENGINE
## Automated Content Generation System

### How It Works
1. Every Claude session end → auto-generate drafts
2. User approves / edits / rejects
3. Approved drafts → published to Peerlist

### Directory Structure
docs/content/
├── drafts/         # Auto-generated drafts
├── published/      # Copy of published posts
├── templates/      # Post templates
└── README.md       # This file

### No Manual Intervention Needed
- Draft creation (Claude auto-generates)
- Format consistency (From template)
- Date/context accuracy (From session data)

### Manual Intervention Needed
- Screenshot / GIF insertion
- Personal comment addition
- Tone adjustment per platform (Peerlist vs LinkedIn)
- Publishing schedule

# PHASE 07 — BUILD STAGE & THE HANDOFF

**Goal:** turn the plan into tracked work, and hand a build-ready spec to
whatever tool actually writes the code.

**Why now:** this is the copilot seam — the phase where Nucleus's honest scope
becomes a feature instead of a limitation. Nucleus does not write your app. It
makes sure the thing that writes your app is aimed correctly.

---

## Scope

**In:** milestones → tasks, manual progress tracking, `generate-build-spec`
task, spec export in three formats, `building` stage.

**Out of scope:** **code generation.** Git integration. CI for the user's
project. Time tracking. This is the seam; do not cross it. If codegen feels
tempting here, write it in `BACKLOG.md` and move on.

---

## Steps

### 1. Tasks from milestones

Advancing `planned → building` expands each milestone from the MVP scope into
checkable tasks. **No AI call** — the milestones already contain the content;
this is a data transformation.

```ts
interface BuildTask {
  id: string; ventureId: string; milestone: string;
  title: string; done: boolean; createdAt: string; doneAt: string | null;
}
```

Stored via a repository like everything else. Manual checkboxes. Progress
percentage derived, never stored.

Resisting an AI call here is the right instinct: the plan already did the
thinking, and paying a model to reformat data you already have is exactly the
waste the budget guard exists to prevent. Worth a `ponytail:` comment.

### 2. `generate-build-spec` task

Tier `mid`. Input: venture + plan + MVP scope. This is the artifact that
leaves Nucleus and enters a build tool.

```ts
const BuildSpecSchema = z.object({
  summary: z.string(),
  userStories: z.array(z.object({
    as: z.string(), iWant: z.string(), soThat: z.string(),
    acceptance: z.array(z.string()).min(1),
  })).min(3).max(10),
  dataModel: z.array(z.object({ entity: z.string(), fields: z.array(z.string()) })),
  screens: z.array(z.object({ name: z.string(), purpose: z.string(), elements: z.array(z.string()) })),
  outOfScope: z.array(z.string()).min(3),
  firstCommit: z.string(),      // the literal first thing to build
});
```

`firstCommit` is deliberate. The hardest part of starting is starting; naming
the first commit removes that.

### 3. Three export formats

The whole point of the phase. One artifact, three destinations:

- **Markdown** — human reading, pasting into a doc
- **`CLAUDE.md` / agent brief** — formatted as a build instruction for a coding
  agent, with the stack recommendation, the data model, the acceptance
  criteria, and an explicit "out of scope" section. This is the format that
  matters most and it should be excellent.
- **Prompt** — a single paste-ready block for Lovable / v0 / Bolt

One "Copy for…" control with three options. Copy to clipboard and download
both.

Format the agent brief by actually testing it: take a generated spec, paste it
into a real coding-agent session, see whether it produces something coherent,
and fix the format based on what breaks. **Do this before writing the post.**
A handoff format nobody has run is a guess.

### 4. Build stage UI

Milestone groups, task checkboxes, progress bar, spec panel with the export
control, and a "what's next" line naming the next unchecked task.

Advancing to `launched` requires all tasks checked, or an explicit
"skip remaining" with a confirmation. Do not silently allow a half-built
venture to be marked launched — the stage machine's honesty is the point.

### 5. External build link

A plain URL field on the venture: "Where is this being built?" (a repo, a
Lovable project, a folder path). One text input, no integration.

`ponytail: a URL field, not an integration. Add OAuth/webhooks only if
someone actually asks for status sync.`

---

## Acceptance

```bash
npm run verify
```

- `planned → building` creates tasks from milestones with **zero** AI calls
  (assert provider call count is 0 — this is the interesting test)
- Progress derived correctly; checking every task enables the launch advance
- All three export formats produce valid, complete output; test the
  round-trip of the agent brief in a real coding-agent session and record the
  result in `learning.md`
- Browser-verified, screenshots read

---

## Risks

| Risk | Mitigation |
|---|---|
| Scope creep into codegen | Explicitly out of scope; the seam is the product decision (`00-ANSWER.md` §2) |
| The agent brief is too vague to build from | Test it for real before shipping; iterate on the format based on what an actual agent does with it |
| Task list becomes a bad Jira | Checkboxes and nothing else. No assignees, priorities, due dates, or statuses beyond done |

---

## Peerlist posts

**A — SHIP:** *"Nucleus doesn't write your code. It writes the brief that
does."*
The honest positioning post. Every AI builder stops at "here's your app."
Nucleus produces a spec — user stories with acceptance criteria, data model,
screens, explicit out-of-scope, and the literal first commit — formatted three
ways, one of which is a brief for a coding agent. Show the generated brief and
the result of actually running it. Argue that the bottleneck was never typing
the code.

**B — LESSON:** *"The best feature I shipped this week makes zero AI calls."*
Expanding milestones into tasks looked like an obvious AI job. It isn't — the
plan already contains the content; a model call would be paying to reformat
data I already had, and it would introduce nondeterminism into something that
should be a pure function. The test that proves it asserts the provider was
called **zero** times. Broader point: on a $50/month budget you develop a
reflex for asking "does this need a model at all?", and the answer is no more
often than the AI-first framing suggests. Ask: what did you almost use an LLM
for before realising a `map` would do?

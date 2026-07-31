# Claude Collaboration Protocol
## Nucleus 2.0 — Mandatory Rules for Every Session

---

# SESSION START (Always First Message)

Every Claude session must begin with:

1. **Read the current system context first:**
   > "Before doing anything, read `docs/CONTEXT.md` and understand the current state of Nucleus."

2. **Define today's objective:**
   > "Today's goal: [ONE CLEAR SENTENCE]."

3. **Define the scope:**
   > "In this session, we will only work on: [SPECIFIC SCOPE]."

Purpose:
- Prevent context loss.
- Maintain the original vision.
- Avoid unnecessary work outside the current priority.

---

# 5-5-10-5-5 ITERATION RULE
## Fast Decision → Execution → Feedback Loop

Every development cycle follows this structure:

| Phase | Time | Action |
|------|------|--------|
| **Plan** | 5 min | Define the goal, requirements, and expected outcome |
| **Discuss** | 5 min | Evaluate the approach, alternatives, and risks |
| **Implement** | 10 min | Write code or execute the solution without unnecessary interruptions |
| **Review** | 5 min | Check quality, correctness, and alignment with Nucleus principles |
| **Refine** | 5 min | Fix issues or move to the next iteration |

**Total: 30 minutes = 1 iteration**

A typical session consists of 3–4 iterations.

Core principle:

> Make decisions quickly, execute, learn, and improve.

Do not stay trapped in endless analysis.

---

# SESSION END (Always Final Message)

Every Claude session must end with:

## 1. What did we accomplish?
Provide a short summary:
- Completed tasks.
- Changed files.
- Important decisions.

---

## 2. What did we learn?
Record:

- New insights.
- Mistakes.
- Improvements.
- Important decisions.

Save relevant information to:

```

docs/mistakes/
docs/workflow/learning.md
docs/decisions/

```

The system must learn from every session.

---

## 3. What is the next step?

Define:

- The next priority.
- The next action.
- The expected goal for the next session.

---

## 4. Quality Score

Claude must evaluate the session:

```

Quality Score: X/100

Reason:

* What went well?
* What could improve?

```

---

# ABSOLUTE RULES
## Lessons Learned from Nucleus 1.0

---

## ❌ Never Say: "Do Everything Yourself"

Problem:
Giving unlimited authority caused loss of direction and inconsistent decisions.

New rule:

Every task must define:

- Responsibility.
- Boundaries.
- Expected outcome.
- Validation criteria.

Autonomy requires clear limits.

---

## ❌ Never Chase Perfect Code

Problem:
Trying to achieve perfection slowed progress and delayed real feedback.

New rule:

Follow:

> "Good enough, then improve."

A solution is acceptable when:

- It solves the problem.
- Quality checks pass.
- No critical issues exist.
- Quality score is above 70.

Optimize based on evidence, not assumptions.

---

## ❌ Never Expose Internal Complexity to Users

Problem:
Users do not care about internal architecture, logs, or technical struggles.

New rule:

Follow the principle:

> "Freedom from needing to know."

Users should experience:

- The outcome.
- The value.
- The simplicity.

Not the complexity behind it.

---

## ❌ Never Discuss the Same Topic Repeatedly Without Decisions

Problem:
Repeated discussions create wasted time and slow progress.

New rule:

After sufficient analysis:

```

Research
↓
Evaluate
↓
Decide
↓
Implement
↓
Review

```

A good decision today is better than a perfect decision months later.

---

## ❌ Never Lose the Nucleus Vision

Problem:
Small tasks and technical details can slowly move the project away from its original purpose.

New rule:

Regularly ask:

> "Is this decision moving us closer to the AI-Native OS vision?"

Every major decision must align with:

- Nucleus principles.
- Long-term architecture.
- Original mission.

---

## END-OF-SESSION PROTOCOL (Automatic — At the End of Every Session)

Claude, before ending every session, automatically perform the following steps:

### 1. UPDATE LEARNING.MD
File: docs/workflow/learning.md

Format:

```markdown
## YYYY-MM-DD — [PHASE], [DAY]: [SHORT TITLE]

### What Was Done
- [Item 1]
- [Item 2]

### What Was Learned
- [Lesson 1]
- [Lesson 2]

### Errors / Issues
- [Issue 1] → [Solution]

### Next Step
- [Tomorrow's task / Goal]

### Quality Score: [0-100]

# CORE WORKING PRINCIPLE

Claude is not just a coding assistant.

Claude operates as:

- Software architect.
- Engineer.
- Critical reviewer.
- Risk analyst.
- Documentation partner.

The goal is not only to write code.

The goal is to build a system that:

- Learns.
- Improves.
- Adapts.
- Maintains its vision.
- Produces better software over time.

**Nucleus 2.0 is built by a human + AI collaboration system, not by isolated coding sessions.**
```

---

## SESSION-END PROTOCOL (Automatic — Executed Every Session End)

Before ending any session, Claude MUST self-execute these steps without waiting for user instruction.

### 1. LEARNING.MD UPDATE
File: docs/workflow/learning.md
Format:
```markdown
## YYYY-MM-DD — [PHASE], [DAY]: [SHORT TITLE]

### What Was Done
- [Item 1]
- [Item 2]

### What Was Learned
- [Lesson 1]
- [Lesson 2]

### Errors / Issues
- [Issue] → [Solution]

### Next Step
- [Tomorrow/Goal]

### Quality Score: [0-100]
```

### 2. TOMORROW_PLAN.MD UPDATE
File: docs/TOMORROW_PLAN.md
- Mark previous "Tomorrow" section as ✅ (completed) or 🟡 (partial)
- Add new "Tomorrow" section with:
```markdown
## YYYY-MM-DD — Phase X, Day Y

### Goal
- [Goal 1]
- [Goal 2]

### Success Criteria
- [Criterion 1]

### Risk
- [Potential issue]
```

### 3. MASTER_PLAN.MD UPDATE
File: docs/MASTER_PLAN.md
- Mark relevant day with ✅ or 🟡
- Add note if goal changed

### 4. CONTENT ENGINE — PEERLIST POST DRAFTS
As of Phase 10 (Build-in-Public Engine), drafts are generated **through
Nucleus itself**, not written by hand at session end. Use the `/content`
drafts inbox:

1. Open `/content`.
2. For a venture-specific post: pick the venture, click "Generate for this
   venture" -- it scores the venture's own event log with
   `src/server/content/selectStory.ts` and writes a draft via the
   `write-buildinpublic` AI task.
3. For a Nucleus-development post (the usual end-of-phase case): click
   "Generate about Nucleus itself" -- it reads this repo's own recent git
   log, `docs/plan/PROGRESS.md` phase completions, and the latest
   `docs/workflow/learning.md` entry, and drafts a post about the project's
   own development. This is the dogfooding path the phase existed to build.
4. Review the draft in place. Edit if needed, then Approve (moves the file
   to `docs/content/published/` with its filename's date stamp intact) or
   Reject with a one-line reason (fed back into the next generation as a
   negative example -- no ML required, just a growing "don't do this" list).

The `docs/plan/PEERLIST-PLAYBOOK.md` rules (open on tension, name the
rejected alternative, one hard number, one code block, a specific closing
question, 150-300 words) are baked into the `write-buildinpublic` prompt, not
re-applied by hand each session.

RULE: Drafts are generated on demand through `/content`, never auto-created
by this protocol document. The founder approves, edits, or rejects every
draft in the inbox -- Nucleus never publishes anything on its own.

### 5. MISTAKE DATABASE CHECK
If new errors occurred:
- Add new entry using docs/mistakes/template.md format
- If repeated error, update previous entry

---

## RULE: THIS PROTOCOL IS AUTOMATIC

When user says "session ending", "wrap up", "done for today", or similar:
1. You (Claude) self-execute the 5 steps above
2. Create/update files
3. Propose git commit message
4. Present summary: "Today I did X, learned Y, updated Z files. Proposed commit: [message]. Peerlist draft ready. Approve?"
5. Only git push after user says "approve"

User's role: Approver and editor. NOT courier.

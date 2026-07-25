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

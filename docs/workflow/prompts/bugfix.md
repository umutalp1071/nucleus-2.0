# BUG FIX PROMPT TEMPLATE
## Nucleus 2.0 — Minimal, Safe Error Resolution

---

# ERROR

```

[ERROR MESSAGE OR UNEXPECTED BEHAVIOR]

```

---

# LOCATION

```

[FILE / COMPONENT / SUSPECTED AREA]

```

---

# TASK

Fix the issue described above.

Goal:

> Make the smallest correct change that solves the problem.

---

# RULES

- Do not refactor unrelated code.
- Do not improve architecture unless required for the fix.
- Do not modify files outside the scope without asking first.
- Preserve existing behavior.
- Prefer simple fixes over complex solutions.

If you discover a larger design problem:

1. Explain it briefly.
2. Do not fix it in this task.
3. Suggest it as a separate improvement.

---

# REQUIRED PROCESS

Before changing code:

## 1. Diagnosis

Explain briefly:

```

Root cause:
[Why this happened]

```

---

## 2. Fix

Provide:

```

Changed:
[What was modified]

Why:
[Why this solves the problem]

```

Then implement the code change.

---

## 3. Validation

Check:

```

* Does the error disappear?
* Did this introduce new issues?
* Is existing functionality preserved?

```

---

## 4. Learning Record

After the fix, provide:

```

Lesson learned:

Problem:
[What happened]

Cause:
[Why it happened]

Prevention:
[How to avoid similar issues]

Save to:
docs/mistakes/

```

---

# FINAL CHECK

Before finishing, confirm:

✅ Smallest possible fix applied  
✅ No unnecessary changes made  
✅ Original architecture preserved  
✅ Lesson captured for future prevention  

---

# PRINCIPLE

A bug fix is not an opportunity to rewrite the system.

Fix the problem.
Understand the cause.
Improve the system's memory.
Move forward.
```

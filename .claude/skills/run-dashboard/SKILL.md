---
name: run-dashboard
description: "Launch and drive the Nucleus 2.0 dashboard (Next.js dev server) with a real headless browser, screenshot the result, and check for console errors. Use whenever asked to run, start, screenshot, or verify the dashboard in a real browser — not just tsc/next build."
---

# Run the Nucleus 2.0 dashboard

This is a Next.js 14 app. `tsc --noEmit` and `next build` catch type/build
errors but prove nothing about what a user actually sees. Use this skill to
drive the real thing.

## 1. Start the dev server

```bash
npm run dev > /tmp/nucleus-dev.log 2>&1 &
disown
timeout 30 bash -c 'until curl -sf http://localhost:3000 >/dev/null; do sleep 1; done'
```

Poll the port — don't `sleep N` and hope.

**Stop it when done** (Windows — no `lsof` in Git Bash, use PowerShell):

```powershell
$conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($conn) { $conn.OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force } }
```

## 2. Drive it

No `chromium-cli` is installed in this environment, and Playwright is **not**
a project dependency (kept out of `package.json` deliberately — see
Constraints below). Bootstrap it into the scratchpad each time instead of
adding it to the repo:

```bash
cd <scratchpad>
npm init -y >/dev/null 2>&1
npm install playwright --no-audit --no-fund
npx playwright install chromium   # first run only; caches globally after
```

Then run [smoke.js](smoke.js) from that same directory — it navigates to
`localhost:3000`, exercises the New Idea → Analyze → Save flow, reloads to
confirm persistence, checks Continue's toast, and screenshots each step:

```bash
node smoke.js "./screenshots"
```

It prints `SMOKE TEST PASSED` and `ERRORS: []` on success. Read the
screenshots with the Read tool afterward — a passing script proves no
exceptions were thrown, not that the layout looks right. Look at the image.

## 3. Adapt for a new feature

`smoke.js` is a template, not a fixed suite — edit its steps to match
whatever you're verifying this session (different input text, a new button,
a new dashboard card). Keep the shape: `goto` → `waitForSelector` →
`screenshot` → interact → `screenshot` → check `errors` is empty at the end.

## Constraints (don't violate these)

- **Never add `playwright` to `package.json`.** It's a verification tool for
  this agent, not a runtime or build dependency of the product. Install it
  fresh in the scratchpad every session.
- Project rule: UI/mock-only during Phase 1 — this skill is for verifying
  that layer, not for testing a backend that doesn't exist yet.

## Gotchas

- **React controlled inputs:** use Playwright's `fill`/`type`, never
  `el.value = ...` via `eval` — it won't fire React's `onChange`.
- **`next build` and `next dev` sharing `.next`:** don't run a production
  build while the dev server is live against the same `.next` directory —
  corrupts the webpack module cache (`__webpack_modules__[moduleId] is not a
  function`). Stop dev first, or build in CI/a separate checkout.
- **`npx -p playwright node script.js` does not work on Windows** — `-p`
  doesn't add to Node's require resolution here. Use a real
  `npm install` in a scratch directory instead (see step 2).

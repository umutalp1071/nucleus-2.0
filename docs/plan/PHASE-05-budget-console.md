# PHASE 05 — BUDGET CONSOLE & BYOK

**Goal:** the user brings their own OpenRouter key, sets their own caps, and
can see exactly where every cent went.

**Why now:** the guard exists but is invisible and unconfigurable. This phase
turns the constraint into the trust feature — and it is what makes the product
usable by someone who is not the founder.

---

## Scope

**In:** `/settings`, BYOK key entry + storage + validation, editable caps,
spend breakdown, degradation UX, key redaction discipline.

**Out of scope:** billing. Multi-user. Usage forecasting. Cost optimization
suggestions (Backlog).

---

## Steps

### 1. Settings page — `src/app/settings/page.tsx`

Four sections:

1. **AI connection** — key input, Test button, current mode badge
   (`Live` / `Demo mode`)
2. **Budget** — daily / weekly / monthly caps, editable, with the current
   spend against each
3. **Your data** — where it lives on disk, export, backup count
4. **Danger zone** — clear cache, delete all data (typed confirmation)

Section 3 is a differentiation feature. Literally printing the filesystem path
where the user's data lives is the most concrete possible expression of "under
their own control." Do not omit it because it seems mundane.

### 2. BYOK key handling

Store in `.nucleus/settings.json`, not in `.env`. Reason: the user is not
expected to edit files. `.nucleus/` is already gitignored.

Rules — treat these as security requirements, not conveniences:

- **Never** return the key from any API. `GET /api/settings` returns
  `{ hasKey: true, keyPreview: "sk-or-...4f2a" }`. Never the key itself.
- **Never** log it. Add it to a redaction list used by every log path.
- Provider reads it from settings at call time, falling back to
  `config.OPENROUTER_API_KEY`. Settings win — the UI is the primary path.
- The Test button makes one real minimum-cost call and reports success or a
  readable failure. **This call goes through `runTask` like everything else**;
  it is not an exception to the chokepoint.
- Removing the key returns the system to demo mode cleanly, without errors.

### 3. Caps

Editable, persisted, validated (`daily ≤ weekly ≤ monthly`, all > 0).
Defaults `10 / 30 / 50`.

Changing a cap takes effect on the very next `preflight` — no restart, no
cache. Test this explicitly.

### 4. Spend breakdown

`GET /api/budget/breakdown` → spend grouped by task, by venture, and by day
for the last 30 days, derived from `aiCalls`.

Render as a compact table plus a 30-day sparkline. Before writing any chart
code, read the `dataviz` skill.

The insight to surface: **cost per venture**. "This venture has cost you
$0.11" is the number that makes the budget real, far more than a monthly
total.

### 5. Degradation UX

Three states, each with a real design — not an alert box:

- **Approaching** (≥80% of any cap) — amber header pill, tooltip naming which
  window and when it resets
- **Downgraded** — a quiet inline note on the result: "Used a faster, cheaper
  model to stay within budget." Honest, non-alarming, no model name.
- **Blocked** — the affected action is disabled with the reason inline and the
  reset time. Never a dead button with no explanation.

### 6. Demo mode banner

With no key: a dismissible banner — "Demo mode: showing example AI results.
Add your OpenRouter key to analyze real ideas." Links to settings.

This must never be mistaken for real analysis. Every artifact generated in
demo mode is tagged `demo: true` and renders a small marker in the workspace.
Getting this wrong means someone makes a real decision on a fixture.

---

## Acceptance

```bash
npm run verify
```

- `GET /api/settings` never contains the full key — assert in a test
- `grep -ri "sk-or-" .nucleus/*.json` finds it only in `settings.json`, and
  `grep` across all log output finds it nowhere
- Set the daily cap to $0.01 → next AI action is blocked with a readable
  reason and a reset time; raise it → works immediately, no restart
- Remove the key → demo mode banner, system still fully functional
- Demo-generated artifacts carry a visible marker
- Browser-verified: all three degradation states, screenshots read

---

## Risks

| Risk | Mitigation |
|---|---|
| Key leaks into a log, an event payload, or an error message | Central redaction helper; a test asserting the settings API response shape; never put settings objects into event payloads |
| User sets a cap so low nothing works | Inline warning at < $1/day; never block them — it's their money |
| Demo results mistaken for real | `demo: true` on every artifact + persistent visual marker + banner |
| Key stored in plaintext on disk | Document it honestly in the settings UI: it is a local file with the same protection as the user's `.ssh` directory. Do not fake encryption with a hardcoded key — that is worse than plaintext because it lies |

---

## Peerlist posts

**A — SHIP:** *"Bring your own key. I never see your data or your bill."*
BYOK as a product position, not a cop-out. The user's key, the user's caps,
the user's files — the settings page literally prints the path on disk where
their data lives. Zero marginal cost means no incentive to upsell them into
more tokens. Screenshot the console with a real cost-per-venture number.

**B — LESSON:** *"I refused to encrypt the API key, and I think that's the
honest call."*
The tempting move is encrypting the stored key. But the decryption key would
have to live in the same repo, on the same disk — that isn't security, it's
theatre that makes users feel safer than they are. So it's plaintext in a
gitignored local file, documented plainly in the UI, with the same threat
model as `~/.ssh`. Name the cost: it looks worse in a screenshot than
`encrypted: true` would. Ask: where do you draw the line between real security
and security theatre in local-first apps?

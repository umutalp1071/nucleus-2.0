# PHASE 08 — LAUNCH STAGE

**Goal:** Nucleus produces a real landing page at a real public URL.

**Why now:** everything so far lives on the founder's machine. This is the
first output the outside world can see, and it is the moment the product stops
being a planner and starts being a studio.

---

## Scope

**In:** `write-landing-page` task, HTML generation, local preview, deploy
adapter (mock + Vercel), the `launched` stage, launch checklist.

**Out of scope:** custom domains. Analytics integration (Phase 09). A/B
testing (Backlog). Email capture backend — the form posts to a user-supplied
endpoint or Formspree-style URL, no backend of ours.

---

## Steps

### 1. `write-landing-page` task

Tier `mid`, `expectedOutTokens: 1400`. Input: venture + plan (positioning, ICP,
differentiation).

Output **structured content, not HTML**:

```ts
const LandingSchema = z.object({
  headline: z.string().max(70),
  subhead: z.string().max(160),
  problem: z.string(),
  solution: z.string(),
  benefits: z.array(z.object({ title: z.string().max(40), body: z.string() })).length(3),
  socialProofPlaceholder: z.string(),
  cta: z.object({ label: z.string().max(25), subtext: z.string() }),
  faq: z.array(z.object({ q: z.string(), a: z.string() })).min(3).max(5),
  seo: z.object({ title: z.string().max(60), description: z.string().max(155) }),
});
```

**The model writes copy; a template writes HTML.** This is the critical
decision of the phase. Letting an LLM emit raw HTML gives you unvalidatable
output, inconsistent quality, broken markup, accessibility regressions, and
XSS surface. Structured copy into a hand-built template gives you a
guaranteed-good page every time and a schema you can validate.

Length caps are load-bearing — an unbounded headline field returns a
paragraph.

### 2. Template — `src/server/launch/template.ts`

One function: `renderLandingPage(content, ventureTitle) -> string`.

Requirements:
- Single self-contained HTML file. Inlined CSS. No external requests, no CDN,
  no fonts, no JS framework.
- Responsive, semantic, accessible: real landmarks, one `h1`, contrast that
  passes WCAG AA, focus states, `prefers-color-scheme` support.
- **Every interpolated value is HTML-escaped.** The copy is model output
  derived from user input; treat it as untrusted. Write the escape helper and
  test it with `<script>` in a headline.
- `<meta>` from `seo`, Open Graph tags, `<title>`.
- Email form posts to a URL from venture settings; absent → the button is a
  mailto link. Never a dead button.

Test: generated HTML contains no `<script>` from content, escapes correctly,
has exactly one `h1`, and includes the meta description.

### 3. Deploy adapter — `src/server/deploy/`

Same mock/real pattern as the AI provider.

- `mock` — writes to `.nucleus/deploys/<ventureId>/index.html`, returns a
  `file://` URL. Fully functional with zero accounts.
- `vercel` — active when `VERCEL_TOKEN` is present. `POST /v13/deployments`
  with the single inline file. Returns the live URL.

```ts
export interface DeployTarget {
  deploy(ventureId: string, html: string): Promise<{ url: string; live: boolean }>;
}
```

Store the URL on the venture. Redeploy overwrites.

Deploy failures return a readable message and leave the stage unchanged. A
half-launched venture is worse than an unlaunched one.

### 4. Preview before deploy

`GET /api/ventures/[id]/preview` serves the generated HTML for an iframe in
the workspace, with edit-and-regenerate on the copy. The user must see it
before it goes public — this is a one-way door and the UI should treat it like
one.

### 5. Launch checklist

Before the `launched` transition, a short generated checklist: page reviewed,
CTA destination set, SEO title/description present, "who are the first 10
people you'll send this to" (pulled from the plan's `firstTenUsers`).

Not blocking — a nudge. The plan already answered the last question; showing
it back at the moment of launch is the studio behaving like a partner.

---

## Acceptance

```bash
npm run verify
```

- With no `VERCEL_TOKEN`: full flow works, page written to `.nucleus/deploys/`,
  opens correctly in a browser. **Read the screenshot.**
- Escaping test: a venture titled `<script>alert(1)</script>` produces a page
  with no executable script
- Generated HTML: one `h1`, meta description present, zero external requests
  (assert no `http://` or `https://` in `src`/`href` attributes except the
  user's own CTA)
- Renders correctly at 375px and 1440px, light and dark
- Deploy failure path returns a readable message, stage unchanged

---

## Risks

| Risk | Mitigation |
|---|---|
| XSS via model-generated copy | Escape everything; test with a script payload; the template is the only HTML author |
| Generated pages all look identical | Accepted for v1 — one excellent template beats five mediocre ones. Variants go in `BACKLOG.md` |
| Vercel API shape changes | Isolated in one adapter; mock path unaffected |
| User deploys something embarrassing | Mandatory preview step before the deploy button enables |

---

## Peerlist posts

**A — SHIP:** *"Idea to live landing page, inside one budget."*
The demo post. Screen recording: idea → verdict → plan → deployed URL, with
the total cost shown at the end (a real number, likely under $0.20). This is
the first post where the whole system is visible as one motion. Link the live
page.

**B — LESSON:** *"I don't let the AI write HTML."*
The decision and why. Asking a model for a landing page gives you
unvalidatable markup, inconsistent quality, broken accessibility, and an XSS
hole — and you can't schema-check a string of HTML. Instead the model returns
structured copy with length caps (headline ≤ 70 chars, exactly 3 benefits),
and a hand-written template renders it. Result: every page is accessible,
responsive, escaped, and zero-external-request, because the template guarantees
it rather than the model remembering to. Honest cost: every page looks the
same right now. Show the schema. Ask: where else are people letting models
emit markup they can't validate?

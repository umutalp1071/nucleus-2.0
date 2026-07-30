# Security

Nucleus is a single-operator, self-hosted application. There is no hosted
multi-tenant deployment of it, no Nucleus-run server, and no account system —
you run it on your own machine against your own data. That shrinks the attack
surface considerably, but the points below are worth being explicit about.

## Reporting a vulnerability

Please use [GitHub's private vulnerability reporting](https://github.com/umutalp1071/nucleus-2.0/security/advisories/new)
for this repository rather than opening a public issue. If that's not
available, open an issue with as little detail as possible and ask for a
private channel to share the rest.

## Security model

- **Your AI key never leaves your machine except to call OpenRouter itself.**
  `src/server/ai/provider.ts` is the only module allowed to hold or send it
  (enforced by `tests/boundaries.test.ts`, not just convention). The
  `GET /api/settings` response returns a redacted preview (`redactKey()`,
  `src/server/redact.ts`) — the full key is never sent back to the browser
  once saved.
- **No API key is required to run the app.** Every external dependency (AI
  provider, deploy target) has a deterministic mock selected by the absence
  of a key. This is permanent infrastructure, not a stub — see
  `docs/plan/ARCHITECTURE.md`.
- **Your data stays on your disk.** Everything lives under `.nucleus/` as
  plain JSON, is `.gitignore`d, and is never transmitted anywhere except the
  AI provider call itself (which sends only the fields a given task's prompt
  needs, never the whole store).
- **Every AI response is schema-validated at one boundary.** `runTask()` in
  `src/server/ai/gateway.ts` is the only place model output is parsed; nothing
  downstream does `JSON.parse` on an LLM response or trusts its shape.
- **No authentication.** This is deliberate for a single-operator, localhost-
  first tool, not an oversight — see `docs/plan/ARCHITECTURE.md` §"What is
  deliberately NOT here". If you deploy Nucleus somewhere network-reachable
  by other people, put it behind your own auth (a reverse proxy with basic
  auth, a VPN, Vercel's deployment protection, etc.) — the app itself does
  not gate access.
- **Module boundaries are enforced by tests, not discipline.** `src/server/**`
  can never be imported by a client component, only `store.ts` touches
  `node:fs`, and only `provider.ts` references the model host. All three are
  asserted in `tests/boundaries.test.ts` and fail CI if violated.

## Known dependency advisories

`npm audit` currently reports high-severity advisories against `next@14.2.35`
(DoS/SSRF-class issues in Server Components/Server Actions handling) and the
`postcss` version it bundles. No fix exists on the 14.2.x line — resolving
this requires a major-version upgrade to Next 15/16, which is a breaking
change across the whole app and is tracked as its own task rather than
patched in isolation. See `docs/plan/BACKLOG.md`.

If you're running Nucleus as a public-facing deployment rather than locally,
weigh that advisory against your own threat model before doing so.

## Supported versions

This project ships from a single `main` branch with no maintained release
branches. Security fixes land on `main`; there is no backport policy.

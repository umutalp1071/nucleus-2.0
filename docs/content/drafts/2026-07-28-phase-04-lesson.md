# Someone on Peerlist told me not to build a silo, so I built the export first

A comment on an early post flagged something I hadn't thought about: Nucleus
capturing ideas is only good if those ideas can leave again.

**What I hit:** early on, saved ideas lived only in the browser's
localStorage, with no way out. Nice for a demo, a trap for a real user --
what happens when they want their data in Notion, a spreadsheet, anywhere
else?

**What I tried first:** nothing yet -- the comment landed before export was
built, which is exactly the point. It became a written requirement
(`docs/NEXT_FEATURES.md`) before a single line of export code existed.

**What worked:** full-fidelity JSON with every artifact attached, plus CSV
for anyone who just wants a spreadsheet:

```ts
export function exportVenturesAsJSON(ventures: Venture[], artifacts: Artifact[]) {
  const rows = ventures.map((venture) => ({
    ...venture,
    artifacts: artifacts.filter((a) => a.ventureId === venture.id),
  }));
  download(`nucleus-ventures-${todayStamp()}.json`, JSON.stringify(rows, null, 2), "application/json");
}
```

One click, no account, everything you've generated -- including the AI's
verdict and competitor research, not just the idea text.

**Why this way:** a tool that's honest about being local-first has to make
"take your data and leave" trivially easy, or "local-first" is just a slogan.
The export button is the receipt for that promise.

**What it costs:** the export button shipped before almost any of the
feature it exports actually existed. Building infrastructure ahead of the
content that fills it is usually premature -- this is the one exception,
because the promise it makes (your data isn't trapped) needed to be true from
day one, not bolted on later once leaving became inconvenient for me to build.

What's the last feature a stranger's comment talked you into building?

#buildinpublic #nucleus2 #buildinginpublic

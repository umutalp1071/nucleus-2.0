# A test you've never seen fail isn't a test

I wrote a boundary test asserting that only one file in the codebase is
allowed to import `node:fs`. It passed immediately. That told me nothing —
the file it was supposed to catch didn't exist yet either.

**What I hit:** a green checkmark on a test I had zero evidence actually
worked. Passing-because-correct and passing-because-vacuous look identical in
a CI log.

**What I tried first:** just trusting the regex. It was simple, I'd read it
twice, it looked right.

**What worked:** I broke my own rule on purpose. Added `import fs from
"node:fs"` to an unrelated file, reran the suite, watched it fail with the
exact filename in the output, then reverted the line.

```
✗ only src/server/db/store.ts imports node:fs
  expected [ 'lib/mock-data.ts' ] to deeply equal []
```

**Why this way:** a test is a claim about what breaks. Until you've watched it
break for the reason you think it will, that claim is unverified — same
category of unverified as code you've never run.

**What it costs:** thirty seconds per rule, every time you add one. Worth it —
the alternative is finding out a guard rail was decorative the day something
actually goes through it.

Do you ever intentionally break your own tests before trusting them, or does
that feel like overkill for something this small?

#buildinpublic #nucleus2 #testing

# I chose JSON files over Postgres, on purpose

My own planning doc from three days ago said Supabase. I built plain JSON
files on disk instead, and I'd do it again.

**What I hit:** Nucleus is supposed to run "on your own computer, under your
own control." Supabase is a great free tier, but it's still someone else's
server, and it needs a project created before anything works — a setup step
between cloning the repo and seeing the app do something.

**What I tried first:** nothing, actually — I caught it at the planning
stage. But it's worth naming what the naive path looks like: sign up, create
a project, paste two keys into `.env.local`, then build. Every one of those
is a moment someone bounces.

**What worked:** one file, atomic writes, automatic backups.

```ts
const tmp = `${file}.tmp`;
fs.writeFileSync(tmp, JSON.stringify(rows, null, 2));
fs.renameSync(tmp, file);
```

Write to a temp file, then rename. A crash mid-write can never leave a
truncated file — the rename is atomic at the filesystem level, so the
collection is always either the old version or the new one, never garbage.

**Why this way:** `git clone && npm install && npm run dev` and the app
works, no account anywhere. That's not just nicer onboarding — a Supabase
dependency would have meant *I* couldn't hand this plan to an AI agent and
have it execute unattended, since the agent can't click through a signup
flow.

**What it costs:** I know the ceiling going in — roughly 10k rows, one writer,
no real concurrency. Fine for one operator. The upgrade path is one module
(`store.ts`) swapped for SQLite or Supabase; every repository function stays
the same.

Where's your line for "just use a file" versus "just use a database"?

#buildinpublic #nucleus2 #architecture

# Capping a schema field at 5 improved my AI output more than any prompt tweak

Asking a model for "the must-have features" always got me the same result:
twelve items, which is the same as no scope at all.

**What I hit:** an unbounded list field in a prompt is an invitation to list
everything. I tried rewording the instruction three different ways --
"be selective," "prioritize ruthlessly," "only the essentials" -- and the
count barely moved.

**What I tried first:** better prose. It doesn't work, because the model has
no natural stopping point without one, and "be selective" is not a stopping
point, it's a vibe.

**What worked:** a hard cap in the schema itself, restated in the prompt.

```ts
mustHave: z.array(z.object({ feature: z.string(), why: z.string() })).max(5),
```

With the cap, the model has to actually choose -- five items forces triage
in a way "be selective" never does. The same trick with a *floor* instead of
a cap on `explicitlyNot` (minimum 3) had the opposite, equally useful effect:
it forced the model to name real things it was cutting, instead of skipping
the field or writing one throwaway line.

**Why this way:** a schema constraint is a stopping condition a language
model can't argue its way around. Prose instructions are negotiable; a Zod
`.max()` is not. The model either produces a JSON array of length ≤5 or the
whole response fails validation and gets rejected -- there's no middle
ground where it lists eight things "just to be thorough."

**What it costs:** nothing, really -- this is one of the rare free lunches.
The schema was already required for validation; making it *tighter* cost no
extra code and improved the actual content.

What's the best output constraint you've found that wasn't a prompt change?

#buildinpublic #nucleus2 #llm

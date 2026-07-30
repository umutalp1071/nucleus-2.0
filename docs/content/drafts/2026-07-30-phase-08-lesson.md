# I don't let the AI write HTML

**Publish date:** 2026-08-14

The landing page feature could have been one prompt: "write me a landing page." I didn't build it that way, and the reason is the whole lesson.

**What I hit:** Nucleus needed to generate a real, publishable landing page from a venture's plan -- headline, benefits, FAQ, a CTA, the works.

**What I tried first:** the tempting version is a single call that returns raw HTML. It's less code, and it "just works" in a demo.

**What worked:** the model returns structured copy with hard length caps, nothing else. A hand-written template is the only thing that ever touches HTML.

```ts
const LandingSchema = z.object({
  headline: z.string().max(70),
  subhead: z.string().max(160),
  benefits: z.array(z.object({
    title: z.string().max(40), body: z.string(),
  })).length(3),
  cta: z.object({ label: z.string().max(25), subtext: z.string() }),
  // ...faq, seo
});
```

**Why this way:** a string of HTML is not something zod can validate -- you can check that JSON matches a shape, not that markup is safe, accessible, or even well-formed. Raw model HTML means unvalidatable output, inconsistent quality, and an XSS hole the moment someone's idea description contains a stray `<script>`. Structured copy into one template means every page ships with the same guarantees: one `h1`, escaped everywhere, zero external requests, `prefers-color-scheme` handled, because the template enforces it rather than the model remembering to.

**What it costs:** every generated page looks identical right now -- same layout, same sections, different words. That's an honest tradeoff for v1, not an oversight: one page that's actually good beats five that are inconsistent.

Where else are you letting a model emit output you can't actually validate before it reaches a user?

#buildinpublic #nucleus2 #llm

---

## Visual

**Type:** Terminal screenshot

Run `npx vitest run tests/template.test.ts` and screenshot the passing output -- specifically the test named "escapes a script payload in the headline instead of executing it," which is the one that proves the XSS path is closed.

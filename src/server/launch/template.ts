import type { Landing } from "@/lib/domain";

// The only place model-derived copy touches HTML. Every interpolated value
// runs through this first -- the copy is model output derived from user
// input, so it is untrusted no differently than a form submission. See
// docs/plan/PHASE-08-launch-stage.md.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderCta(content: Landing, emailCaptureUrl: string | null): string {
  const label = escapeHtml(content.cta.label);
  const subtext = escapeHtml(content.cta.subtext);

  if (emailCaptureUrl) {
    return `<form class="cta-form" action="${escapeHtml(emailCaptureUrl)}" method="POST">
      <label class="sr-only" for="email">Email address</label>
      <input id="email" name="email" type="email" required placeholder="you@email.com" />
      <button type="submit">${label}</button>
    </form>
    <p class="cta-subtext">${subtext}</p>`;
  }

  // No backend of ours -- absent a user-supplied endpoint, the CTA is a
  // mailto link. Never a dead button.
  const mailto = escapeHtml(`mailto:?subject=${encodeURIComponent(label)}`);
  return `<a class="cta-button" href="${mailto}">${label}</a>
    <p class="cta-subtext">${subtext}</p>`;
}

export function renderLandingPage(content: Landing, ventureTitle: string, emailCaptureUrl: string | null): string {
  const title = escapeHtml(ventureTitle);
  const seoTitle = escapeHtml(content.seo.title);
  const seoDescription = escapeHtml(content.seo.description);
  const headline = escapeHtml(content.headline);
  const subhead = escapeHtml(content.subhead);
  const problem = escapeHtml(content.problem);
  const solution = escapeHtml(content.solution);
  const socialProof = escapeHtml(content.socialProofPlaceholder);
  const cta = renderCta(content, emailCaptureUrl);

  const benefits = content.benefits
    .map(
      (b) => `<div class="benefit">
        <h3>${escapeHtml(b.title)}</h3>
        <p>${escapeHtml(b.body)}</p>
      </div>`
    )
    .join("\n");

  const faq = content.faq
    .map(
      (item) => `<div class="faq-item">
        <h3>${escapeHtml(item.q)}</h3>
        <p>${escapeHtml(item.a)}</p>
      </div>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${seoTitle}</title>
<meta name="description" content="${seoDescription}" />
<meta property="og:title" content="${seoTitle}" />
<meta property="og:description" content="${seoDescription}" />
<meta property="og:type" content="website" />
<style>
  :root {
    --bg: #ffffff;
    --fg: #14161a;
    --muted: #5a6270;
    --card: #f4f5f7;
    --border: #d8dce2;
    --accent: #2452e8;
    --accent-fg: #ffffff;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0f1115;
      --fg: #f2f3f5;
      --muted: #a3aab5;
      --card: #191c22;
      --border: #2b2f38;
      --accent: #6b8bff;
      --accent-fg: #0f1115;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--fg);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    line-height: 1.5;
  }
  header, main, footer { max-width: 720px; margin: 0 auto; padding: 1.5rem; }
  header { font-weight: 600; }
  .hero { text-align: center; padding: 3rem 1.5rem; }
  h1 { font-size: clamp(1.75rem, 5vw, 2.5rem); margin: 0 0 0.75rem; }
  .subhead { color: var(--muted); font-size: 1.1rem; max-width: 44rem; margin: 0 auto 1.5rem; }
  .cta-form { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
  .cta-form input {
    padding: 0.75rem 1rem; border: 1px solid var(--border); border-radius: 0.5rem;
    background: var(--bg); color: var(--fg); font-size: 1rem; min-width: 16rem;
  }
  .cta-form button, .cta-button {
    padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none;
    background: var(--accent); color: var(--accent-fg); font-weight: 600;
    font-size: 1rem; cursor: pointer; text-decoration: none; display: inline-block;
  }
  .cta-subtext { color: var(--muted); font-size: 0.875rem; margin-top: 0.75rem; }
  section { padding: 2rem 0; border-top: 1px solid var(--border); }
  .benefits { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); }
  .benefit, .faq-item { background: var(--card); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.25rem; }
  .benefit h3, .faq-item h3 { margin: 0 0 0.5rem; font-size: 1rem; }
  .benefit p, .faq-item p { margin: 0; color: var(--muted); }
  .social-proof { text-align: center; color: var(--muted); font-style: italic; }
  .faq { display: flex; flex-direction: column; gap: 1rem; }
  footer { text-align: center; color: var(--muted); font-size: 0.875rem; }
  a, button { color: inherit; }
  :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .sr-only {
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
  }
  @media (max-width: 480px) {
    .cta-form { flex-direction: column; }
    .cta-form input { min-width: 0; }
  }
</style>
</head>
<body>
<header>${title}</header>
<main>
  <section class="hero">
    <h1>${headline}</h1>
    <p class="subhead">${subhead}</p>
    ${cta}
  </section>
  <section class="problem-solution">
    <p>${problem}</p>
    <p>${solution}</p>
  </section>
  <section class="benefits">
    ${benefits}
  </section>
  <section>
    <p class="social-proof">${socialProof}</p>
  </section>
  <section class="faq">
    ${faq}
  </section>
</main>
<footer>${title} &mdash; built with Nucleus</footer>
</body>
</html>`;
}

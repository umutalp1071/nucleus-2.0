import { describe, expect, it } from "vitest";
import type { Landing } from "@/lib/domain";

const SAFE_LANDING: Landing = {
  headline: "Ship faster with less busywork",
  subhead: "A focused tool for people who hate filing things by hand.",
  problem: "Everything worth saving gets scattered and forgotten.",
  solution: "Capture once, organized automatically.",
  benefits: [
    { title: "Fast capture", body: "Under 10 seconds per item." },
    { title: "Auto-organized", body: "No manual tagging required." },
    { title: "Built for one", body: "Priced for individuals, not teams." },
  ],
  socialProofPlaceholder: "Add logos here.",
  cta: { label: "Get early access", subtext: "No credit card required." },
  faq: [
    { q: "Is this free?", a: "Early access is free." },
    { q: "Is my data private?", a: "Yes." },
    { q: "What stack does it use?", a: "Doesn't matter to you." },
  ],
  seo: { title: "Capture and organize automatically", description: "A focused capture tool that organizes itself." },
};

describe("renderLandingPage", () => {
  it("escapes a script payload in the headline instead of executing it", async () => {
    const { renderLandingPage } = await import("@/server/launch/template");
    const malicious: Landing = { ...SAFE_LANDING, headline: '<script>alert(1)</script>' };

    const html = renderLandingPage(malicious, "Evil Co", null);

    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("escapes a script payload in the venture title", async () => {
    const { renderLandingPage } = await import("@/server/launch/template");

    const html = renderLandingPage(SAFE_LANDING, '<img src=x onerror=alert(1)>', null);

    expect(html).not.toContain("<img src=x onerror=alert(1)>");
  });

  it("contains exactly one h1", async () => {
    const { renderLandingPage } = await import("@/server/launch/template");
    const html = renderLandingPage(SAFE_LANDING, "Venture Co", null);

    expect(html.match(/<h1[ >]/g)?.length).toBe(1);
  });

  it("includes the meta description from seo", async () => {
    const { renderLandingPage } = await import("@/server/launch/template");
    const html = renderLandingPage(SAFE_LANDING, "Venture Co", null);

    expect(html).toContain(`<meta name="description" content="${SAFE_LANDING.seo.description}"`);
    expect(html).toContain(`<title>${SAFE_LANDING.seo.title}</title>`);
  });

  it("makes zero external requests -- no http(s) in src/href attributes", async () => {
    const { renderLandingPage } = await import("@/server/launch/template");
    const html = renderLandingPage(SAFE_LANDING, "Venture Co", null);

    const attrs = Array.from(html.matchAll(/(?:src|href)="([^"]*)"/g)).map((m) => m[1]);
    for (const attr of attrs) {
      expect(attr.startsWith("http://") || attr.startsWith("https://")).toBe(false);
    }
  });

  it("falls back to a mailto CTA when no email capture URL is set", async () => {
    const { renderLandingPage } = await import("@/server/launch/template");
    const html = renderLandingPage(SAFE_LANDING, "Venture Co", null);

    expect(html).toContain('href="mailto:');
    expect(html).not.toContain('<form action="mailto:');
  });

  it("posts the form to the supplied email capture URL when present", async () => {
    const { renderLandingPage } = await import("@/server/launch/template");
    const html = renderLandingPage(SAFE_LANDING, "Venture Co", "https://formspree.io/f/abc123");

    expect(html).toContain('action="https://formspree.io/f/abc123"');
  });

  it("supports prefers-color-scheme for dark mode", async () => {
    const { renderLandingPage } = await import("@/server/launch/template");
    const html = renderLandingPage(SAFE_LANDING, "Venture Co", null);

    expect(html).toContain("prefers-color-scheme: dark");
  });
});

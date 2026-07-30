import type { Landing } from "@/lib/domain";

export function LandingArtifact({ landing }: { landing: Landing }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs text-muted-foreground">Headline</p>
        <p className="text-lg font-semibold">{landing.headline}</p>
        <p className="mt-1 text-sm text-muted-foreground">{landing.subhead}</p>
      </div>

      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
        {landing.benefits.map((b, i) => (
          <div key={i} className="rounded-md border border-border p-2">
            <p className="font-medium">{b.title}</p>
            <p className="text-xs text-muted-foreground">{b.body}</p>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-primary/40 p-2 text-sm">
        <p className="text-xs text-muted-foreground">Call to action</p>
        <p className="font-medium">{landing.cta.label}</p>
        <p className="text-xs text-muted-foreground">{landing.cta.subtext}</p>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-xs text-muted-foreground">FAQ ({landing.faq.length})</summary>
        <ul className="mt-2 flex flex-col gap-2">
          {landing.faq.map((f, i) => (
            <li key={i}>
              <p className="font-medium">{f.q}</p>
              <p className="text-xs text-muted-foreground">{f.a}</p>
            </li>
          ))}
        </ul>
      </details>

      <p className="text-xs text-muted-foreground">SEO title: {landing.seo.title}</p>
    </div>
  );
}

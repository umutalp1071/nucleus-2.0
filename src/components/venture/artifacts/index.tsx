import type { Artifact, Verdict, Competitors, Plan, MvpScope } from "@/lib/domain";
import { ValidationArtifact } from "./ValidationArtifact";
import { CompetitorsArtifact } from "./CompetitorsArtifact";
import { PlanArtifact } from "./PlanArtifact";
import { MvpScopeArtifact } from "./MvpScopeArtifact";
import { RegenerateControl } from "./RegenerateControl";

const REGENERATABLE = new Set<Artifact["kind"]>(["plan", "mvp_scope"]);

// Adding a new artifact kind means adding one file and one case here --
// never editing the renderers that already exist.
export function ArtifactRenderer({ artifact }: { artifact: Artifact }) {
  return (
    <div className="flex flex-col gap-2">
      {artifact.demo && <DemoMarker />}
      <ArtifactBody artifact={artifact} />
      {REGENERATABLE.has(artifact.kind) && (
        <RegenerateControl ventureId={artifact.ventureId} kind={artifact.kind as "plan" | "mvp_scope"} />
      )}
    </div>
  );
}

// Must never be mistaken for a real analysis -- every artifact generated
// with no AI key configured carries this, persistently, not just a
// dismissible banner elsewhere on the page.
function DemoMarker() {
  return (
    <span className="self-start rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
      Demo result -- add an OpenRouter key in Settings for real analysis
    </span>
  );
}

function ArtifactBody({ artifact }: { artifact: Artifact }) {
  switch (artifact.kind) {
    case "validation":
      return <ValidationArtifact verdict={artifact.content as Verdict} />;
    case "competitors":
      return <CompetitorsArtifact competitors={artifact.content as Competitors} />;
    case "plan":
      return <PlanArtifact plan={artifact.content as Plan} />;
    case "mvp_scope":
      return <MvpScopeArtifact scope={artifact.content as MvpScope} />;
    default:
      return <UnknownArtifact artifact={artifact} />;
  }
}

// Never throw on an unexpected shape -- a renderer crashing takes the whole
// workspace page down with it. Fall back to a readable definition list.
function UnknownArtifact({ artifact }: { artifact: Artifact }) {
  const entries =
    typeof artifact.content === "object" && artifact.content !== null
      ? Object.entries(artifact.content as Record<string, unknown>)
      : [];
  return (
    <div className="rounded-md border border-border p-3 text-sm">
      <p className="font-medium capitalize">{artifact.kind.replace(/_/g, " ")}</p>
      <dl className="mt-2 flex flex-col gap-1">
        {entries.map(([key, value]) => (
          <div key={key} className="flex justify-between gap-2">
            <dt className="text-muted-foreground">{key}</dt>
            <dd className="text-right">{typeof value === "string" ? value : JSON.stringify(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

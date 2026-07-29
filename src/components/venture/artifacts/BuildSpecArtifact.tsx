import type { BuildSpec } from "@/lib/domain";
import type { BuildSpecContext } from "@/lib/build-spec-export";
import { CopyForControl } from "./CopyForControl";

export function BuildSpecArtifact({ spec, ctx }: { spec: BuildSpec; ctx: BuildSpecContext }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">{spec.summary}</p>

      <div className="text-sm">
        <p className="mb-1 text-xs text-muted-foreground">User stories</p>
        <ul className="flex flex-col gap-2">
          {spec.userStories.map((s, i) => (
            <li key={i} className="rounded-md border border-border p-2">
              <p>
                As <span className="font-medium">{s.as}</span>, I want {s.iWant}, so that {s.soThat}.
              </p>
              <ul className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground">
                {s.acceptance.map((a, j) => (
                  <li key={j}>&bull; {a}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-md border border-border p-2">
          <p className="mb-1 text-xs text-muted-foreground">Data model</p>
          <ul className="flex flex-col gap-1">
            {spec.dataModel.map((e, i) => (
              <li key={i}>
                <span className="font-medium">{e.entity}</span>{" "}
                <span className="text-xs text-muted-foreground">{e.fields.join(", ")}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-md border border-border p-2">
          <p className="mb-1 text-xs text-muted-foreground">Screens</p>
          <ul className="flex flex-col gap-1">
            {spec.screens.map((s, i) => (
              <li key={i}>
                <span className="font-medium">{s.name}</span>{" "}
                <span className="text-xs text-muted-foreground">&mdash; {s.purpose}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm">
        <p className="mb-1 font-medium">Out of scope</p>
        <ul className="flex flex-col gap-1">
          {spec.outOfScope.map((item, i) => (
            <li key={i} className="text-muted-foreground">
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-md border border-primary/40 p-2 text-sm">
        <p className="text-xs text-muted-foreground">First commit</p>
        <p className="font-medium">{spec.firstCommit}</p>
      </div>

      <CopyForControl spec={spec} ctx={ctx} />
    </div>
  );
}

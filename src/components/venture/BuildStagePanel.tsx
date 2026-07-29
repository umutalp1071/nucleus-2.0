"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, ProgressBar } from "@/components/dashboard/ui";
import type { BuildTask } from "@/lib/domain";

function groupByMilestone(tasks: BuildTask[]): Array<{ milestone: string; tasks: BuildTask[] }> {
  const order: string[] = [];
  const byMilestone = new Map<string, BuildTask[]>();
  for (const t of tasks) {
    if (!byMilestone.has(t.milestone)) {
      byMilestone.set(t.milestone, []);
      order.push(t.milestone);
    }
    byMilestone.get(t.milestone)!.push(t);
  }
  return order.map((milestone) => ({ milestone, tasks: byMilestone.get(milestone)! }));
}

export function BuildStagePanel({
  ventureId,
  stage,
  tasks,
  buildUrl,
  hasBuildSpec,
}: {
  ventureId: string;
  stage: string;
  tasks: BuildTask[];
  buildUrl: string | null;
  hasBuildSpec: boolean;
}) {
  const router = useRouter();
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [urlValue, setUrlValue] = useState(buildUrl ?? "");
  const [urlDirty, setUrlDirty] = useState(false);
  const [specBusy, setSpecBusy] = useState(false);
  const [specError, setSpecError] = useState<string | null>(null);
  const [launchBusy, setLaunchBusy] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const doneCount = tasks.filter((t) => t.done).length;
  const progress = tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100);
  const nextTask = tasks.find((t) => !t.done);
  const groups = groupByMilestone(tasks);

  async function toggle(task: BuildTask) {
    setBusyTaskId(task.id);
    await fetch(`/api/ventures/${ventureId}/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !task.done }),
    });
    setBusyTaskId(null);
    router.refresh();
  }

  async function saveBuildUrl() {
    await fetch(`/api/ventures/${ventureId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buildUrl: urlValue.trim() || null }),
    });
    setUrlDirty(false);
    router.refresh();
  }

  async function generateSpec() {
    setSpecBusy(true);
    setSpecError(null);
    const res = await fetch(`/api/ventures/${ventureId}/build-spec`, { method: "POST" });
    setSpecBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setSpecError(body.error ?? "Couldn't generate the spec. Try again.");
      return;
    }
    router.refresh();
  }

  async function advanceToLaunch(skipRemaining: boolean) {
    setLaunchBusy(true);
    setLaunchError(null);
    const res = await fetch(`/api/ventures/${ventureId}/advance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: "launched", skipRemaining }),
    });
    setLaunchBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (body.reason === "tasks_incomplete") {
        if (window.confirm(`${body.error} Mark this venture as launched anyway?`)) {
          await advanceToLaunch(true);
        }
        return;
      }
      setLaunchError(body.error ?? "Couldn't launch. Try again.");
      return;
    }
    router.refresh();
  }

  if (stage !== "building") return null;

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <div className="mb-1 flex items-baseline justify-between text-xs text-muted-foreground">
          <span>Build progress</span>
          <span>
            {doneCount}/{tasks.length} tasks
          </span>
        </div>
        <ProgressBar value={progress} />
        <p className="mt-2 text-sm">
          {nextTask ? (
            <>
              Up next: <span className="font-medium">{nextTask.title}</span>
            </>
          ) : (
            "All tasks done -- ready to launch."
          )}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {groups.map(({ milestone, tasks: groupTasks }) => (
          <div key={milestone} className="rounded-md border border-border p-2">
            <p className="mb-1 text-xs font-medium text-muted-foreground">{milestone}</p>
            <ul className="flex flex-col gap-1">
              {groupTasks.map((t) => (
                <li key={t.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={t.done}
                    disabled={busyTaskId === t.id}
                    onChange={() => toggle(t)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span className={t.done ? "text-muted-foreground line-through" : ""}>{t.title}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Where is this being built?</label>
        <div className="flex gap-2">
          <input
            value={urlValue}
            onChange={(e) => {
              setUrlValue(e.target.value);
              setUrlDirty(true);
            }}
            placeholder="Repo URL, Lovable project, or a folder path"
            className="w-full rounded-md border border-border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={saveBuildUrl}
            disabled={!urlDirty}
            className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <button
          onClick={generateSpec}
          disabled={specBusy}
          className="self-start rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        >
          {specBusy ? "Generating..." : hasBuildSpec ? "Regenerate build spec" : "Generate build spec"}
        </button>
        {specError && <p className="text-xs text-destructive">{specError}</p>}
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <button
          onClick={() => advanceToLaunch(false)}
          disabled={launchBusy}
          className="self-start rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {launchBusy ? "Launching..." : "Advance to Launch"}
        </button>
        {launchError && <p className="text-xs text-destructive">{launchError}</p>}
      </div>
    </Card>
  );
}

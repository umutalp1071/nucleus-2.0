"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/dashboard/ui";
import type { Calendar, CalendarPost, Prediction, Observation, WeeklyReview } from "@/lib/domain";

interface PostRecord extends CalendarPost {
  draft: string;
}

// ponytail: a hand-rolled single-series SVG line, same pattern as
// src/components/settings/Sparkline.tsx -- one metric needs no legend, and
// <title> gives a free hover tooltip. Upgrade only if a metric needs more
// than a single series.
function MetricChart({ metric, points }: { metric: string; points: Observation[] }) {
  const sorted = [...points].sort((a, b) => a.observedAt.localeCompare(b.observedAt));
  const width = 280;
  const height = 56;
  const values = sorted.map((p) => p.value ?? 0);
  const max = Math.max(0.0001, ...values);

  const coords = sorted.map((p, i) => {
    const x = sorted.length > 1 ? (i / (sorted.length - 1)) * width : width / 2;
    const y = height - ((p.value ?? 0) / max) * (height - 8) - 4;
    return { x, y, ...p };
  });
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");

  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">{metric}</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full text-primary" role="img" aria-label={`${metric} over time`}>
        <line x1={0} y1={height - 4} x2={width} y2={height - 4} stroke="currentColor" strokeOpacity={0.15} strokeWidth={1} />
        <path d={path} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c) => (
          <circle key={c.id} cx={c.x} cy={c.y} r={2.5} fill="currentColor">
            <title>{`${c.observedAt}: ${c.value ?? "-"}`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
}

export function GrowthPanel({
  ventureId,
  stage,
  calendar,
  posts,
  predictions,
  observations,
  killCriteria,
  weeklyReview,
}: {
  ventureId: string;
  stage: string;
  calendar: Calendar | null;
  posts: PostRecord[];
  predictions: Prediction[];
  observations: Observation[];
  killCriteria: string | null;
  weeklyReview: WeeklyReview | null;
}) {
  const router = useRouter();
  const [calendarBusy, setCalendarBusy] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [busyDay, setBusyDay] = useState<number | null>(null);
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [growBusy, setGrowBusy] = useState(false);
  const [resolveBusy, setResolveBusy] = useState<string | null>(null);
  const [observationsByPrediction, setObservationsByPrediction] = useState<Record<string, string>>({});
  const [metric, setMetric] = useState("");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [obsBusy, setObsBusy] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  if (stage !== "launched" && stage !== "growing") return null;

  const postsByDay = new Map(posts.map((p) => [p.day, p]));
  const openPredictions = predictions.filter((p) => p.status === "open");
  const metrics = Array.from(new Set(observations.map((o) => o.metric)));

  async function generateCalendar() {
    setCalendarBusy(true);
    setCalendarError(null);
    const res = await fetch(`/api/ventures/${ventureId}/content-calendar`, { method: "POST" });
    setCalendarBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setCalendarError(body.error ?? "Couldn't write the content calendar. Try again.");
      return;
    }
    router.refresh();
  }

  async function generatePost(day: number) {
    setBusyDay(day);
    const res = await fetch(`/api/ventures/${ventureId}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day }),
    });
    setBusyDay(null);
    if (res.ok) {
      setOpenDay(day);
      router.refresh();
    }
  }

  async function resolvePrediction(predictionId: string, observationId: string) {
    setResolveBusy(predictionId);
    await fetch(`/api/ventures/${ventureId}/predictions/${predictionId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ observationId }),
    });
    setResolveBusy(null);
    router.refresh();
  }

  async function submitObservation() {
    if (!metric.trim() || value === "") return;
    setObsBusy(true);
    await fetch(`/api/ventures/${ventureId}/observations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metric: metric.trim(),
        value: Number(value),
        note: note.trim() || null,
        observedAt: new Date().toISOString().slice(0, 10),
      }),
    });
    setObsBusy(false);
    setMetric("");
    setValue("");
    setNote("");
    router.refresh();
  }

  async function runWeeklyReview() {
    setReviewBusy(true);
    setReviewError(null);
    const res = await fetch(`/api/ventures/${ventureId}/weekly-review`, { method: "POST" });
    setReviewBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setReviewError(body.error ?? "Couldn't run the review. Try again.");
      return;
    }
    router.refresh();
  }

  async function advanceToGrowing() {
    setGrowBusy(true);
    await fetch(`/api/ventures/${ventureId}/advance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: "growing" }),
    });
    setGrowBusy(false);
    router.refresh();
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Growth</h2>
        {stage === "launched" && (
          <button
            onClick={advanceToGrowing}
            disabled={growBusy}
            className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {growBusy ? "Moving..." : "Advance to Growth"}
          </button>
        )}
      </div>

      {!calendar ? (
        <div className="flex flex-col gap-2">
          <button
            onClick={generateCalendar}
            disabled={calendarBusy}
            className="self-start rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            {calendarBusy ? "Writing..." : "Generate content calendar"}
          </button>
          {calendarError && <p className="text-xs text-destructive">{calendarError}</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">
            Posts are generated one at a time, on demand -- never all 12 up front.
          </p>
          <ul className="flex flex-col gap-1">
            {[...calendar.posts]
              .sort((a, b) => a.day - b.day)
              .map((p) => {
                const generated = postsByDay.get(p.day);
                const busy = busyDay === p.day;
                const open = openDay === p.day;
                return (
                  <li key={p.day} className="rounded-md border border-border p-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs text-muted-foreground">
                          Day {p.day} &middot; {p.channel}
                        </p>
                        <p className="truncate font-medium">&ldquo;{p.hook}&rdquo;</p>
                      </div>
                      {generated ? (
                        <button
                          onClick={() => setOpenDay(open ? null : p.day)}
                          className="shrink-0 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
                        >
                          {open ? "Hide" : "View draft"}
                        </button>
                      ) : (
                        <button
                          onClick={() => generatePost(p.day)}
                          disabled={busy}
                          className="shrink-0 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                        >
                          {busy ? "Writing..." : "Generate"}
                        </button>
                      )}
                    </div>
                    {open && generated && (
                      <p className="mt-2 whitespace-pre-wrap rounded-md bg-secondary/40 p-2 text-xs">{generated.draft}</p>
                    )}
                  </li>
                );
              })}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">Open predictions</p>
        {openPredictions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open predictions yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {openPredictions.map((pred) => {
              const matches = observations.filter((o) => o.metric === pred.metric);
              return (
                <li key={pred.id} className="rounded-md border border-border p-2 text-sm">
                  <p className="font-medium">{pred.claim}</p>
                  <p className="text-xs text-muted-foreground">Due {pred.resolveBy}</p>
                  {matches.length > 0 ? (
                    <div className="mt-2 flex items-center gap-2">
                      <select
                        value={observationsByPrediction[pred.id] ?? matches[0].id}
                        onChange={(e) => setObservationsByPrediction((s) => ({ ...s, [pred.id]: e.target.value }))}
                        className="rounded-md border border-border bg-background p-1 text-xs"
                      >
                        {matches.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.observedAt}: {o.value ?? "-"}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => resolvePrediction(pred.id, observationsByPrediction[pred.id] ?? matches[0].id)}
                        disabled={resolveBusy === pred.id}
                        className="rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                      >
                        {resolveBusy === pred.id ? "Resolving..." : "Resolve"}
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      No entry for &ldquo;{pred.metric}&rdquo; yet -- add one below to resolve this.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">Weekly manual entry</p>
        <div className="flex flex-wrap gap-2">
          <input
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            placeholder="Metric (e.g. Weekly active users)"
            className="min-w-[10rem] flex-1 rounded-md border border-border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            type="number"
            placeholder="Value"
            className="w-24 rounded-md border border-border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="min-w-[10rem] flex-1 rounded-md border border-border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={submitObservation}
            disabled={obsBusy || !metric.trim() || value === ""}
            className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            {obsBusy ? "Saving..." : "Add"}
          </button>
        </div>
        {metrics.length > 0 && (
          <div className="mt-2 flex flex-col gap-3">
            {metrics.map((m) => (
              <MetricChart key={m} metric={m} points={observations.filter((o) => o.metric === m)} />
            ))}
          </div>
        )}
      </div>

      {killCriteria && (
        <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm">
          <p className="mb-1 font-medium">Kill criteria, against real numbers</p>
          <p className="text-muted-foreground">{killCriteria}</p>
          {observations.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
              {metrics.map((m) => {
                const latest = observations.find((o) => o.metric === m);
                return (
                  <li key={m}>
                    {m}: latest value {latest?.value ?? "-"} ({latest?.observedAt})
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Weekly review</p>
          <button
            onClick={runWeeklyReview}
            disabled={reviewBusy}
            className="rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            {reviewBusy ? "Reviewing..." : weeklyReview ? "Run again" : "Run weekly review"}
          </button>
        </div>
        {reviewError && <p className="text-xs text-destructive">{reviewError}</p>}
        {weeklyReview && (
          <div className="rounded-md border border-border p-2 text-sm">
            <p>
              <span className="text-xs text-muted-foreground">What moved: </span>
              {weeklyReview.whatMoved}
            </p>
            <p className="mt-1">
              <span className="text-xs text-muted-foreground">What didn&apos;t: </span>
              {weeklyReview.whatDidnt}
            </p>
            <p className="mt-1">
              <span className="text-xs text-muted-foreground">Recommended: </span>
              {weeklyReview.recommendedAction}
            </p>
            <p className="mt-1">
              <span className="text-xs text-muted-foreground">Kill criteria check: </span>
              {weeklyReview.killCriteriaCheck}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

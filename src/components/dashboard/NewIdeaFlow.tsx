"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import type { Verdict, Competitors } from "@/lib/domain";

type Step = "closed" | "input" | "analyzing" | "result" | "failed";

interface Failure {
  reason: "budget_exceeded" | "invalid_output" | "provider_error" | "network_error";
  message: string;
}

function titleFromIdea(idea: string): string {
  const oneLine = idea.trim().split("\n")[0];
  return oneLine.length > 60 ? `${oneLine.slice(0, 57)}...` : oneLine;
}

export function NewIdeaFlow({
  onChanged,
  onContinue,
  onKilled,
  onSaved,
}: {
  onChanged?: () => void;
  onContinue?: () => void;
  onKilled?: () => void;
  onSaved?: () => void;
}) {
  const [step, setStep] = useState<Step>("closed");
  const [idea, setIdea] = useState("");
  const [ventureId, setVentureId] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [competitors, setCompetitors] = useState<Competitors | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);

  function reset() {
    setStep("closed");
    setIdea("");
    setVentureId(null);
    setVerdict(null);
    setCompetitors(null);
    setFailure(null);
  }

  async function runAdvance(id: string) {
    const res = await fetch(`/api/ventures/${id}/advance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      setFailure({
        reason: body.reason ?? "provider_error",
        message: body.error ?? "Something went wrong. Try again.",
      });
      setStep("failed");
      return;
    }

    setVerdict(body.verdict);
    setCompetitors(body.competitors ?? null);
    setStep("result");
    onChanged?.();
  }

  async function analyze() {
    setStep("analyzing");
    setFailure(null);
    try {
      const createRes = await fetch("/api/ventures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleFromIdea(idea), description: idea }),
      });
      if (!createRes.ok) {
        setFailure({ reason: "network_error", message: "Couldn't save your idea. Try again." });
        setStep("failed");
        return;
      }
      const venture = await createRes.json();
      setVentureId(venture.id);
      await runAdvance(venture.id);
    } catch {
      setFailure({ reason: "network_error", message: "Couldn't reach Nucleus. Check your connection and try again." });
      setStep("failed");
    }
  }

  async function retry() {
    if (!ventureId) {
      await analyze();
      return;
    }
    setStep("analyzing");
    setFailure(null);
    try {
      await runAdvance(ventureId);
    } catch {
      setFailure({ reason: "network_error", message: "Couldn't reach Nucleus. Check your connection and try again." });
      setStep("failed");
    }
  }

  async function handleKill() {
    if (!ventureId) return;
    await fetch(`/api/ventures/${ventureId}/advance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: "killed" }),
    });
    onChanged?.();
    onKilled?.();
    reset();
  }

  function handleSave() {
    onSaved?.();
    reset();
  }

  function handleContinue() {
    onContinue?.();
    reset();
  }

  return (
    <>
      <button
        onClick={() => setStep("input")}
        className="w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        + New Idea
      </button>
      {step !== "closed" && (
        <Modal onClose={reset}>
          {step === "input" && (
            <IdeaInputStep idea={idea} onChange={setIdea} onAnalyze={analyze} />
          )}
          {step === "analyzing" && <AnalyzingStep />}
          {step === "result" && verdict && (
            <AnalysisResultStep
              verdict={verdict}
              competitors={competitors}
              onKill={handleKill}
              onSave={handleSave}
              onContinue={handleContinue}
            />
          )}
          {step === "failed" && failure && (
            <FailedStep failure={failure} onRetry={retry} onClose={reset} />
          )}
        </Modal>
      )}
    </>
  );
}

function IdeaInputStep({
  idea,
  onChange,
  onAnalyze,
}: {
  idea: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Describe your idea</h2>
      <textarea
        autoFocus
        value={idea}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. An AI tutor that helps people practice a new language through daily conversations..."
        rows={5}
        className="w-full resize-none rounded-md border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        onClick={onAnalyze}
        disabled={idea.trim().length === 0}
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Analyze
      </button>
    </div>
  );
}

function AnalyzingStep() {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      <p className="text-sm text-muted-foreground">Analyzing your idea...</p>
    </div>
  );
}

const severityColor: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-foreground",
  high: "text-destructive",
};

const recommendationLabel: Record<Verdict["recommendation"], string> = {
  build: "BUILD",
  refine: "REFINE",
  kill: "KILL",
};

function AnalysisResultStep({
  verdict,
  competitors,
  onKill,
  onSave,
  onContinue,
}: {
  verdict: Verdict;
  competitors: Competitors | null;
  onKill: () => void;
  onSave: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold">{verdict.headline}</h2>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
            verdict.recommendation === "kill"
              ? "bg-destructive/10 text-destructive"
              : verdict.recommendation === "build"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          {verdict.score}/100 &middot; {recommendationLabel[verdict.recommendation]}
        </span>
      </div>

      {/* whyNot rendered above the fold, on purpose -- honesty is the product's promise. */}
      <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm">
        <p className="font-medium">Why not?</p>
        <p className="mt-1 text-muted-foreground">{verdict.whyNot}</p>
      </div>

      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-md border border-border p-2">
          <p className="text-xs text-muted-foreground">Market size</p>
          <p className="font-medium">{verdict.marketSize.estimate}</p>
        </div>
        <div className="rounded-md border border-border p-2">
          <p className="text-xs text-muted-foreground">Audience pain level</p>
          <p className="font-medium capitalize">{verdict.audience.painLevel}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-sm">
        <p className="text-xs text-muted-foreground">Risks</p>
        {verdict.risks.map((r, i) => (
          <div key={i} className="flex justify-between gap-2 rounded-md border border-border p-2">
            <span>{r.risk}</span>
            <span className={`shrink-0 text-xs font-medium uppercase ${severityColor[r.severity]}`}>
              {r.severity}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-border p-2 text-sm">
        <p className="text-xs text-muted-foreground">Cheapest test before building anything</p>
        <p className="font-medium">{verdict.cheapestTest}</p>
      </div>

      {competitors && (
        <details className="rounded-md border border-border p-2 text-sm">
          <summary className="cursor-pointer font-medium">
            Competitors ({competitors.competitors.length}) &middot; {competitors.crowdedness} crowdedness
          </summary>
          <p className="mt-2 text-muted-foreground">{competitors.differentiationVerdict}</p>
          <ul className="mt-2 flex flex-col gap-2">
            {competitors.competitors.map((c) => (
              <li key={c.name} className="rounded-md border border-border p-2">
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.whatTheyDo}</p>
                <p className="mt-1 text-xs">
                  <span className="text-muted-foreground">Weakness: </span>
                  {c.weakness}
                </p>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="flex gap-2">
        <button
          onClick={onKill}
          className="flex-1 rounded-md border border-destructive/40 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10"
        >
          Kill it
        </button>
        <button
          onClick={onSave}
          className="flex-1 rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-accent hover:text-accent-foreground"
        >
          Save for later
        </button>
        <button
          onClick={onContinue}
          className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Keep going
        </button>
      </div>
    </div>
  );
}

const failureCopy: Record<Failure["reason"], { title: string; canRetry: boolean }> = {
  budget_exceeded: { title: "Spending limit reached", canRetry: false },
  invalid_output: { title: "Couldn't read that response", canRetry: true },
  provider_error: { title: "AI service unavailable", canRetry: true },
  network_error: { title: "Connection problem", canRetry: true },
};

function FailedStep({
  failure,
  onRetry,
  onClose,
}: {
  failure: Failure;
  onRetry: () => void;
  onClose: () => void;
}) {
  const copy = failureCopy[failure.reason];
  return (
    <div className="flex flex-col gap-3 py-4 text-center">
      <h2 className="text-lg font-semibold">{copy.title}</h2>
      <p className="text-sm text-muted-foreground">{failure.message}</p>
      <div className="mt-2 flex justify-center gap-2">
        <button
          onClick={onClose}
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-accent hover:text-accent-foreground"
        >
          Close
        </button>
        {copy.canRetry && (
          <button
            onClick={onRetry}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

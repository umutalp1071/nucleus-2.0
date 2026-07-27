"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { generateMockAnalysis, type IdeaAnalysis } from "@/lib/mock-data";

type Step = "closed" | "input" | "analyzing" | "result";

export function NewIdeaFlow({
  onSaveIdea,
  onContinue,
}: {
  onSaveIdea?: (idea: string, analysis: IdeaAnalysis) => void;
  onContinue?: () => void;
}) {
  const [step, setStep] = useState<Step>("closed");
  const [idea, setIdea] = useState("");
  const [analysis, setAnalysis] = useState<IdeaAnalysis | null>(null);

  function reset() {
    setStep("closed");
    setIdea("");
    setAnalysis(null);
  }

  function analyze() {
    setStep("analyzing");
    setTimeout(() => {
      setAnalysis(generateMockAnalysis(idea));
      setStep("result");
    }, 900);
  }

  function handleSave() {
    if (analysis) onSaveIdea?.(idea, analysis);
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
          {step === "result" && analysis && (
            <AnalysisResultStep
              analysis={analysis}
              onContinue={handleContinue}
              onSave={handleSave}
            />
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

function AnalysisResultStep({
  analysis,
  onContinue,
  onSave,
}: {
  analysis: IdeaAnalysis;
  onContinue: () => void;
  onSave: () => void;
}) {
  const rows: [string, string][] = [
    ["Market Size", analysis.marketSize],
    ["Competition", analysis.competition],
    ["Estimated Cost", analysis.estimatedCost],
    ["Revenue Opportunity", analysis.revenueOpportunity],
  ];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Analysis</h2>
      <div className="flex flex-col gap-2 text-sm">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between gap-4 rounded-md border border-border p-2"
          >
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right font-medium">{value}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSave}
          className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-accent hover:text-accent-foreground"
        >
          Save
        </button>
        <button
          onClick={onContinue}
          className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

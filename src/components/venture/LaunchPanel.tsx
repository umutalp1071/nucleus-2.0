"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/dashboard/ui";

export function LaunchPanel({
  ventureId,
  stage,
  hasLandingPage,
  emailCaptureUrl,
  launchUrl,
  firstTenUsers,
}: {
  ventureId: string;
  stage: string;
  hasLandingPage: boolean;
  emailCaptureUrl: string | null;
  launchUrl: string | null;
  firstTenUsers: string | null;
}) {
  const router = useRouter();
  const [copyBusy, setCopyBusy] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [urlValue, setUrlValue] = useState(emailCaptureUrl ?? "");
  const [urlDirty, setUrlDirty] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [deployBusy, setDeployBusy] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deployResult, setDeployResult] = useState<{ url: string; live: boolean } | null>(null);

  async function generateCopy() {
    setCopyBusy(true);
    setCopyError(null);
    const res = await fetch(`/api/ventures/${ventureId}/landing-page`, { method: "POST" });
    setCopyBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setCopyError(body.error ?? "Couldn't write landing page copy. Try again.");
      return;
    }
    setReviewed(false);
    setDeployResult(null);
    router.refresh();
  }

  async function saveEmailCaptureUrl() {
    await fetch(`/api/ventures/${ventureId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailCaptureUrl: urlValue.trim() || null }),
    });
    setUrlDirty(false);
    router.refresh();
  }

  async function deploy() {
    setDeployBusy(true);
    setDeployError(null);
    const res = await fetch(`/api/ventures/${ventureId}/deploy`, { method: "POST" });
    setDeployBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setDeployError(body.error ?? "Couldn't publish the page. Try again.");
      return;
    }
    const body = await res.json();
    setDeployResult({ url: body.url, live: body.live });
    router.refresh();
  }

  if (stage !== "building" && stage !== "launched") return null;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Launch</h2>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={generateCopy}
          disabled={copyBusy}
          className="self-start rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        >
          {copyBusy ? "Writing..." : hasLandingPage ? "Regenerate landing page copy" : "Write landing page copy"}
        </button>
        {copyError && <p className="text-xs text-destructive">{copyError}</p>}
      </div>

      {hasLandingPage && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">
              Where should the email signup form post? (blank falls back to a mailto link)
            </label>
            <div className="flex gap-2">
              <input
                value={urlValue}
                onChange={(e) => {
                  setUrlValue(e.target.value);
                  setUrlDirty(true);
                }}
                placeholder="https://formspree.io/f/..."
                className="w-full rounded-md border border-border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={saveEmailCaptureUrl}
                disabled={!urlDirty}
                className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">Preview -- this is a one-way door once deployed</p>
            <iframe
              src={`/api/ventures/${ventureId}/preview`}
              sandbox=""
              title="Landing page preview"
              className="h-96 w-full rounded-md border border-border bg-white"
            />
          </div>

          <ul className="flex flex-col gap-1 rounded-md border border-border p-2 text-xs text-muted-foreground">
            <li>{emailCaptureUrl ? "✓" : "○"} CTA destination set</li>
            <li>&#10003; SEO title and description present</li>
            {firstTenUsers && <li>Who you&apos;ll send this to first: {firstTenUsers}</li>}
          </ul>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} />
            I&apos;ve reviewed the preview above
          </label>

          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <button
              onClick={deploy}
              disabled={!reviewed || deployBusy}
              className="self-start rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {deployBusy ? "Publishing..." : launchUrl ? "Redeploy" : "Publish"}
            </button>
            {deployError && <p className="text-xs text-destructive">{deployError}</p>}
            {(deployResult ?? (launchUrl ? { url: launchUrl, live: false } : null)) && (
              <p className="text-xs text-muted-foreground">
                Live at{" "}
                <a
                  href={(deployResult ?? { url: launchUrl! }).url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {(deployResult ?? { url: launchUrl! }).url}
                </a>
              </p>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

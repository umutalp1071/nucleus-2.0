import * as artifactsRepo from "../db/repositories/artifacts";
import * as venturesRepo from "../db/repositories/ventures";
import { recordEvent } from "../events";
import { renderLandingPage } from "../launch/template";
import { resolveDeployTarget, type DeployTarget } from "../deploy";
import type { Venture, Landing } from "@/lib/domain";

export type DeployLandingPageResult =
  | { ok: true; venture: Venture; url: string; live: boolean }
  | { ok: false; reason: "missing_prerequisite" | "deploy_failed"; message: string };

interface Opts {
  baseDir?: string;
  target?: DeployTarget;
}

// Renders the latest landing_page artifact through the template and hands it
// to the deploy target. Deploy failures leave the venture untouched -- a
// half-launched venture is worse than an unlaunched one. See
// docs/plan/PHASE-08-launch-stage.md.
export async function deployLandingPage(venture: Venture, opts?: Opts): Promise<DeployLandingPageResult> {
  const repoOpts = { baseDir: opts?.baseDir };
  const landingArtifact = await artifactsRepo.latestOfKind(venture.id, "landing_page", repoOpts);
  if (!landingArtifact) {
    return {
      ok: false,
      reason: "missing_prerequisite",
      message: "Nucleus needs landing page copy before it can deploy anything. Generate it first.",
    };
  }

  const html = renderLandingPage(landingArtifact.content as Landing, venture.title, venture.emailCaptureUrl);
  const target = opts?.target ?? resolveDeployTarget().target;

  let deployed;
  try {
    deployed = await target.deploy(venture.id, html, repoOpts);
  } catch {
    return {
      ok: false,
      reason: "deploy_failed",
      message: "Nucleus couldn't publish the page just now. Try again in a moment.",
    };
  }

  const updated = await venturesRepo.update(venture.id, { launchUrl: deployed.url }, repoOpts);
  await recordEvent(
    "venture.deployed",
    `"${venture.title}" published${deployed.live ? "" : " (local preview only)"} -- ${deployed.url}`,
    { ventureId: venture.id, baseDir: opts?.baseDir }
  );

  return { ok: true, venture: updated, url: deployed.url, live: deployed.live };
}

import { config } from "../config";
import { writeRawFile } from "../db/store";

// Same mock/real pattern as the AI provider -- selected by the absence of a
// key, so the whole launch flow works with zero accounts. See
// docs/plan/PHASE-08-launch-stage.md.
export interface DeployTarget {
  deploy(ventureId: string, html: string, opts?: { baseDir?: string }): Promise<{ url: string; live: boolean }>;
}

function toFileUrl(absPath: string): string {
  const normalized = absPath.replace(/\\/g, "/");
  const withSlash = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return `file://${withSlash}`;
}

// Fully functional with zero accounts -- this is simultaneously the test
// infrastructure and the zero-setup demo mode. Never delete this.
export const mock: DeployTarget = {
  async deploy(ventureId, html, opts) {
    const written = await writeRawFile(`deploys/${ventureId}/index.html`, html, opts);
    return { url: toFileUrl(written), live: false };
  },
};

// Isolated in this one function -- if Vercel's API shape changes, only this
// adapter is affected; the mock path (and every test) is untouched.
export function makeVercelTarget(token: string): DeployTarget {
  return {
    async deploy(ventureId, html) {
      const res = await fetch("https://api.vercel.com/v13/deployments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: `nucleus-${ventureId}`.slice(0, 52),
          target: "production",
          files: [{ file: "index.html", data: Buffer.from(html).toString("base64"), encoding: "base64" }],
        }),
      });
      if (!res.ok) {
        throw new Error(`deploy_provider_error: ${res.status}`);
      }
      const data = await res.json();
      return { url: `https://${data.url}`, live: true };
    },
  };
}

export function resolveDeployTarget(): { target: DeployTarget; isMock: boolean } {
  if (!config.VERCEL_TOKEN) return { target: mock, isMock: true };
  return { target: makeVercelTarget(config.VERCEL_TOKEN), isMock: false };
}

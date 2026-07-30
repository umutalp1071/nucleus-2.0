import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nucleus-deploy-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("mock deploy target", () => {
  it("writes the HTML to .nucleus/deploys/<ventureId>/index.html and returns a file:// url", async () => {
    const { mock } = await import("@/server/deploy");
    const result = await mock.deploy("venture-1", "<html>hi</html>", { baseDir: tmpDir });

    expect(result.live).toBe(false);
    expect(result.url.startsWith("file://")).toBe(true);

    const written = fs.readFileSync(path.join(tmpDir, "deploys", "venture-1", "index.html"), "utf8");
    expect(written).toBe("<html>hi</html>");
  });

  it("returns an absolute file:// url even when NUCLEUS_DATA_DIR is relative", async () => {
    // Regression: writeRawFile must resolve to an absolute path -- a relative
    // one turned into "file://relative/path" is meaningless to a browser.
    const { mock } = await import("@/server/deploy");
    const relativeBaseDir = path.relative(process.cwd(), tmpDir);

    const result = await mock.deploy("venture-1", "<html>hi</html>", { baseDir: relativeBaseDir });

    expect(path.isAbsolute(result.url.replace("file://", ""))).toBe(true);
  });

  it("overwrites on redeploy", async () => {
    const { mock } = await import("@/server/deploy");
    await mock.deploy("venture-1", "<html>first</html>", { baseDir: tmpDir });
    await mock.deploy("venture-1", "<html>second</html>", { baseDir: tmpDir });

    const written = fs.readFileSync(path.join(tmpDir, "deploys", "venture-1", "index.html"), "utf8");
    expect(written).toBe("<html>second</html>");
  });
});

describe("vercel deploy target", () => {
  it("posts the inline file to the Vercel deployments API and returns the live url", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
      new Response(JSON.stringify({ url: "my-app-abc123.vercel.app" }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { makeVercelTarget } = await import("@/server/deploy");
    const target = makeVercelTarget("fake-token");
    const result = await target.deploy("venture-1", "<html>hi</html>");

    expect(result.live).toBe(true);
    expect(result.url).toBe("https://my-app-abc123.vercel.app");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("api.vercel.com");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer fake-token");
  });

  it("returns a readable failure message on a non-ok response, never the raw provider error", async () => {
    const fetchMock = vi.fn(async () => new Response("nope", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    const { makeVercelTarget } = await import("@/server/deploy");
    const target = makeVercelTarget("fake-token");

    await expect(target.deploy("venture-1", "<html>hi</html>")).rejects.toThrow();
  });
});

describe("resolveDeployTarget", () => {
  it("resolves to the mock target when no VERCEL_TOKEN is configured", async () => {
    vi.resetModules();
    vi.stubEnv("VERCEL_TOKEN", "");
    const { resolveDeployTarget } = await import("@/server/deploy");
    const { isMock } = resolveDeployTarget();
    expect(isMock).toBe(true);
  });
});

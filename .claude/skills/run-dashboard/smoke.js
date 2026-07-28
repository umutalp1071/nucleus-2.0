// Template driver for verifying the Nucleus 2.0 dashboard in a real browser.
// Run from a scratch dir with playwright installed: node smoke.js ./screenshots
// Edit the steps below to match whatever feature you're verifying this session.
const { chromium } = require("playwright");

const SCREENSHOT_DIR = process.argv[2] || "./screenshots";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForSelector("text=Saved Ideas");
  await page.screenshot({ path: `${SCREENSHOT_DIR}/01-dashboard.png` });

  // Open New Idea flow
  await page.click("text=+ New Idea");
  await page.fill(
    "textarea",
    "An AI-powered marketplace that connects local farmers directly with restaurants for same-day produce delivery"
  );
  await page.screenshot({ path: `${SCREENSHOT_DIR}/02-input.png` });
  await page.click('button:has-text("Analyze")');
  await page.waitForSelector("text=Analysis");
  await page.screenshot({ path: `${SCREENSHOT_DIR}/03-analysis.png` });

  // Save
  await page.click('button:has-text("Save")');
  await page.waitForSelector("text=Saved Ideas (1)");
  await page.screenshot({ path: `${SCREENSHOT_DIR}/04-after-save.png` });

  // Reload to confirm persistence
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("text=Saved Ideas (1)");
  await page.screenshot({ path: `${SCREENSHOT_DIR}/05-after-reload.png` });

  // Continue -> toast
  await page.click("text=+ New Idea");
  await page.fill("textarea", "Quick note app");
  await page.click('button:has-text("Analyze")');
  await page.waitForSelector("text=Analysis");
  await page.click('button:has-text("Continue")');
  await page.waitForSelector("text=Taking you to project creation...");
  await page.screenshot({ path: `${SCREENSHOT_DIR}/06-continue-toast.png` });

  await browser.close();

  console.log("ERRORS:", JSON.stringify(errors));
  console.log("SMOKE TEST PASSED");
})().catch((e) => {
  console.error("SMOKE TEST FAILED:", e);
  process.exit(1);
});

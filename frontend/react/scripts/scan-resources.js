const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const BASE_URL = process.env.BASE_URL || "https://dash.edufyuzbekistan.com";
const STORAGE_STATE_PATH = path.join(__dirname, "..", ".auth", "storageState.json");
const REPORTS_DIR = path.join(__dirname, "..", "reports");

function uniq(arr) {
  return Array.from(new Set(arr));
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function collectResourceLinks(page, category) {
  await page.goto(`${BASE_URL}/resources/${category}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);

  const links = await page.$$eval(`a[href^="/resources/${category}/"]`, (els) =>
    els
      .map((a) => a.getAttribute("href") || "")
      .filter(Boolean)
      .map((href) => (href.startsWith("http") ? href : href))
  );

  const full = links
    .filter((h) => /^\/resources\//.test(h))
    .map((h) => `${BASE_URL}${h}`);

  return uniq(full);
}

async function collectLessonsReportsTargets(page, listPath) {
  await page.goto(`${BASE_URL}${listPath}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);

  const count = await page.locator('button:has-text("Continue")').count();
  const targets = [];

  for (let i = 0; i < count; i++) {
    await page.goto(`${BASE_URL}${listPath}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(250);

    const btn = page.locator('button:has-text("Continue")').nth(i);
    await btn.scrollIntoViewIfNeeded();

    await Promise.all([
      page.waitForLoadState("domcontentloaded"),
      btn.click({ timeout: 15000 }),
    ]);

    const url = page.url();
    if (url.startsWith(BASE_URL) && /\/resources\//.test(new URL(url).pathname)) {
      targets.push(url);
    }
  }

  return uniq(targets);
}

async function scanUrl(page, url) {
  const jsErrors = [];
  const consoleErrors = [];
  const responses = [];

  const onPageError = (err) => {
    jsErrors.push(String(err?.message || err || "pageerror").slice(0, 300));
  };

  const onConsole = (msg) => {
    try {
      if (msg.type() === "error") {
        consoleErrors.push(String(msg.text() || "console_error").slice(0, 300));
      }
    } catch {}
  };

  const onResponse = (res) => {
    try {
      const status = res.status();
      if (status >= 400) {
        responses.push({ url: res.url(), status });
      }
    } catch {}
  };

  page.on("pageerror", onPageError);
  page.on("console", onConsole);
  page.on("response", onResponse);

  let mainStatus = null;
  let finalUrl = url;
  let outcome = "ok";

  try {
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    mainStatus = res ? res.status() : null;
    finalUrl = page.url();

    await page.waitForTimeout(700);

    const h1Text = await page
      .locator("h1")
      .first()
      .textContent()
      .catch(() => "");

    if (mainStatus === 404 || /page not found/i.test(String(h1Text || ""))) {
      outcome = "not_found";
    } else if (typeof mainStatus === "number" && mainStatus >= 500) {
      outcome = "server_error";
    } else {
      const serverErrorVisible = await page
        .locator('text=/Server error|Something went wrong/i')
        .first()
        .isVisible()
        .catch(() => false);
      if (serverErrorVisible) outcome = "server_error_ui";
    }

    const pathName = new URL(finalUrl).pathname;
    if (pathName === "/login" || pathName.startsWith("/login/")) {
      outcome = "redirect_login";
    }
  } catch (err) {
    outcome = "navigation_failed";
    jsErrors.push(String(err?.message || err || "navigation_failed").slice(0, 300));
  } finally {
    page.off("pageerror", onPageError);
    page.off("console", onConsole);
    page.off("response", onResponse);
  }

  const badResponses = responses.filter((r) => r.status >= 500 || r.status === 404);

  return {
    url,
    finalUrl,
    mainStatus,
    outcome,
    jsErrors: uniq(jsErrors),
    consoleErrors: uniq(consoleErrors),
    badResponses,
  };
}

async function main() {
  if (!fs.existsSync(STORAGE_STATE_PATH)) {
    process.stderr.write(`Missing ${STORAGE_STATE_PATH}. Run: npm run auth:save\n`);
    process.exitCode = 1;
    return;
  }

  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STORAGE_STATE_PATH });
  const page = await context.newPage();

  const urls = [];
  for (const cat of ["reading", "listening", "writing", "mock"]) {
    const items = await collectResourceLinks(page, cat);
    urls.push(...items);
  }

  const ieltsTargets = await collectLessonsReportsTargets(page, "/resources/lessons-reports");
  const satTargets = await collectLessonsReportsTargets(page, "/resources/sat/lessons-reports");
  urls.push(...ieltsTargets);
  urls.push(...satTargets);

  const targetUrls = uniq(urls);

  const results = [];
  for (const url of targetUrls) {
    const r = await scanUrl(page, url);
    results.push(r);
    process.stdout.write(`${r.outcome.toUpperCase()} ${r.mainStatus ?? ""} ${r.finalUrl}\n`);
  }

  await browser.close();

  const report = {
    baseUrl: BASE_URL,
    scannedAt: new Date().toISOString(),
    total: results.length,
    results,
  };

  const outPath = path.join(REPORTS_DIR, `resources-scan-${nowStamp()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

  const counts = results.reduce((acc, r) => {
    acc[r.outcome] = (acc[r.outcome] || 0) + 1;
    return acc;
  }, {});

  process.stdout.write(`\nSaved report: ${outPath}\n`);
  process.stdout.write(`Summary: ${JSON.stringify(counts)}\n`);
}

main().catch((err) => {
  process.stderr.write(String(err?.stack || err || "error") + "\n");
  process.exitCode = 1;
});

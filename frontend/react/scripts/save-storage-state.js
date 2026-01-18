const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { chromium } = require("playwright");

const BASE_URL = process.env.BASE_URL || "https://dash.edufyuzbekistan.com";
const STORAGE_STATE_PATH = path.join(__dirname, "..", ".auth", "storageState.json");

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  fs.mkdirSync(path.dirname(STORAGE_STATE_PATH), { recursive: true });

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });

  await ask(
    "Login as PREMIUM user in the opened browser, then press Enter here to save session state...\n"
  );

  await context.storageState({ path: STORAGE_STATE_PATH });
  await browser.close();

  process.stdout.write(`Saved storage state to: ${STORAGE_STATE_PATH}\n`);
}

main().catch((err) => {
  process.stderr.write(String(err?.stack || err || "error") + "\n");
  process.exitCode = 1;
});

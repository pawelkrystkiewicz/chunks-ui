/// <reference types="@types/bun" />
/**
 * Runs axe (WCAG 2.2 A and AA rules) over every docs page of the production build, in light and
 * dark mode, and fails on any violation that ALLOWED does not list.
 *
 * Build first (`bun run build --filter=@chunks-ui/docs`); the script starts `next start` itself.
 * Needs Playwright's Chromium (`bunx playwright install chromium`, or the Playwright image in CI).
 *
 * Run: bun run check:a11y
 */
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { type Browser, chromium } from "playwright";

const DOCS_DIR = join(import.meta.dirname, "..");
const PORT = Number(process.env.PORT ?? 3105);
const BASE_URL = `http://localhost:${PORT}`;
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];
const THEMES = ["light", "dark"] as const;
const PARALLEL = 4;

/**
 * The only violations the check accepts. An entry allows one axe rule on the elements matching
 * its selector (or inside them), on every page and in both themes. Keep each one specific, and
 * say why it can't be fixed in this repo's docs content.
 */
const ALLOWED: { rule: string; selector: string; why: string }[] = [
  // Nextra's page chrome and default styling (W27)
  {
    rule: "button-name",
    selector: 'button[id^="headlessui-listbox-button"]',
    why: "Nextra's Copy page menu toggle is an icon-only Headless UI button without a label",
  },
  {
    rule: "link-name",
    selector: 'td > a[href^="#"]:empty',
    why: 'Nextra\'s <TSDoc> props table links each row with an empty <a> that shows "#" from CSS',
  },
  {
    rule: "color-contrast",
    selector: 'pre code span[style*="--shiki-"]',
    why: "Nextra's default Shiki themes: github-light parameters 3.48:1, github-dark comments 4.36:1",
  },
  {
    rule: "color-contrast",
    selector: "a > code.nextra-code",
    why: "Nextra colours inline code in a link with its link colour on its code background, 4.45:1",
  },
  // Pending maintainer decision (TODO W43/W44): remove once decided
  {
    rule: "color-contrast",
    selector: "a.group\\/cta > span:first-child",
    why: 'Landing CTA label ("Read the docs", "Open Create"): white on --l-brand-soft, 2.68:1',
  },
  {
    rule: "color-contrast",
    selector: ".bg-success\\/10.text-success-text",
    why: "success-text on a /10 tint over Nextra's #fafafa (Chip example, kitchen-sink badge), 4.47:1",
  },
  // chunks-ui defects, outside the docs: fix them in packages/ui, then delete the entry
  {
    rule: "color-contrast",
    selector: '[role="grid"] button.opacity-50',
    why: "Calendar outside-month days, text-muted-foreground at opacity-50: 2:1 light, 2.69:1 dark",
  },
];

type Problem = { page: string; theme: string; rule: string; help: string; targets: string[] };

function pages() {
  const routes = [...new Bun.Glob("**/*.mdx").scanSync(join(DOCS_DIR, "content"))].map((file) => {
    const route = file.replace(/\.mdx$/, "").replace(/(^|\/)index$/, "");
    return `/${route}`;
  });
  return routes.sort();
}

async function answers() {
  try {
    return (await fetch(BASE_URL)).ok;
  } catch {
    return false;
  }
}

async function startServer() {
  // A server left on the port would serve an older build
  if (await answers()) throw new Error(`${BASE_URL} is already taken; stop it or set PORT`);
  const server = Bun.spawn(["bun", "x", "next", "start", "-p", String(PORT)], {
    cwd: DOCS_DIR,
    stdout: "ignore",
    stderr: "inherit",
  });
  for (let attempt = 0; attempt < 120; attempt++) {
    if (await answers()) return server;
    await Bun.sleep(500);
  }
  server.kill();
  throw new Error(`next start did not answer on ${BASE_URL}; run the docs build first`);
}

async function audit(browser: Browser, route: string, theme: (typeof THEMES)[number]) {
  const context = await browser.newContext({ colorScheme: theme });
  // Nextra (next-themes) reads the theme from localStorage before it paints
  await context.addInitScript((value) => localStorage.setItem("theme", value), theme);
  const page = await context.newPage();
  // A stylesheet that fails to load would make the colour checks pass on unstyled text
  const failed: string[] = [];
  page.on("response", (response) => {
    if (response.url().startsWith(BASE_URL) && response.status() >= 400) {
      failed.push(`${response.status()} ${response.url()}`);
    }
  });
  try {
    const response = await page.goto(BASE_URL + route, { waitUntil: "networkidle" });
    if (!response?.ok()) throw new Error(`${route} answered ${response?.status()}`);
    const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const problems: Problem[] = [];
    if (failed.length > 0) {
      problems.push({ page: route, theme, rule: "http", help: "Requests failed", targets: failed });
    }
    for (const violation of violations) {
      const allowed = ALLOWED.filter((entry) => entry.rule === violation.id);
      const targets: string[] = [];
      for (const node of violation.nodes) {
        const target = node.target.map(String).join(" ");
        const isAllowed = await page.evaluate(
          ([selector, allowedSelectors]) => {
            const element = document.querySelector(selector);
            return allowedSelectors.some((allowedSelector) => element?.closest(allowedSelector));
          },
          [target, allowed.map((entry) => entry.selector)] as const,
        );
        if (!isAllowed) targets.push(`${target}\n      ${node.html.slice(0, 160)}`);
      }
      if (targets.length > 0) {
        problems.push({ page: route, theme, rule: violation.id, help: violation.help, targets });
      }
    }
    return problems;
  } finally {
    await context.close();
  }
}

const routes = pages();
const server = await startServer();
const browser = await chromium.launch();
const problems: Problem[] = [];
try {
  const queue = routes.flatMap((route) => THEMES.map((theme) => ({ route, theme })));
  const workers = Array.from({ length: PARALLEL }, async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      problems.push(...(await audit(browser, job.route, job.theme)));
    }
  });
  await Promise.all(workers);
} finally {
  await browser.close();
  server.kill();
}

for (const { page, theme, rule, help, targets } of problems) {
  console.error(`${page} (${theme}) ${rule}: ${help}`);
  for (const target of targets) console.error(`    ${target}`);
}
console.log(
  `axe checked ${routes.length} pages in ${THEMES.length} themes: ${problems.length} violations.`,
);
process.exit(problems.length > 0 ? 1 : 0);

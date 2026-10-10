/// <reference types="@types/bun" />
/**
 * Runs axe (WCAG 2.2 A and AA rules) over every docs page of the production build, in light and
 * dark mode. Fails on any violation that ALLOWED does not list, and on any ALLOWED entry that
 * matched nothing.
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

export type Theme = (typeof THEMES)[number];

/**
 * An accepted violation: one axe rule on the elements matching `selector` (or inside them), on
 * `pages` and in `themes` (every page and theme when left out). Keep entries specific, scope them
 * to where they occur, and link the issue that removes them. An entry that matches nothing in a
 * run fails the check, so fixed ones can't linger.
 */
export type Allowed = {
  rule: string;
  selector: string;
  why: string;
  pages?: string[];
  themes?: Theme[];
};

const ALLOWED: Allowed[] = [
  // Upstream Nextra chrome and default styling, which the docs render but don't write
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
  // Pending maintainer decision: remove once the linked issue is decided
  {
    rule: "color-contrast",
    selector: "a.group\\/cta > span:first-child",
    why: '#253: landing CTA label ("Read the docs", "Open Create"), white on --l-brand-soft, 2.68:1',
    pages: ["/"],
  },
  {
    rule: "color-contrast",
    selector: ".bg-success\\/10.text-success-text",
    why: "#254: success-text on a /10 tint over Nextra's #fafafa (Chip, kitchen-sink badge), 4.47:1",
    pages: ["/components/chip", "/kitchen-sink"],
    themes: ["light"],
  },
  // chunks-ui defects, outside the docs: fix them in packages/ui, then delete the entry
  {
    rule: "color-contrast",
    selector: '[role="grid"] button.opacity-50',
    why: "#252: Calendar outside-month days, muted text at opacity-50: 2:1 light, 2.69:1 dark",
    pages: ["/components/calendar", "/components/date-picker", "/create"],
  },
];

/** The entries that may excuse `rule` on `page` in `theme` */
export function allowedFor(entries: Allowed[], rule: string, page: string, theme: Theme) {
  return entries.filter(
    (entry) =>
      entry.rule === rule &&
      (!entry.pages || entry.pages.includes(page)) &&
      (!entry.themes || entry.themes.includes(theme)),
  );
}

/** Entries that matched nothing in the run, or name a page that doesn't exist */
export function staleEntries(entries: Allowed[], matched: Map<Allowed, number>, routes: string[]) {
  return entries.flatMap((entry) => [
    ...(matched.get(entry) ? [] : [`ALLOWED entry matched nothing: ${entry.why}`]),
    ...(entry.pages ?? [])
      .filter((page) => !routes.includes(page))
      .map((page) => `ALLOWED entry names a page that doesn't exist (${page}): ${entry.why}`),
  ]);
}

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

async function audit(browser: Browser, route: string, theme: Theme, matched: Map<Allowed, number>) {
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
      const allowed = allowedFor(ALLOWED, violation.id, route, theme);
      const targets: string[] = [];
      for (const node of violation.nodes) {
        const target = node.target.map(String).join(" ");
        // The first allowed selector the element matches or sits inside, or -1
        const index = await page.evaluate(
          ([selector, allowedSelectors]) => {
            const element = document.querySelector(selector);
            return allowedSelectors.findIndex((allowedSelector) =>
              element?.closest(allowedSelector),
            );
          },
          [target, allowed.map((entry) => entry.selector)] as const,
        );
        const entry = allowed[index];
        if (entry) matched.set(entry, (matched.get(entry) ?? 0) + 1);
        else targets.push(`${target}\n      ${node.html.slice(0, 160)}`);
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

// Not on import, so the spec can test allowedFor and staleEntries
if (import.meta.main) {
  const routes = pages();
  const server = await startServer();
  const browser = await chromium.launch();
  const problems: Problem[] = [];
  const matched = new Map<Allowed, number>();
  try {
    const queue = routes.flatMap((route) => THEMES.map((theme) => ({ route, theme })));
    const workers = Array.from({ length: PARALLEL }, async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        problems.push(...(await audit(browser, job.route, job.theme, matched)));
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
  const stale = staleEntries(ALLOWED, matched, routes);
  for (const message of stale) console.error(message);
  console.log(
    `axe checked ${routes.length} pages in ${THEMES.length} themes: ${problems.length} violations, ${stale.length} stale ALLOWED entries.`,
  );
  process.exit(problems.length + stale.length > 0 ? 1 : 0);
}

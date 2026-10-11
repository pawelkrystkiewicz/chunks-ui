/// <reference types="@types/bun" />
/**
 * Runs axe (WCAG 2.2 A and AA rules) over every docs page of the production build, in light and
 * dark mode. Fails on any violation that ALLOWED does not list, and on any ALLOWED entry that
 * never matched on one of its pages or in one of its themes.
 *
 * Covers the pages built from content/**\/*.mdx only: no other app routes, no 404 page. axe's
 * `incomplete` results (checks it could not decide, often contrast over images or gradients) are
 * not failed.
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
const PORT = Number(process.env.PORT || 3105);
const BASE_URL = `http://localhost:${PORT}`;
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];
const THEMES = ["light", "dark"] as const;
const PARALLEL = 4;

export type Theme = (typeof THEMES)[number];

/**
 * An accepted violation: one axe rule on the flagged elements that match `selector`, on
 * `pages` and in `themes` (every page and theme when left out). Keep entries specific, scope them
 * to where they occur, and link the issue that removes them. The run fails when an entry matches
 * nothing, or never matches on one of its pages or in one of its themes, so fixed ones can't linger.
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
    selector: 'pre code span[style*="--shiki-light:#E36209"]',
    why: "Nextra's default Shiki theme github-light: parameters #E36209 on white, 3.48:1",
    themes: ["light"],
  },
  {
    rule: "color-contrast",
    selector: 'pre code span[style*="--shiki-dark:#6A737D"]',
    why: "Nextra's default Shiki theme github-dark: comments #6A737D on black, 4.36:1",
    themes: ["dark"],
  },
  {
    rule: "color-contrast",
    selector: "a > code.nextra-code",
    why: "Nextra colours inline code in a link with its link colour on its code background, 4.45:1",
    themes: ["light"],
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

/**
 * Entries that matched nothing in the run, or never matched on a page or in a theme they declare.
 * `matched` holds the `${page}|${theme}` pairs where each entry excused a violation.
 */
export function staleEntries(entries: Allowed[], matched: Map<Allowed, Set<string>>) {
  return entries.flatMap((entry) => {
    const pairs = [...(matched.get(entry) ?? [])];
    if (pairs.length === 0) return [`ALLOWED entry matched nothing: ${entry.why}`];
    return [
      ...(entry.pages ?? [])
        .filter((page) => !pairs.some((pair) => pair.startsWith(`${page}|`)))
        .map((page) => `ALLOWED entry never matched on ${page}: ${entry.why}`),
      ...(entry.themes ?? [])
        .filter((theme) => !pairs.some((pair) => pair.endsWith(`|${theme}`)))
        .map((theme) => `ALLOWED entry never matched in ${theme} mode: ${entry.why}`),
    ];
  });
}

/**
 * The index of the first selector the flagged element itself matches, or -1. Runs in the page
 * (Playwright serialises it), so it uses nothing from this module.
 */
export function firstMatch([target, selectors]: readonly [string, readonly string[]]) {
  const element = document.querySelector(target);
  return element ? selectors.findIndex((selector) => element.matches(selector)) : -1;
}

type Problem = { page: string; theme: string; rule: string; help: string; targets: string[] };

function pages() {
  const routes = [...new Bun.Glob("**/*.mdx").scanSync(join(DOCS_DIR, "content"))].map((file) => {
    const route = file.replace(/\.mdx$/, "").replace(/(^|\/)index$/, "");
    return `/${route}`;
  });
  if (routes.length === 0) throw new Error(`No .mdx pages under ${join(DOCS_DIR, "content")}`);
  return routes.sort();
}

/** Whether anything answers HTTP on the port within 2s, whatever the status */
async function answers() {
  try {
    await fetch(BASE_URL, { signal: AbortSignal.timeout(2000) });
    return true;
  } catch {
    return false;
  }
}

const STARTUP_MS = 60_000;

async function startServer() {
  // A server left on the port would serve an older build
  if (await answers()) throw new Error(`${BASE_URL} is already taken; stop it or set PORT`);
  const server = Bun.spawn(["bun", "x", "next", "start", "-p", String(PORT)], {
    cwd: DOCS_DIR,
    stdout: "ignore",
    stderr: "inherit",
  });
  const deadline = Date.now() + STARTUP_MS;
  while (!(await answers())) {
    if (server.exitCode !== null) {
      throw new Error(
        `next start exited with code ${server.exitCode} before answering on ${BASE_URL}; see its output above (no docs build is the usual cause)`,
      );
    }
    if (Date.now() > deadline) {
      server.kill();
      throw new Error(`next start did not answer on ${BASE_URL} within ${STARTUP_MS / 1000}s`);
    }
    // Wake early if the server dies
    await Promise.race([Bun.sleep(500), server.exited]);
  }
  return server;
}

async function audit(
  browser: Browser,
  route: string,
  theme: Theme,
  matched: Map<Allowed, Set<string>>,
) {
  const context = await browser.newContext({ colorScheme: theme, reducedMotion: "reduce" });
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
    // next-themes puts the theme's name on <html>; without it the page was audited in the other one
    const htmlClass = await page.evaluate(() => document.documentElement.className);
    if (!htmlClass.split(" ").includes(theme)) {
      throw new Error(
        `${route} did not switch to the ${theme} theme (<html class="${htmlClass}">)`,
      );
    }
    const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const problems: Problem[] = [];
    if (failed.length > 0) {
      problems.push({ page: route, theme, rule: "http", help: "Requests failed", targets: failed });
    }
    for (const violation of violations) {
      const allowed = allowedFor(ALLOWED, violation.id, route, theme);
      const targets: string[] = [];
      for (const node of violation.nodes) {
        const target = node.target.join(" ");
        const index = await page.evaluate(firstMatch, [
          target,
          allowed.map((entry) => entry.selector),
        ] as const);
        const entry = allowed[index];
        if (entry) matched.set(entry, (matched.get(entry) ?? new Set()).add(`${route}|${theme}`));
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
  const problems: Problem[] = [];
  const matched = new Map<Allowed, Set<string>>();
  let browser: Browser | undefined;
  try {
    browser = await chromium.launch();
    const launched = browser;
    const queue = routes.flatMap((route) => THEMES.map((theme) => ({ route, theme })));
    const workers = Array.from({ length: PARALLEL }, async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        // One page failing to load or audit is a problem to report, not a reason to stop the run
        try {
          problems.push(...(await audit(launched, job.route, job.theme, matched)));
        } catch (error) {
          problems.push({
            page: job.route,
            theme: job.theme,
            rule: "navigation",
            help: "The page could not be loaded or audited",
            targets: [String(error)],
          });
        }
      }
    });
    await Promise.all(workers);
  } finally {
    await browser?.close();
    server.kill();
  }

  for (const { page, theme, rule, help, targets } of problems) {
    console.error(`${page} (${theme}) ${rule}: ${help}`);
    for (const target of targets) console.error(`    ${target}`);
  }
  const stale = staleEntries(ALLOWED, matched);
  for (const message of stale) console.error(message);
  console.log(
    `axe checked ${routes.length} pages in ${THEMES.length} themes: ${problems.length} problems, ${stale.length} stale ALLOWED entries.`,
  );
  process.exit(problems.length + stale.length > 0 ? 1 : 0);
}

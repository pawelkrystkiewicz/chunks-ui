/// <reference types="@types/bun" />
/**
 * Runs axe (WCAG 2.2 A and AA rules) over every docs page of the production build, in light and
 * dark mode. Fails on any violation that ALLOWED does not list, on any ALLOWED entry that never
 * matched on one of its pages or in one of its themes, and on any ALLOWED entry whose linked issue
 * (the `#NNN` that starts its `why`) was closed as completed or as a duplicate. An issue closed as
 * not planned keeps its entry.
 *
 * Covers the pages built from content/**\/*.mdx (the landing page, /create and /kitchen-sink
 * among them), every other page under app/, and the 404 page, which it gets by requesting a URL
 * no page answers on: that one must answer 404, every other page 200. On the pages POPUPS lists, it
 * then opens the first example's popup and audits it alone, open. axe's `incomplete` results
 * (checks it could not decide, often contrast over images or gradients) are not failed.
 *
 * Reads the issue states from the GitHub API with GITHUB_TOKEN (CI passes it; locally run
 * `GITHUB_TOKEN=$(gh auth token) bun run check:a11y`). Outside CI, an issue whose state can't be
 * read is a notice. In CI (GITHUB_ACTIONS=true) a missing token, or a 401, 403, 404 or 410 for an
 * issue, fails the run; timeouts, network errors, 429 and 5xx stay notices.
 *
 * Build first (`bun run build --filter=@chunks-ui/docs`); the script starts `next start` itself.
 * Needs Playwright's Chromium (`bunx playwright install chromium`, or the Playwright image in CI).
 *
 * Run: bun run check:a11y
 */
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { type Browser, chromium, type Page } from "playwright";

const DOCS_DIR = join(import.meta.dirname, "..");
const PORT = Number(process.env.PORT || 3105);
const BASE_URL = `http://localhost:${PORT}`;
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];
const THEMES = ["light", "dark"] as const;
const PARALLEL = 4;
// The repository the ALLOWED issue links point into, also when CI runs on a fork
const REPO = "pawelkrystkiewicz/chunks-ui";

export type Theme = (typeof THEMES)[number];

/**
 * An accepted violation: one axe rule on the flagged elements that match `selector`, on
 * `pages` and in `themes` (every page and theme when left out). Keep entries specific, scope them
 * to where they occur, and link the issue that removes or accepts them. The run fails when an entry
 * matches nothing, or never matches on one of its pages or in one of its themes, so fixed ones can't
 * linger. Only a `why` that starts with `#NNN` is checked against that issue's state.
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
    why: "#299: Nextra's Copy page menu toggle is an icon-only Headless UI button without a label",
  },
  {
    rule: "link-name",
    selector: 'td > a[href^="#"]:empty',
    why: '#299: Nextra\'s <TSDoc> props table links each row with an empty <a> that shows "#" from CSS',
  },
  {
    rule: "color-contrast",
    selector: 'pre code span[style*="--shiki-light:#E36209"]',
    why: "#299: Nextra's default Shiki theme github-light: parameters #E36209 on white, 3.48:1",
    themes: ["light"],
  },
  {
    rule: "color-contrast",
    selector: 'pre code span[style*="--shiki-dark:#6A737D"]',
    why: "#299: Nextra's default Shiki theme github-dark: comments #6A737D on black, 4.36:1",
    themes: ["dark"],
  },
  {
    rule: "color-contrast",
    selector: "a > code.nextra-code",
    why: "#299: Nextra colours inline code in a link with its link colour on its code background, 4.45:1",
    themes: ["light"],
  },
  // Accepted by the maintainer (issue closed as not planned): keep until it stops matching
  {
    rule: "color-contrast",
    selector: ".bg-success\\/10.text-success-text",
    why: "#254: success-text on a /10 tint over Nextra's #fafafa (Chip, kitchen-sink badge), 4.47:1, 0.03 short of 4.5:1",
    pages: ["/components/chip", "/kitchen-sink"],
    themes: ["light"],
  },
];

type Role = Parameters<Page["getByRole"]>[0];

/**
 * A popup the run opens and audits on its own, after its page, in every theme: it clicks the first
 * element of role `trigger` named `name` (the page's first example), waits for the one element of
 * role `popup`, runs axe on that element alone, checks the trigger has aria-expanded="true" and
 * aria-controls set to the popup's id, and closes it with Escape. ALLOWED applies to the
 * popup as to its page.
 */
type Popup = { page: string; trigger: Role; name: string; popup: Role };

const POPUPS: Popup[] = [
  { page: "/components/combobox", trigger: "button", name: "Show options", popup: "listbox" },
  { page: "/components/date-picker", trigger: "button", name: "Pick a date", popup: "dialog" },
  { page: "/components/menu", trigger: "button", name: "Options", popup: "menu" },
  { page: "/components/popover", trigger: "button", name: "More info", popup: "dialog" },
  { page: "/components/select", trigger: "combobox", name: "Fruit", popup: "listbox" },
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

/** GitHub's state of an issue; `state_reason` says why a closed issue was closed */
export type IssueState = { state: "open" | "closed"; state_reason: string | null };

/** The issue an entry links: the `#NNN` that starts its `why` (`"#254: …"`), if it has one */
export function linkedIssue(entry: Allowed) {
  const match = /^#(\d+)\b/.exec(entry.why);
  return match ? Number(match[1]) : undefined;
}

/**
 * Entries whose linked issue was closed other than as not planned (completed, or a duplicate): the
 * entry is out of date. An entry stays when its issue is open, was closed as not planned (an
 * accepted exception), or its state wasn't read (`states` has no entry for it).
 */
export function fixedEntries(entries: Allowed[], states: Map<number, IssueState>) {
  return entries.flatMap((entry) => {
    const issue = linkedIssue(entry);
    const state = issue === undefined ? undefined : states.get(issue);
    if (state?.state !== "closed" || state.state_reason === "not_planned") return [];
    return [
      `ALLOWED entry's issue #${issue} was closed as ${state.state_reason}: remove the entry, link the open issue, or merge master if your branch predates the fix: ${entry.why}`,
    ];
  });
}

/** Why the state of an issue could not be read: no token, an HTTP status, or no answer at all */
export type ReadCause = "no-token" | "network" | number;

/** Whether the run is on GitHub Actions, where a broken issue check fails instead of only noticing */
const IN_CI = process.env.GITHUB_ACTIONS === "true";

/** Whether an unreadable issue state fails the run in CI; the rule is in the header above */
export function failsInCi(cause: ReadCause) {
  return cause === "no-token" || [401, 403, 404, 410].includes(cause as number);
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

/** The one app/ page this script needs no URL for: it renders content/**\/*.mdx, which pages() lists */
const MDX_CATCH_ALL = "[[...mdxPath]]/page.tsx";

/** Throws on an app/ page other than the MDX catch-all, as this script doesn't know its URLs */
export function assertOnlyCatchAll(files: string[]) {
  const other = files.filter((file) => file !== MDX_CATCH_ALL);
  if (other.length > 0) {
    throw new Error(`app/${other.join(", app/")}: add its URLs to pages() in check-a11y.ts`);
  }
}

/** A URL no page answers on, so the server renders app/not-found.tsx with status 404 */
const NOT_FOUND_ROUTE = "/this-page-does-not-exist";

function pages() {
  const content = [...new Bun.Glob("**/*.mdx").scanSync(join(DOCS_DIR, "content"))].map((file) => {
    const route = file.replace(/\.mdx$/, "").replace(/(^|\/)index$/, "");
    return `/${route}`;
  });
  if (content.length === 0) throw new Error(`No .mdx pages under ${join(DOCS_DIR, "content")}`);
  assertOnlyCatchAll([
    ...new Bun.Glob("**/page.{js,jsx,ts,tsx,md,mdx}").scanSync(join(DOCS_DIR, "app")),
  ]);
  return [...new Set(content)].sort().concat(NOT_FOUND_ROUTE);
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

/**
 * The state of each issue, read from the GitHub API with GITHUB_TOKEN. An issue whose state
 * can't be read is left out, with a message: a failure when failsInCi says so, a notice otherwise.
 */
export async function readIssueStates(issues: number[]) {
  const states = new Map<number, IssueState>();
  const notices: string[] = [];
  const failures: string[] = [];
  const token = process.env.GITHUB_TOKEN;
  const report = (cause: ReadCause, subject: string, message: string) => {
    if (IN_CI && failsInCi(cause)) {
      failures.push(
        `${subject} (${cause}): check GITHUB_TOKEN on the axe step in .github/workflows/quality-gates.yml, its \`issues: read\` permission, and the #NNN that starts \`why\``,
      );
    } else notices.push(message);
  };
  if (issues.length === 0) return { states, notices, failures };
  if (!token) {
    const all = issues.map((issue) => `#${issue}`).join(", ");
    report(
      "no-token",
      "Issue check failed for the linked issues",
      `GITHUB_TOKEN is not set, so the state of ${all} was not read and ALLOWED entries were not checked for fixed issues`,
    );
    return { states, notices, failures };
  }
  await Promise.all(
    issues.map(async (issue) => {
      const fail = (cause: ReadCause, detail: string) =>
        report(
          cause,
          `Issue check failed for #${issue}`,
          `Could not read the state of #${issue} (${detail})`,
        );
      try {
        const response = await fetch(`https://api.github.com/repos/${REPO}/issues/${issue}`, {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            "X-GitHub-Api-Version": "2022-11-28",
          },
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) return fail(response.status, `GitHub answered ${response.status}`);
        const { state, state_reason } = (await response.json()) as IssueState;
        states.set(issue, { state, state_reason });
      } catch (error) {
        fail("network", String(error));
      }
    }),
  );
  return { states, notices, failures };
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

/**
 * Runs axe on the page, or on the elements `scope.selector` matches alone, and returns the
 * violations ALLOWED does not excuse, recording each entry that excused one in `matched`
 */
async function axe(
  page: Page,
  route: string,
  theme: Theme,
  matched: Map<Allowed, Set<string>>,
  scope?: { selector: string; label: string },
) {
  const builder = new AxeBuilder({ page }).withTags(TAGS);
  const { violations } = await (scope ? builder.include(scope.selector) : builder).analyze();
  const problems: Problem[] = [];
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
      const where = scope?.label ?? route;
      problems.push({ page: where, theme, rule: violation.id, help: violation.help, targets });
    }
  }
  return problems;
}

const POPUP_MS = 10_000;

/** Opens `popup` on its loaded page, runs axe on it alone, and closes it with Escape */
async function auditPopup(
  page: Page,
  popup: Popup,
  label: string,
  theme: Theme,
  matched: Map<Allowed, Set<string>>,
) {
  const trigger = page.getByRole(popup.trigger, { name: popup.name, exact: true }).first();
  // A handle, as some triggers change their name while open (Combobox: "Hide options")
  const handle = await trigger.elementHandle({ timeout: POPUP_MS });
  await trigger.click({ timeout: POPUP_MS });
  const element = page.getByRole(popup.popup);
  await element.waitFor({ timeout: POPUP_MS });
  const id = await element.getAttribute("id");
  if (!id) throw new Error(`The open ${popup.popup} has no id to scope axe to`);
  const problems = await axe(page, popup.page, theme, matched, { selector: `[id="${id}"]`, label });
  // The trigger tells assistive technology the popup is open, and which element it is
  const state = await handle?.evaluate((el) => ({
    expanded: el.getAttribute("aria-expanded"),
    controls: el.getAttribute("aria-controls"),
  }));
  if (state?.expanded !== "true" || state.controls !== id) {
    problems.push({
      page: label,
      theme,
      rule: "popup-trigger",
      help: "The open popup's trigger must have aria-expanded=\"true\" and aria-controls set to the popup's id",
      targets: [
        `aria-expanded=${state?.expanded}, aria-controls=${state?.controls}, popup id=${id}`,
      ],
    });
  }
  // The violations found above must survive a popup that won't close
  try {
    await page.keyboard.press("Escape");
    await element.waitFor({ state: "hidden", timeout: POPUP_MS });
  } catch (error) {
    problems.push({
      page: label,
      theme,
      rule: "popup",
      help: "The popup could not be closed",
      targets: [String(error)],
    });
  }
  return problems;
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
    // The page's own status is checked after goto, as the 404 page answers 404 on purpose
    if (response.request().isNavigationRequest() && response.frame() === page.mainFrame()) return;
    if (response.url().startsWith(BASE_URL) && response.status() >= 400) {
      failed.push(`${response.status()} ${response.url()}`);
    }
  });
  try {
    const response = await page.goto(BASE_URL + route, { waitUntil: "networkidle" });
    const expected = route === NOT_FOUND_ROUTE ? 404 : 200;
    if (response?.status() !== expected) {
      throw new Error(`${route} answered ${response?.status()} instead of ${expected}`);
    }
    // next-themes puts the theme's name on <html>; without it the page was audited in the other one
    const htmlClass = await page.evaluate(() => document.documentElement.className);
    if (!htmlClass.split(" ").includes(theme)) {
      throw new Error(
        `${route} did not switch to the ${theme} theme (<html class="${htmlClass}">)`,
      );
    }
    const problems = await axe(page, route, theme, matched);
    for (const popup of POPUPS.filter((entry) => entry.page === route)) {
      const label = `${route} with ${popup.name} open`;
      // A popup that won't open or close is a problem of its own; the page's results still count
      try {
        problems.push(...(await auditPopup(page, popup, label, theme, matched)));
      } catch (error) {
        problems.push({
          page: label,
          theme,
          rule: "popup",
          help: "The popup could not be opened, audited or closed",
          targets: [String(error)],
        });
      }
    }
    // Checked last, as opening a popup can load more
    if (failed.length > 0) {
      problems.push({ page: route, theme, rule: "http", help: "Requests failed", targets: failed });
    }
    return problems;
  } finally {
    await context.close();
  }
}

// Not on import, so the spec can test the pure functions above
if (import.meta.main) {
  const routes = pages();
  // A renamed page would otherwise drop its popup from the run without a word
  const lost = POPUPS.filter((popup) => !routes.includes(popup.page)).map((popup) => popup.page);
  if (lost.length > 0) {
    throw new Error(`POPUPS names pages the docs don't have: ${lost.join(", ")}`);
  }
  const issues = [...new Set(ALLOWED.flatMap((entry) => linkedIssue(entry) ?? []))].sort(
    (a, b) => a - b,
  );
  const issueStates = readIssueStates(issues);
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
  const { states, notices, failures } = await issueStates;
  // An annotation on the GitHub Actions run, so a check that was skipped there gets seen
  for (const notice of notices) console.log(`${IN_CI ? "::notice::" : "Notice: "}${notice}`);
  const stale = [...staleEntries(ALLOWED, matched), ...fixedEntries(ALLOWED, states)];
  for (const message of stale) console.error(message);
  if (failures.length > 0) {
    console.error("Issue check failed:");
    for (const message of failures) console.error(`  ${message}`);
  }
  console.log(
    `axe checked ${routes.length} pages and ${POPUPS.length} popups in ${THEMES.length} themes: ${problems.length} problems, ${stale.length} stale ALLOWED entries, ${failures.length} unread ${failures.length === 1 ? "issue" : "issues"}.`,
  );
  process.exit(problems.length + stale.length + failures.length > 0 ? 1 : 0);
}

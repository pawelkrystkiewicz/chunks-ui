import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defaultClientConditions } from "vite";
import { defineConfig } from "vitest/config";
import type { BrowserCommand } from "vitest/node";
import { SETTLE_TIMEOUT_MS } from "./src/VisualTest.timeouts.ts";
import type { AccessibilityNode, EmulatedMedia } from "./src/VisualTest.utils.tsx";

/**
 * The runner's browser window, in CSS px. Vitest scales the test page down until it fits the
 * window, and Playwright's default window (1280 × 720) is shorter than the 414 × 896 page, so
 * screenshots came out at 0.8 scale. This window holds every page size the specs set, so a
 * screenshot has one px per CSS px.
 */
const RUNNER_WINDOW = { width: 1280, height: 1024 };

/**
 * Playwright with the window above, the pinned time zone, the given reduced-motion preference and,
 * with `hasTouch`, a touch screen
 */
export const playwrightProvider = (reducedMotion: "reduce" | "no-preference", hasTouch = false) =>
  playwright({
    contextOptions: {
      reducedMotion,
      hasTouch,
      viewport: RUNNER_WINDOW,
      // The unit suite pins TZ the same way; see TESTING_STRATEGY.md "Time zone".
      timezoneId: "Europe/Warsaw",
    },
  });

/** Emulates media features (e.g. no reduced-motion preference, to reach the Motion path). */
const emulateMedia: BrowserCommand<[options: EmulatedMedia]> = async ({ page }, options) => {
  await page.emulateMedia(options);
};

/** Moves the mouse outside the viewport, where it hovers nothing. */
const parkPointer: BrowserCommand<[]> = async ({ page }) => {
  await page.mouse.move(-1, -1);
};

/** Where the last `pointerDown` or `pointerMoveBy` left the mouse, in the main page's CSS px */
let pointer = { x: 0, y: 0 };

/**
 * Presses the mouse on the middle of the first element in the test page that `selector` (CSS)
 * matches, moved by the offset. A real press, so the page sees pointer events as from a user; the specs of a drag
 * (Resizable) need the pointer to stay down between commands.
 */
const pointerDown: BrowserCommand<[selector: string, offsetX?: number, offsetY?: number]> = async (
  { page, frame },
  selector,
  offsetX = 0,
  offsetY = 0,
) => {
  const box = await (await frame()).locator(selector).first().boundingBox();
  if (!box) throw new Error(`No box for ${selector}`);
  pointer = { x: box.x + box.width / 2 + offsetX, y: box.y + box.height / 2 + offsetY };
  await page.mouse.move(pointer.x, pointer.y);
  await page.mouse.down();
};

/** Moves the pressed mouse by (dx, dy) CSS px in `steps` moves, each a pointer event */
const pointerMoveBy: BrowserCommand<[dx: number, dy: number, steps?: number]> = async (
  { page },
  dx,
  dy,
  steps = 1,
) => {
  pointer = { x: pointer.x + dx, y: pointer.y + dy };
  await page.mouse.move(pointer.x, pointer.y, { steps });
};

/** Releases the mouse */
const pointerUp: BrowserCommand<[]> = async ({ page }) => {
  await page.mouse.up();
};

type FrameTree = { frame: { id: string; url: string }; childFrames?: FrameTree[] };

const frameIdOf = (tree: FrameTree, url: string): string | undefined =>
  tree.frame.url === url
    ? tree.frame.id
    : tree.childFrames?.map((child) => frameIdOf(child, url)).find(Boolean);

/**
 * Chromium's accessibility tree for the first element in the test page that `selector` (CSS)
 * matches, read over CDP: its node and the nodes below it, with the role and the name Chromium
 * computed. Ignored nodes below it are left out, and their children take their place;
 * InlineTextBox nodes, which repeat their StaticText's name, are left out.
 */
const accessibilityTree: BrowserCommand<[selector: string]> = async (
  { page, frame, context },
  selector,
): Promise<AccessibilityNode> => {
  const cdp = await context.newCDPSession(page);
  try {
    const { frameTree } = await cdp.send("Page.getFrameTree");
    const frameId = frameIdOf(frameTree, (await frame()).url());
    if (!frameId) throw new Error("The test page's frame is not in the CDP frame tree");
    const { executionContextId } = await cdp.send("Page.createIsolatedWorld", { frameId });
    const { result, exceptionDetails } = await cdp.send("Runtime.evaluate", {
      expression: `document.querySelector(${JSON.stringify(selector)})`,
      contextId: executionContextId,
    });
    if (exceptionDetails) {
      throw new Error(
        `Invalid selector ${selector}: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
      );
    }
    if (!result.objectId || result.subtype === "null") {
      throw new Error(`No element matches ${selector}`);
    }
    const { node } = await cdp.send("DOM.describeNode", { objectId: result.objectId });
    const { nodes } = await cdp.send("Accessibility.getFullAXTree", { frameId });
    const byId = new Map(nodes.map((axNode) => [axNode.nodeId, axNode]));
    type AXNode = (typeof nodes)[number];
    const below = (axNode: AXNode): AccessibilityNode[] =>
      (axNode.childIds ?? []).flatMap((id) => {
        const child = byId.get(id);
        if (!child || child.role?.value === "InlineTextBox") return [];
        return child.ignored ? below(child) : [toNode(child)];
      });
    const toNode = (axNode: AXNode): AccessibilityNode => ({
      role: String(axNode.role?.value ?? ""),
      name: String(axNode.name?.value ?? ""),
      children: below(axNode),
    });
    const root = nodes.find((axNode) => axNode.backendDOMNodeId === node.backendNodeId);
    if (!root) throw new Error(`${selector} has no node in the accessibility tree`);
    return toNode(root);
  } finally {
    await cdp.detach();
  }
};

export default defineConfig({
  plugins: [react()],
  // chunks-ui-core from its src/: the visual workflows run without a build
  resolve: { conditions: ["chunks-ui-source", ...defaultClientConditions] },
  css: {
    postcss: {
      plugins: [(await import("@tailwindcss/postcss")).default()],
    },
  },
  optimizeDeps: {
    // Dependencies that only specs import, never the package source. A dependency cache built
    // while no scanned spec imported one (a narrower run, or a spec that gained the import later)
    // is still valid, so Vite found it mid-run, re-bundled, and reloaded the page: the SSR specs
    // then failed with two copies of React (#488).
    include: [
      "react-dom/client",
      "react-dom/server",
      "@testing-library/user-event",
      // The aria-hidden-focus audit in Toast.visual.spec.tsx (#597): a cache from before that
      // spec imported it made Vite reload the test page mid-run
      "axe-core",
    ],
  },
  test: {
    globals: true,
    include: ["src/**/*.visual.spec.tsx"],
    setupFiles: ["./vitest.visual.setup.ts"],
    // The default is 1000 ms, tight for a CSS transition or a Motion spring on a loaded runner. Only
    // expect.poll reads it: expect.element, though it polls, waits for the rest of the test timeout
    // (15 s in browser mode) unless it gets `{ timeout }`; the few that want a 5 s bound pass
    // SETTLE_TIMEOUT_MS. A wait ends as soon as it is met, so only a failing one is slow.
    expect: { poll: { timeout: SETTLE_TIMEOUT_MS } },
    browser: {
      enabled: true,
      headless: true,
      provider: playwrightProvider("reduce"),
      commands: {
        emulateMedia,
        parkPointer,
        accessibilityTree,
        pointerDown,
        pointerMoveBy,
        pointerUp,
      },
      instances: [
        // Reduced motion: components skip Motion springs, so screenshots never catch one mid-way
        {
          browser: "chromium",
          provider: playwrightProvider("reduce"),
          // The WebKit smoke specs run in their own project, vitest.webkit.config.ts
          exclude: [
            "src/**/*.motion.visual.spec.tsx",
            "src/**/*.webkit.visual.spec.tsx",
            "src/**/*.touch.visual.spec.tsx",
          ],
        },
        // Motion only animates when reduced motion is off
        {
          browser: "chromium",
          name: "chromium-motion",
          provider: playwrightProvider("no-preference"),
          include: ["src/**/*.motion.visual.spec.tsx"],
        },
        // A touch screen, so `(pointer: coarse)` matches, from the start: CDP touch emulation turned
        // off in a spec leaves the Docker image's page with no pointer and no hover (Playwright's
        // fine pointer is a launch flag), and the page runs the session's later spec files
        {
          browser: "chromium",
          name: "chromium-touch",
          provider: playwrightProvider("reduce", true),
          include: ["src/**/*.touch.visual.spec.tsx"],
        },
      ],
      expect: {
        toMatchScreenshot: {
          comparatorOptions: {
            // The pinned image renders near-identically, so no pixel may differ beyond the colour
            // threshold below.
            allowedMismatchedPixelRatio: 0,
            // Pixelmatch's default 0.1 misses a --border line (oklch 0.922) removed from white.
            // 0.02 still ignores a shift of about 5 grey levels; not 0, to absorb rounding noise
            // between Chromium builds and emulated vs native amd64 runs
            threshold: 0.02,
          },
        },
      },
    },
  },
});

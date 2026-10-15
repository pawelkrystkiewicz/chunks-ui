import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import type { BrowserCommand } from "vitest/node";
import type { AccessibilityNode, EmulatedMedia } from "./src/VisualTest.utils";

/**
 * The runner's browser window, in CSS px. Vitest scales the test page down until it fits the
 * window, and Playwright's default window (1280 × 720) is shorter than the 414 × 896 page, so
 * screenshots came out at 0.8 scale. This window holds every page size the specs set, so a
 * screenshot has one px per CSS px.
 */
const RUNNER_WINDOW = { width: 1280, height: 1024 };

/** Playwright with the window above, the pinned time zone and the given reduced-motion preference */
export const playwrightProvider = (reducedMotion: "reduce" | "no-preference") =>
  playwright({
    contextOptions: {
      reducedMotion,
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
  css: {
    postcss: {
      plugins: [(await import("@tailwindcss/postcss")).default()],
    },
  },
  test: {
    globals: true,
    include: ["src/**/*.visual.spec.tsx"],
    setupFiles: ["./vitest.visual.setup.ts"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwrightProvider("reduce"),
      commands: { emulateMedia, parkPointer, accessibilityTree },
      instances: [
        // Reduced motion: components skip Motion springs, so screenshots never catch one mid-way
        {
          browser: "chromium",
          provider: playwrightProvider("reduce"),
          // The WebKit smoke specs run in their own project, vitest.webkit.config.ts
          exclude: ["src/**/*.motion.visual.spec.tsx", "src/**/*.webkit.visual.spec.tsx"],
        },
        // Motion only animates when reduced motion is off
        {
          browser: "chromium",
          name: "chromium-motion",
          provider: playwrightProvider("no-preference"),
          include: ["src/**/*.motion.visual.spec.tsx"],
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

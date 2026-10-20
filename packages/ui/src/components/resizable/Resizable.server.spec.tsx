import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Resizable } from "./Resizable";

/**
 * What a server does not have. The unit suite runs under jsdom, where all of these exist, so a
 * render that read one of them would pass; they are taken away for each spec instead. (A file run
 * in vitest's node environment would be the direct way, but vitest.setup.ts writes to `window` and
 * fails there.)
 */
const BROWSER_ONLY = [
  "window",
  "document",
  "Node",
  "Element",
  "HTMLElement",
  "getComputedStyle",
  "matchMedia",
  "requestAnimationFrame",
  "ResizeObserver",
];

beforeEach(() => {
  for (const name of BROWSER_ONLY) vi.stubGlobal(name, undefined);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Resizable on the server", () => {
  it("is rendered with no window or document", () => {
    expect(typeof window).toBe("undefined");
    expect(typeof document).toBe("undefined");
  });

  it("renders a group of % panels with each size as the fallback of its variable", () => {
    const html = renderToString(
      <Resizable.Group aria-label="Split" defaultLayout={{ side: 25, main: 75 }}>
        <Resizable.Panel id="side" defaultSize="30%" minSize="10%">
          Side
        </Resizable.Panel>
        <Resizable.Handle aria-label="Resize side" />
        <Resizable.Panel id="main" defaultSize="70%">
          Main
        </Resizable.Panel>
      </Resizable.Group>,
    );
    expect(html).toContain('data-orientation="horizontal"');
    expect(html).toContain("var(--resizable-side, 25)");
    expect(html).toContain("var(--resizable-main, 75)");
    // The variables themselves are set by the group once it is mounted, not in the server's HTML
    expect(html).not.toMatch(/--resizable-[\w-]+:/);
  });

  it("renders px panels, a vertical group, a nested group and a controlled layout", () => {
    const html = renderToString(
      <Resizable.Group aria-label="Outer" layout={{ nav: 240, rest: 100 }}>
        <Resizable.Panel id="nav" defaultSize={200} minSize={120} maxSize="40%">
          Nav
        </Resizable.Panel>
        <Resizable.Handle aria-label="Resize nav" />
        <Resizable.Panel id="rest">
          <Resizable.Group orientation="vertical" aria-label="Inner" defaultLayout={{ top: 40 }}>
            <Resizable.Panel id="top">Top</Resizable.Panel>
            <Resizable.Handle aria-label="Resize top" />
            <Resizable.Panel id="bottom">Bottom</Resizable.Panel>
          </Resizable.Group>
        </Resizable.Panel>
      </Resizable.Group>,
    );
    expect(html).toContain("flex:0 0 var(--resizable-nav, 240px)");
    expect(html).toContain("flex:var(--resizable-rest, 100) 1 0%");
    expect(html).toContain('data-orientation="vertical"');
    expect(html).toContain("var(--resizable-top, 40)");
    expect(html).toContain("var(--resizable-bottom, 60)");
  });
});

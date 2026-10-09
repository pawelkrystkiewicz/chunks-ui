import { act, cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Dialog } from "../components/dialog";
import { ThemeToggle } from "../components/theme-toggle";
import { useReducedMotion } from "./use-motion";

// jsdom has no media queries, so each test sets what `prefers-reduced-motion` reports
const restore: (() => void)[] = [];

function emulateReducedMotion(reduce: boolean) {
  const query = Object.assign(new EventTarget(), {
    matches: reduce,
    media: "(prefers-reduced-motion: reduce)",
  });
  const matchMedia = window.matchMedia;
  window.matchMedia = () => query as unknown as MediaQueryList;
  restore.push(() => {
    window.matchMedia = matchMedia;
  });
  return {
    change(next: boolean) {
      query.matches = next;
      query.dispatchEvent(Object.assign(new Event("change"), { matches: next }));
    },
  };
}

// A real server has no window and no media queries; jsdom gives renderToString both, so the
// server markup is rendered while the query reports no preference. The client then has
// `reduce`, as for a reduced-motion user.
function serverMarkup(ui: ReactNode) {
  emulateReducedMotion(false);
  const container = document.createElement("div");
  container.innerHTML = renderToString(ui);
  document.body.append(container);
  restore.push(() => container.remove());
  emulateReducedMotion(true);
  return container;
}

async function hydrate(container: HTMLElement, ui: ReactNode) {
  await act(async () => {
    const root = hydrateRoot(container, ui);
    restore.push(() => root.unmount());
  });
}

function Probe() {
  return <output>{String(useReducedMotion())}</output>;
}

afterEach(() => {
  cleanup();
  for (const undo of restore.splice(0).reverse()) undo();
});

describe("useReducedMotion", () => {
  it("reports no reduced motion in a server render", () => {
    emulateReducedMotion(true);
    expect(renderToString(<Probe />)).toContain(">false</output>");
  });

  it("switches to the user's preference after hydration without remounting", async () => {
    const container = serverMarkup(<Probe />);
    const output = container.querySelector("output");
    await hydrate(container, <Probe />);
    expect(container.querySelector("output")).toBe(output);
    expect(output).toHaveTextContent("true");
  });

  it("follows changes to the media query", () => {
    const media = emulateReducedMotion(false);
    render(<Probe />);
    expect(screen.getByRole("status")).toHaveTextContent("false");
    act(() => media.change(true));
    expect(screen.getByRole("status")).toHaveTextContent("true");
  });

  it("hydrates ThemeToggle without a mismatch for reduced-motion users", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    restore.push(() => consoleError.mockRestore());
    const ui = <ThemeToggle theme="light" />;
    await hydrate(serverMarkup(ui), ui);
    expect(consoleError).not.toHaveBeenCalled();
  });

  // A popup renders in a client-only portal, so it is never hydrated. It must read the real
  // preference on its first render: switching from motion.div to a plain element would
  // remount it.
  it("renders a popup opened after hydration without Motion from its first render", async () => {
    await import("motion/react");
    emulateReducedMotion(true);
    const nodes = new Set<HTMLElement>();
    render(
      <Dialog.Root defaultOpen>
        <Dialog.Portal>
          <Dialog.Popup
            ref={(node) => {
              if (node) nodes.add(node);
            }}
          >
            <Dialog.Title>Dialog</Dialog.Title>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    await act(async () => {});
    expect(nodes.size).toBe(1);
  });
});

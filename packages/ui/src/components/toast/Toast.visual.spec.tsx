import { Toast as BaseToast } from "@base-ui/react/toast";
import { render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import { type ComponentPropsWithoutRef, type ReactNode, useEffect } from "react";
import { afterAll, beforeAll, describe, expect, it, onTestFinished } from "vitest";
import { page, userEvent } from "vitest/browser";
import { type Dir, emulateReducedMotion, withViewport } from "../../VisualTest.utils";
import { Toast } from "./index";
import { AddToasts } from "./Toast.TestUtils";

function AddToast({
  title,
  description,
  actionProps,
  dismissible,
  timeout,
  priority,
}: {
  title: string;
  description?: string;
  actionProps?: ComponentPropsWithoutRef<"button">;
  dismissible?: boolean;
  timeout?: number;
  priority?: "low" | "high";
}) {
  const manager = Toast.useToast();
  // A fixed id: a remount updates this toast instead of adding a second one. Mount-only on
  // purpose: `manager` and `actionProps` change every render, and updating the toast renders again.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the props are fixed in each spec
  useEffect(() => {
    manager.add({
      id: "visual-toast",
      title,
      description,
      actionProps,
      dismissible,
      timeout,
      priority,
    });
  }, []);
  return null;
}

describe("Toast", () => {
  it("default", async () => {
    render(
      <Toast.Provider>
        <AddToast title="File saved" description="Your changes have been saved." />
        <Toast.Viewport />
      </Toast.Provider>,
    );
    await screen.findByText("File saved");
    await expect(page.elementLocator(document.body)).toMatchScreenshot();
  });

  it("with action", async () => {
    render(
      <Toast.Provider>
        <AddToast
          title="Connection lost"
          description="Reconnecting automatically."
          actionProps={{ children: "Retry now" }}
        />
        <Toast.Viewport />
      </Toast.Provider>,
    );
    await screen.findByRole("button", { name: "Retry now" });
    await expect(page.elementLocator(document.body)).toMatchScreenshot();
  });

  // The root is `overflow-hidden` and the close button sits 8px inside it, so its ring (2px
  // offset, 2px wide) has 4px to spare: this shows whether the root clips the ring. `timeout={0}`
  // keeps the toast up however long a slow runner takes.
  it("close focus-visible", async () => {
    render(
      <Toast.Provider>
        <AddToast
          title="Connection lost"
          description="Reconnecting automatically."
          actionProps={{ children: "Retry now" }}
          dismissible
          timeout={0}
        />
        <Toast.Viewport />
      </Toast.Provider>,
    );
    // Base UI hides the close button from assistive tech until the toast is focused or hovered,
    // so it has no accessible role yet
    const close = await screen.findByLabelText("Close", { selector: "button" });
    close.focus();
    expect(close.matches(":focus-visible")).toBe(true);
    await expect(page.elementLocator(close.closest(".Toast") as HTMLElement)).toMatchScreenshot();
  });

  // Base UI 1.9 drops a high-priority toast's aria-hidden only when focus in the viewport is
  // :focus-visible (handleFocus in ToastViewport.js). A mouse click focuses the root without it,
  // so the root keeps aria-hidden while it has focus. The jsdom spec can't show this: Base UI
  // takes every focus there for :focus-visible. A failure means Base UI changed this (a fix for
  // mui/base-ui#5659, say): update this row and the high-priority note under Props in
  // apps/docs/content/components/toast.mdx. Alone on purpose, as in the jsdom spec: next to a
  // `low` toast (a role="dialog", which axe takes for an open modal) axe lists it as `incomplete`
  it("keeps a high-priority toast aria-hidden when a click focuses it", async () => {
    const { container } = render(
      <Toast.Provider>
        <AddToast
          title="Connection lost"
          description="Reconnecting automatically."
          priority="high"
          timeout={0}
        />
        <Toast.Viewport />
      </Toast.Provider>,
    );
    // aria-hidden, so only a query with `hidden` finds it
    const toast = await screen.findByRole("alertdialog", { hidden: true });
    await userEvent.click(toast);
    expect(toast).toHaveFocus();
    expect(toast).toHaveAttribute("aria-hidden", "true");
    const results = await axe.run(container, { runOnly: ["aria-hidden-focus"] });
    expect(results.violations.map((rule) => rule.id)).toEqual(["aria-hidden-focus"]);
    expect(results.violations[0]?.nodes.map((node) => node.html)).toEqual([
      expect.stringContaining('role="alertdialog"'),
    ]);
  });
});

/** The toasts' direction, and the page's: an `rtl:` variant would match in the LTR section */
const LAYOUTS = [
  { layout: "ltr", dir: "ltr", page: "ltr" },
  { layout: "rtl", dir: "rtl", page: "rtl" },
  { layout: "ltr section on an rtl page", dir: "ltr", page: "rtl" },
] as const;

/** Renders `ui` on a page of direction `page`, in a section of direction `dir` if they differ */
function renderIn({ dir, page }: { dir: Dir; page: Dir }, ui: ReactNode) {
  document.documentElement.dir = page;
  onTestFinished(() => document.documentElement.removeAttribute("dir"));
  return render(page === dir ? ui : <div dir={dir}>{ui}</div>);
}

describe.each(LAYOUTS)("Toast viewport, $layout", (layout) => {
  // Wide enough that the viewport doesn't span the page, so its side is plain to see
  withViewport(800, 600);

  it("sits in the bottom corner at the inline end", async () => {
    renderIn(
      layout,
      <Toast.Provider>
        <AddToast title="File saved" />
        <Toast.Viewport />
      </Toast.Provider>,
    );
    await screen.findByText("File saved");
    const box = screen.getByRole("region", { name: /Notifications/ }).getBoundingClientRect();
    const { clientWidth, clientHeight } = document.documentElement;
    expect(clientHeight - box.bottom).toBeCloseTo(16, 0);
    expect(layout.dir === "ltr" ? clientWidth - box.right : box.left).toBeCloseTo(16, 0);
  });
});

describe.each(["ltr", "rtl"] as const)("Toast action in %s", (dir) => {
  it("is as wide as its label and sits at the content's start edge", async () => {
    document.documentElement.dir = dir;
    onTestFinished(() => document.documentElement.removeAttribute("dir"));
    render(
      <Toast.Provider>
        <AddToast
          title="Connection lost"
          description="Reconnecting automatically."
          actionProps={{ children: "Retry now" }}
        />
        <Toast.Viewport />
      </Toast.Provider>,
    );
    const action = await screen.findByRole("button", { name: "Retry now" });
    const content = action.closest(".ToastContent") as HTMLElement;

    const label = document.createRange();
    label.selectNodeContents(action);
    const style = getComputedStyle(action);
    const chrome = ["paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth"] as const;
    const fitted =
      label.getBoundingClientRect().width +
      chrome.reduce((sum, side) => sum + Number.parseFloat(style[side]), 0);

    const box = action.getBoundingClientRect();
    const area = content.getBoundingClientRect();
    expect(box.width).toBeCloseTo(fitted, 0);
    if (dir === "ltr") expect(box.left).toBeCloseTo(area.left, 0);
    else expect(box.right).toBeCloseTo(area.right, 0);
  });
});

function RootList({ swipeDirection }: { swipeDirection?: ("down" | "left" | "right" | "up")[] }) {
  return (
    <>
      {Toast.useToast().toasts.map((toast) => (
        <Toast.Root key={toast.id} toast={toast} swipeDirection={swipeDirection}>
          <Toast.Description>{toast.description}</Toast.Description>
          <Toast.Action>Undo</Toast.Action>
        </Toast.Root>
      ))}
    </>
  );
}

describe("Toast.Action placed directly in Toast.Root", () => {
  it("stays vertically centred next to multi-line text", async () => {
    render(
      <Toast.Provider>
        <AddToast
          title="Saved"
          description="A long description that wraps onto several lines so the row is clearly taller than the button."
        />
        <BaseToast.Viewport className="fixed top-4 left-4 w-[240px]">
          <RootList />
        </BaseToast.Viewport>
      </Toast.Provider>,
    );
    const action = await screen.findByRole("button", { name: "Undo" });
    const root = action.closest(".Toast") as HTMLElement;
    const box = action.getBoundingClientRect();
    const area = root.getBoundingClientRect();
    // The action's `mt-1` shifts its box 2px below the exact centre
    expect(Math.abs(box.top + box.height / 2 - (area.top + area.height / 2))).toBeLessThan(4);
  });
});

describe("Toast with motion allowed", () => {
  beforeAll(() => emulateReducedMotion(false));
  afterAll(() => emulateReducedMotion(true));

  // The `translate-x-*` slide sets the `translate` property, not `transform`
  it("slides and fades in", async () => {
    // Every transition that starts, recorded from before the toast mounts
    const runs: { target: EventTarget | null; property: string }[] = [];
    const record = (event: TransitionEvent) => {
      runs.push({ target: event.target, property: event.propertyName });
    };
    document.addEventListener("transitionrun", record, true);
    onTestFinished(() => document.removeEventListener("transitionrun", record, true));

    render(
      <Toast.Provider>
        <AddToast title="File saved" />
        <Toast.Viewport />
      </Toast.Provider>,
    );
    const toast = (await screen.findByText("File saved")).closest(".Toast");
    const transitioned = () =>
      [...new Set(runs.filter((run) => run.target === toast).map((run) => run.property))].sort();
    await expect.poll(transitioned).toEqual(expect.arrayContaining(["opacity", "translate"]));
    expect(transitioned()).toEqual(["opacity", "translate"]);
  });

  /** Dispatched by hand: no pointer is active for the made-up id */
  function swipe(toast: HTMLElement, drag: "left" | "right" | "down") {
    toast.setPointerCapture = () => {};
    const pointer = (type: string, d: number, target: EventTarget = toast) =>
      target.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          pointerId: 7,
          button: 0,
          clientX: 300 + (drag === "down" ? 0 : d * (drag === "right" ? 1 : -1)),
          clientY: 300 + (drag === "down" ? d : 0),
          movementX: drag === "down" ? 0 : 10 * (drag === "right" ? 1 : -1),
          movementY: drag === "down" ? 10 : 0,
        }),
      );
    pointer("pointerdown", 0);
    for (const d of [0, 20, 60, 100]) pointer("pointermove", d);
    pointer("pointerup", 100, document);
  }

  // Dragged by hand: the gesture needs several moves, and Playwright's drag makes one
  describe.each([
    { dir: "ltr", drag: "right" },
    { dir: "ltr", drag: "left" },
    { dir: "rtl", drag: "right" },
    { dir: "rtl", drag: "left" },
    { dir: "ltr", drag: "down" },
  ] as const)("swiping $drag, $dir", ({ dir, drag }) => {
    it("dismisses the toast, and it leaves the way it was dragged", async () => {
      document.documentElement.dir = dir;
      onTestFinished(() => document.documentElement.removeAttribute("dir"));
      render(
        <Toast.Provider>
          <AddToast title="File saved" />
          <Toast.Viewport />
        </Toast.Provider>,
      );
      const toast = (await screen.findByText("File saved")).closest(".Toast") as HTMLElement;
      await expect.poll(() => getComputedStyle(toast).opacity).toBe("1");

      const home = toast.getBoundingClientRect();
      swipe(toast, drag);

      await expect.poll(() => toast.dataset.swipeDirection).toBe(drag);
      // The farthest it gets from where it sat, along and across the drag
      const sign = drag === "left" ? -1 : 1;
      let along = 0;
      let across = 0;
      await expect
        .poll(() => {
          if (toast.isConnected) {
            const box = toast.getBoundingClientRect();
            const dx = (box.left - home.left) * sign;
            const dy = (box.top - home.top) * sign;
            along = Math.max(along, drag === "down" ? dy : dx);
            across = Math.max(across, Math.abs(drag === "down" ? dx : dy));
          }
          return along;
        })
        // Its own extent along the drag, near enough
        .toBeGreaterThan((drag === "down" ? home.height : home.width) * 0.9);
      expect(across).toBeLessThan(1);
    });
  });

  it("keeps a toast dragged a way the caller left out", async () => {
    render(
      <Toast.Provider>
        <AddToast title="File saved" description="Saved" />
        <BaseToast.Viewport className="fixed right-4 bottom-4 w-[240px]">
          <RootList swipeDirection={["right"]} />
        </BaseToast.Viewport>
      </Toast.Provider>,
    );
    const toast = (await screen.findByRole("button", { name: "Undo" })).closest(
      ".Toast",
    ) as HTMLElement;
    await expect.poll(() => getComputedStyle(toast).opacity).toBe("1");

    swipe(toast, "left");
    // An absence window, as a toast that stays changes nothing to wait for. A swipe that
    // dismissed it would set data-swipe-direction and data-ending-style in the render after
    // pointerup, and take it off the page after the 300ms exit, so 600ms sees all three
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(toast.isConnected).toBe(true);
    expect(toast.dataset.swipeDirection).toBeUndefined();
    expect(toast.dataset.endingStyle).toBeUndefined();
  });

  describe.each(LAYOUTS)("$layout", (layout) => {
    // Past the viewport's inline end: from the right in LTR, from the left in RTL
    const expectEntersFromInlineEnd = ({ offset, width, opacity }: EnterStart) => {
      expect(opacity).toBe("0");
      expect(offset).toBeCloseTo(layout.dir === "ltr" ? width : -width, 0);
    };

    it("slides in from past the inline end", async () => {
      const enterStart = holdEnterOf("File saved");
      renderIn(
        layout,
        <Toast.Provider>
          <AddToast title="File saved" />
          <Toast.Viewport />
        </Toast.Provider>,
      );
      const toast = (await screen.findByText("File saved")).closest(".Toast") as HTMLElement;
      expectEntersFromInlineEnd(await enterStart(toast));
    });

    // Base UI gives a toast that leaves the limit no `data-starting-style`, and it was
    // `display: none`, so only `@starting-style` gives its transition a start
    it("slides a toast hidden past the limit in when a newer one closes", async () => {
      renderIn(
        layout,
        <Toast.Provider>
          <AddToasts count={5} />
          <Toast.Viewport />
        </Toast.Provider>,
      );
      const hidden = (await screen.findByText("Toast 2")).closest(".Toast") as HTMLElement;
      await expect.poll(() => getComputedStyle(hidden).display).toBe("none");
      const newest = (await screen.findByText("Toast 5")).closest(".Toast") as HTMLElement;

      // Armed only now, so a transition from mounting can't stand in for the one under test
      const enterStart = holdEnterOf("Toast 2");
      // Base UI hides the close button from assistive tech, so it has no accessible role
      await userEvent.click(within(newest).getByLabelText("Close"));
      expectEntersFromInlineEnd(await enterStart(hidden));
    });
  });
});

/** The first frame of a toast's enter transition, against the place where it comes to rest */
type EnterStart = { offset: number; width: number; opacity: string };

/**
 * Pauses the transitions of the toast titled `title` as they start, so the returned function can
 * rewind them to their first frame and measure it. Call before the toast shows.
 */
function holdEnterOf(title: string) {
  const held = new Set<CSSTransition>();
  const hold = (event: TransitionEvent) => {
    const toast = event.target as Element;
    if (!toast.classList.contains("Toast") || !toast.textContent?.includes(title)) return;
    for (const animation of toast.getAnimations()) {
      if (animation instanceof CSSTransition && !held.has(animation)) {
        animation.pause();
        held.add(animation);
      }
    }
  };
  document.addEventListener("transitionrun", hold, true);
  onTestFinished(() => document.removeEventListener("transitionrun", hold, true));

  return async (toast: HTMLElement): Promise<EnterStart> => {
    const properties = () => [...held].map((transition) => transition.transitionProperty).sort();
    await expect.poll(properties).toEqual(["opacity", "translate"]);
    for (const transition of held) transition.currentTime = 0;
    const start = toast.getBoundingClientRect().left;
    const { opacity } = getComputedStyle(toast);
    for (const transition of held) transition.finish();
    const rest = toast.getBoundingClientRect();
    return { offset: start - rest.left, width: rest.width, opacity };
  };
}

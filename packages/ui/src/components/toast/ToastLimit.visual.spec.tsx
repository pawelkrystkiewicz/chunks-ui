import { render, screen, within } from "@testing-library/react";
import { useEffect, useRef } from "react";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { Toast } from "./index";

/*
 * Base UI marks the toasts past the provider's `limit` (3 by default) with `data-limited` and
 * makes them inert. The default viewport must not show them as cards that can't be used.
 */

function AddToasts({ count, className }: { count: number; className?: string }) {
  const manager = Toast.useToast();
  const added = useRef(false);
  useEffect(() => {
    if (added.current) return;
    added.current = true;
    for (let i = 1; i <= count; i++) {
      manager.add({ title: `Toast ${i}`, dismissible: true, timeout: 0, className });
    }
  }, [manager, count, className]);
  return null;
}

const toastOf = (title: string) => screen.getByText(title).closest(".Toast") as HTMLElement;

/** Shown: laid out with a size, not hidden, not transparent. */
function shows(el: HTMLElement) {
  const { display, visibility, opacity } = getComputedStyle(el);
  const { width, height } = el.getBoundingClientRect();
  return display !== "none" && visibility !== "hidden" && opacity !== "0" && width * height > 0;
}

const TITLES = ["Toast 1", "Toast 2", "Toast 3", "Toast 4", "Toast 5"];

/** Titles of the toasts on screen; a closed toast is no longer in the document. */
const shownTitles = () =>
  TITLES.filter((title) => screen.queryByText(title) && shows(toastOf(title)));

describe("Toast past the limit", () => {
  it("shows only the newest three of five toasts", async () => {
    render(
      <Toast.Provider>
        <AddToasts count={5} />
        <Toast.Viewport />
      </Toast.Provider>,
    );
    await screen.findByText("Toast 5");
    await expect.poll(shownTitles).toEqual(["Toast 3", "Toast 4", "Toast 5"]);

    // The hidden ones take no space in the viewport either
    for (const title of ["Toast 1", "Toast 2"]) {
      const toast = toastOf(title);
      expect(toast.hasAttribute("data-limited")).toBe(true);
      expect(toast.getBoundingClientRect().height).toBe(0);
    }
  });

  it("shows a hidden toast again when a newer one closes", async () => {
    render(
      <Toast.Provider>
        <AddToasts count={5} />
        <Toast.Viewport />
      </Toast.Provider>,
    );
    await screen.findByText("Toast 5");
    await expect.poll(shownTitles).toEqual(["Toast 3", "Toast 4", "Toast 5"]);

    // Base UI hides the close button from assistive tech, so it has no accessible role
    await userEvent.click(within(toastOf("Toast 5")).getByLabelText("Close"));

    await expect.poll(shownTitles).toEqual(["Toast 2", "Toast 3", "Toast 4"]);
  });

  it("keeps the stack's own handling in the opt-in stacked viewport", async () => {
    render(
      <Toast.Provider>
        <AddToasts count={5} className="toast-stack" />
        <Toast.Viewport className="toast-stack-viewport" />
      </Toast.Provider>,
    );
    await screen.findByText("Toast 5");
    const limited = toastOf("Toast 1");
    await expect.poll(() => limited.hasAttribute("data-limited")).toBe(true);

    // The stack fades its limited toasts out in place instead
    const { display, opacity } = getComputedStyle(limited);
    expect(display).not.toBe("none");
    expect(opacity).toBe("0");
  });
});

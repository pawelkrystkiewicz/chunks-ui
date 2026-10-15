import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef, type ReactNode } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Drawer } from "../drawer";
import { FOCUS_RING } from "../shared";
import { Dialog } from "./index";

afterEach(cleanup);

// jsdom has no layout, so an element's content and box heights come from these attributes. The
// browser specs (OverlayBody.visual.spec.tsx) cover the real measurement.
const SCROLL = "data-scroll-height";
const CLIENT = "data-client-height";
const heightOf = (element: Element, attribute: string) =>
  Number(element.getAttribute(attribute) ?? 0);

/** Content taller than the box: the Body scrolls */
const tall = { [SCROLL]: 2000, [CLIENT]: 400 };
/** Content that fits: the Body does not scroll */
const short = { [SCROLL]: 400, [CLIENT]: 400 };

type Watched = { callback: ResizeObserverCallback; targets: Set<Element> };
/** What each live ResizeObserver watches, and its callback */
const observers = new Set<Watched>();

/** Notifies the observers that watch `target`, as the browser does after layout */
function resize(target: Element) {
  for (const watched of observers) {
    if (watched.targets.has(target)) watched.callback([], watched as unknown as ResizeObserver);
  }
}

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
    configurable: true,
    get(this: Element) {
      return heightOf(this, SCROLL);
    },
  });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get(this: Element) {
      return heightOf(this, CLIENT);
    },
  });
  globalThis.ResizeObserver = class {
    #watched: Watched;
    constructor(callback: ResizeObserverCallback) {
      this.#watched = { callback, targets: new Set() };
    }
    observe(target: Element) {
      this.#watched.targets.add(target);
      observers.add(this.#watched);
    }
    unobserve(target: Element) {
      this.#watched.targets.delete(target);
    }
    disconnect() {
      observers.delete(this.#watched);
    }
  };
});

afterAll(() => {
  Reflect.deleteProperty(HTMLElement.prototype, "scrollHeight");
  Reflect.deleteProperty(HTMLElement.prototype, "clientHeight");
  Reflect.deleteProperty(globalThis, "ResizeObserver");
});

/** Gives `element` the heights in `attributes`, then lets its ResizeObserver report the new box */
function setHeights(element: Element, attributes: Record<string, number>) {
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, String(value));
  }
  act(() => resize(element));
}

// Drawer parts are Dialog parts, so one suite serves both Bodies
const OVERLAYS = [
  { name: "Dialog.Body", X: Dialog, marker: "DialogBody" },
  { name: "Drawer.Body", X: Drawer, marker: "DrawerBody" },
] as const;

describe.each(OVERLAYS)("$name", ({ X, marker }) => {
  /** A Popup with `title`, `body` and a Cancel button after the Body */
  function renderBody(title: ReactNode, body: ReactNode) {
    return render(
      <X.Root open>
        <X.Portal>
          <X.Popup data-testid="popup">
            {title}
            {body}
            <X.Close>Cancel</X.Close>
          </X.Popup>
        </X.Portal>
      </X.Root>,
    );
  }

  it("renders with custom className and forwards ref; the Popup becomes a flex column", () => {
    const ref = createRef<HTMLElement>();
    renderBody(
      <X.Title>Terms</X.Title>,
      <X.Body ref={ref} className="custom" {...tall}>
        Text
      </X.Body>,
    );
    const body = screen.getByRole("region", { name: "Terms" });
    expect(body).toHaveClass("custom", marker, "overflow-y-auto", ...FOCUS_RING.split(" "));
    expect(body).toHaveAttribute("tabindex", "0");
    expect(ref.current).toBe(body);
    expect(screen.getByTestId("popup")).toHaveClass(
      `has-[>.${marker}]:flex`,
      `has-[>.${marker}]:flex-col`,
    );
  });

  it("is named by the Title when the Title has its own id", () => {
    renderBody(<X.Title id="terms-title">Terms</X.Title>, <X.Body>Text</X.Body>);
    expect(screen.getByRole("region", { name: "Terms" })).toHaveAttribute(
      "aria-labelledby",
      "terms-title",
    );
    expect(screen.getByRole("dialog", { name: "Terms" })).toBeInTheDocument();
  });

  it("takes the name passed to it over the Title", () => {
    renderBody(<X.Title>Terms</X.Title>, <X.Body aria-label="Terms text">Text</X.Body>);
    const body = screen.getByRole("region", { name: "Terms text" });
    expect(body).not.toHaveAttribute("aria-labelledby");
  });

  it("drops the name when the Title unmounts", () => {
    function Toggle({ title }: { title: boolean }) {
      return (
        <X.Root open>
          <X.Portal>
            <X.Popup aria-label="Terms">
              {title && <X.Title>Terms</X.Title>}
              <X.Body data-testid="body">Text</X.Body>
            </X.Popup>
          </X.Portal>
        </X.Root>
      );
    }
    const { rerender } = render(<Toggle title />);
    expect(screen.getByTestId("body")).toHaveAttribute("aria-labelledby");
    rerender(<Toggle title={false} />);
    expect(screen.getByTestId("body")).not.toHaveAttribute("aria-labelledby");
  });

  it("is a tab stop only while its content overflows", () => {
    renderBody(<X.Title>Terms</X.Title>, <X.Body {...short}>Text</X.Body>);
    const body = screen.getByRole("region", { name: "Terms" });
    expect(body).not.toHaveAttribute("tabindex");

    // The viewport shrinks, or the content grows: the box reports its new size
    setHeights(body, tall);
    expect(body).toHaveAttribute("tabindex", "0");

    setHeights(body, short);
    expect(body).not.toHaveAttribute("tabindex");
  });

  it("takes the initial focus when it overflows and nothing tabbable comes before it", async () => {
    let nameAtFocus: string | null | undefined;
    renderBody(
      <X.Title>Terms</X.Title>,
      <X.Body
        onFocus={(e) => (nameAtFocus = e.currentTarget.getAttribute("aria-labelledby"))}
        {...tall}
      >
        Text
      </X.Body>,
    );
    await waitFor(() => expect(screen.getByRole("region", { name: "Terms" })).toHaveFocus());
    // Named by the time it takes the focus
    expect(nameAtFocus).toBeTruthy();
  });

  it("leaves the initial focus to the first action when its content fits", async () => {
    renderBody(<X.Title>Terms</X.Title>, <X.Body {...short}>Text</X.Body>);
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus());
  });

  it("has no a11y violations", async () => {
    const { container } = renderBody(
      <>
        <X.Title>Terms</X.Title>
        <X.Description>Read before you accept.</X.Description>
      </>,
      <X.Body {...tall}>
        <p>Text</p>
      </X.Body>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

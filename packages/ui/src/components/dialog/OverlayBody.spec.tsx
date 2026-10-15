import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef, type FormEvent, type ReactNode, useState } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Drawer } from "../drawer";
import { FOCUS_RING } from "../shared";
import { Dialog } from "./index";

afterEach(cleanup);

// jsdom has no layout, so an element's content and box sizes come from these attributes; in a
// hidden popup (`keepMounted`, before it opens) they are 0, as in the browser. The browser specs
// (OverlayBody.visual.spec.tsx) cover the real measurement.
const SCROLL = "data-scroll-height";
const CLIENT = "data-client-height";
const SCROLL_WIDTH = "data-scroll-width";
const CLIENT_WIDTH = "data-client-width";
const sizeOf = (element: Element, attribute: string) =>
  element.closest("[hidden]") ? 0 : Number(element.getAttribute(attribute) ?? 0);

/** Content taller than the box: the Body scrolls */
const tall = { [SCROLL]: 2000, [CLIENT]: 400 };
/** Content that fits: the Body does not scroll */
const short = { [SCROLL]: 400, [CLIENT]: 400 };
/** Content wider than the box, and no taller: the Body scrolls sideways */
const wide = { ...short, [SCROLL_WIDTH]: 800, [CLIENT_WIDTH]: 400 };

type Watched = { callback: ResizeObserverCallback; targets: Set<Element> };
/** What each live ResizeObserver watches, and its callback */
const observers = new Set<Watched>();
/** How many ResizeObservers were created so far */
let created = 0;
/** Whether a live ResizeObserver watches `target` */
const isObserved = (target: Element) => [...observers].some((w) => w.targets.has(target));

/** Notifies the observers that watch `target`, as the browser does after layout */
function resize(target: Element) {
  for (const watched of observers) {
    if (watched.targets.has(target)) watched.callback([], watched as unknown as ResizeObserver);
  }
}

const SIZES = {
  scrollHeight: SCROLL,
  clientHeight: CLIENT,
  scrollWidth: SCROLL_WIDTH,
  clientWidth: CLIENT_WIDTH,
};

beforeAll(() => {
  for (const [property, attribute] of Object.entries(SIZES)) {
    Object.defineProperty(HTMLElement.prototype, property, {
      configurable: true,
      get(this: Element) {
        return sizeOf(this, attribute);
      },
    });
  }
  globalThis.ResizeObserver = class {
    #watched: Watched;
    constructor(callback: ResizeObserverCallback) {
      created++;
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
      // As in the browser, a disconnected observer watches nothing until it observes again
      this.#watched.targets.clear();
      observers.delete(this.#watched);
    }
  };
});

afterAll(() => {
  for (const property of Object.keys(SIZES))
    Reflect.deleteProperty(HTMLElement.prototype, property);
  Reflect.deleteProperty(globalThis, "ResizeObserver");
});

/** Gives `element` the sizes in `attributes`; no observer reports them */
function setSizes(element: Element, attributes: Record<string, number>) {
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, String(value));
  }
}

/** Gives `element` the sizes in `attributes`, then lets its ResizeObserver report the new box */
function setHeights(element: Element, attributes: Record<string, number>) {
  setSizes(element, attributes);
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

  it("takes the name on the render element over the Title", () => {
    renderBody(
      <X.Title>New task</X.Title>,
      <X.Body render={<form aria-label="Task fields" />}>
        <input aria-label="Title" />
      </X.Body>,
    );
    const body = screen.getByRole("form", { name: "Task fields" });
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

  it("is a tab stop only while its content overflows, and stays focusable when it fits", () => {
    renderBody(<X.Title>Terms</X.Title>, <X.Body {...short}>Text</X.Body>);
    const body = screen.getByRole("region", { name: "Terms" });
    expect(body).toHaveAttribute("tabindex", "-1");

    // The viewport shrinks, or the content grows: the box reports its new size
    setHeights(body, tall);
    expect(body).toHaveAttribute("tabindex", "0");

    setHeights(body, short);
    expect(body).toHaveAttribute("tabindex", "-1");
  });

  it("is a tab stop while its content overflows sideways", () => {
    renderBody(<X.Title>Terms</X.Title>, <X.Body {...wide}>Text</X.Body>);
    expect(screen.getByRole("region", { name: "Terms" })).toHaveAttribute("tabindex", "0");
  });

  it("stays a tab stop when its ref never arrives, so nothing measures it", () => {
    // A render function that drops the ref: the Body never gets its node, and fails closed
    renderBody(
      <X.Title>Terms</X.Title>,
      <X.Body render={({ ref: _ref, ...props }) => <section {...props} />} {...short}>
        Text
      </X.Body>,
    );
    expect(screen.getByRole("region", { name: "Terms" })).toHaveAttribute("tabindex", "0");
  });

  it("measures again when a child grows on its own, without a render of the Body", () => {
    // In a side drawer the Body is `flex-1`: the box is the same whatever the content, so only the
    // child reports that it grew
    renderBody(
      <X.Title>Terms</X.Title>,
      <X.Body {...short}>
        <img alt="" data-testid="child" />
      </X.Body>,
    );
    const body = screen.getByRole("region", { name: "Terms" });
    setSizes(body, tall);
    act(() => resize(screen.getByTestId("child")));
    expect(body).toHaveAttribute("tabindex", "0");
  });

  it("measures again when a child renders more content into it", async () => {
    function Filling() {
      const [count, setCount] = useState(1);
      const lines = Array.from({ length: count }, (_, i) => `Line ${i + 1}`);
      return (
        <>
          <button type="button" onClick={() => setCount(50)}>
            Fill
          </button>
          {lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </>
      );
    }
    renderBody(
      <X.Title>Terms</X.Title>,
      <X.Body {...short}>
        <Filling />
      </X.Body>,
    );
    const body = screen.getByRole("region", { name: "Terms" });
    expect(body).toHaveAttribute("tabindex", "-1");
    expect(isObserved(screen.getByText("Line 1"))).toBe(true);

    // The content grows and the sizes are `tall` now, but no observer has reported them: the
    // Body's own render did not run, only its mutation observer sees the new children
    setSizes(body, tall);
    fireEvent.click(screen.getByRole("button", { name: "Fill" }));
    await waitFor(() => expect(body).toHaveAttribute("tabindex", "0"));

    // The new children are observed too, so one that grows on its own is reported. `short` first,
    // so the flip below comes from the report of the new child alone
    const newLine = screen.getByText("Line 50");
    expect(isObserved(newLine)).toBe(true);
    setSizes(body, short);
    act(() => resize(newLine));
    expect(body).toHaveAttribute("tabindex", "-1");
    setSizes(body, tall);
    act(() => resize(newLine));
    expect(body).toHaveAttribute("tabindex", "0");
  });

  it("creates one observer per node, and releases it on unmount", () => {
    const popup = (className: string) => (
      <X.Root open>
        <X.Portal>
          <X.Popup>
            <X.Title>Terms</X.Title>
            <X.Body className={className} {...short}>
              Text
            </X.Body>
          </X.Popup>
        </X.Portal>
      </X.Root>
    );
    const { rerender } = render(popup("a"));
    const [live, made] = [observers.size, created];
    expect(live).toBeGreaterThan(0);

    // A render of the Body neither creates nor leaves an observer behind
    rerender(popup("b"));
    rerender(popup("c"));
    expect(observers.size).toBe(live);
    expect(created).toBe(made);

    cleanup();
    expect(observers.size).toBe(0);
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

  it("takes the initial focus when a keepMounted popup opens from its Trigger", async () => {
    // The Body mounts hidden and measures no overflow; the open renders the popup, not the Body
    render(
      <X.Root>
        <X.Trigger>Open</X.Trigger>
        <X.Portal keepMounted>
          <X.Popup>
            <X.Title>Terms</X.Title>
            <X.Body data-testid="body" {...tall}>
              Text
            </X.Body>
            <X.Close>Cancel</X.Close>
          </X.Popup>
        </X.Portal>
      </X.Root>,
    );
    const body = screen.getByTestId("body");
    expect(body).toHaveAttribute("tabindex", "-1");
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    await waitFor(() => expect(body).toHaveFocus());
    expect(body).toHaveAttribute("tabindex", "0");
  });

  it("leaves the initial focus to the first action when its content fits", async () => {
    renderBody(<X.Title>Terms</X.Title>, <X.Body {...short}>Text</X.Body>);
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus());
  });

  it("renders as a form through render, which a button outside it submits", () => {
    const onSubmit = vi.fn((e: FormEvent) => e.preventDefault());
    render(
      <X.Root open>
        <X.Portal>
          <X.Popup>
            <X.Title>New task</X.Title>
            <X.Body
              render={<form id="new-task" onSubmit={onSubmit} />}
              className="custom"
              {...tall}
            >
              <input aria-label="Title" />
            </X.Body>
            <div>
              <X.Close>Cancel</X.Close>
              <button type="submit" form="new-task">
                Create
              </button>
            </div>
          </X.Popup>
        </X.Portal>
      </X.Root>,
    );
    // The form is the Body: named by the Title, with the scroll region, its marker and its tab stop
    const body = screen.getByRole("form", { name: "New task" });
    expect(body.tagName).toBe("FORM");
    expect(body).toHaveClass("custom", marker, "overflow-y-auto");
    expect(body).toHaveAttribute("tabindex", "0");
    expect(body).toContainElement(screen.getByRole("textbox", { name: "Title" }));

    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
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

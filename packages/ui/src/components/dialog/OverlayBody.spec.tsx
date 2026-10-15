import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef, type FormEvent, type ReactNode, useState } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
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
    for (const [name, value] of Object.entries(tall)) body.setAttribute(name, String(value));
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
    for (const [name, value] of Object.entries(tall)) body.setAttribute(name, String(value));
    fireEvent.click(screen.getByRole("button", { name: "Fill" }));
    await waitFor(() => expect(body).toHaveAttribute("tabindex", "0"));
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

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FOCUS_RING } from "chunks-ui-core";
import { configureAxe } from "jest-axe";
import { createRef, type FormEvent, type ReactElement, type ReactNode, useState } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { undecided } from "../../AxeTest.utils";
import { Drawer } from "../drawer";
import { Dialog } from "./index";

afterEach(cleanup);

// aria-hidden-focus skips Base UI's focus guards, aria-hidden spans that hand focus on when Tab
// reaches them. A browser's axe leaves them for review, as it takes the open dialog for a modal.
// Here axe runs while the popup is still at opacity 0 and can't hit-test the backdrop, so it
// finds no modal and flags them. The rule still checks every other aria-hidden node. Base UI
// also aria-hides the page outside a modal dialog, so a trigger rendered beside the open dialog
// fails the same way; these audits leave it out. Were axe to find a modal, it would leave a stray
// focusable aria-hidden node in `incomplete`, which toHaveNoViolations() does not read, so the
// audits also check that the rule left nothing there
const axe = configureAxe({
  globalOptions: {
    rules: [
      { id: "aria-hidden-focus", selector: '[aria-hidden="true"]:not([data-base-ui-focus-guard])' },
    ],
  },
});

// jsdom has no layout, so an element's content and box sizes come from these attributes; in a
// hidden popup (`keepMounted`, before it opens) they are 0, as in the browser. The browser specs
// (OverlayBody.visual.spec.tsx) cover the real measurement.
const SIZES = {
  scrollHeight: "data-scroll-height",
  clientHeight: "data-client-height",
  scrollWidth: "data-scroll-width",
  clientWidth: "data-client-width",
};
const {
  scrollHeight: SCROLL,
  clientHeight: CLIENT,
  scrollWidth: SCROLL_WIDTH,
  clientWidth: CLIENT_WIDTH,
} = SIZES;
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
    disconnect() {
      // As in the browser, a disconnected observer watches nothing until it observes again
      this.#watched.targets.clear();
      observers.delete(this.#watched);
    }
    // The hook never calls `unobserve`, so the fake leaves it out
  } as unknown as typeof ResizeObserver;
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

/** A Popup with `title`, `body` and a Cancel button after the Body: a Dialog's, or `X`'s */
function renderBody(title: ReactNode, body: ReactNode, X: typeof Dialog | typeof Drawer = Dialog) {
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

// The Popup and the Title are each overlay's own; the Body is one component, tested on Dialog
const OVERLAYS = [
  { name: "Dialog", X: Dialog },
  { name: "Drawer", X: Drawer },
] as const;

describe.each(OVERLAYS)("$name around a Body", ({ X }) => {
  it("makes the Popup a flex column", () => {
    renderBody(<X.Title>Terms</X.Title>, <X.Body>Text</X.Body>, X);
    expect(screen.getByTestId("popup")).toHaveClass(
      "has-[>.OverlayBody]:flex",
      "has-[>.OverlayBody]:flex-col",
    );
  });

  it("names the Body by its Title", () => {
    renderBody(<X.Title>Terms</X.Title>, <X.Body>Text</X.Body>, X);
    expect(screen.getByRole("region", { name: "Terms" })).toBeInTheDocument();
  });
});

describe("Body", () => {
  it("renders with custom className and forwards ref", () => {
    const ref = createRef<HTMLElement>();
    renderBody(
      <Dialog.Title>Terms</Dialog.Title>,
      <Dialog.Body ref={ref} className="custom" {...tall}>
        Text
      </Dialog.Body>,
    );
    const body = screen.getByRole("region", { name: "Terms" });
    expect(body).toHaveClass("custom", "OverlayBody", "overflow-y-auto", ...FOCUS_RING.split(" "));
    expect(body).toHaveAttribute("tabindex", "0");
    expect(ref.current).toBe(body);
  });

  it("is named by the Title when the Title has its own id", () => {
    renderBody(
      <Dialog.Title id="terms-title">Terms</Dialog.Title>,
      <Dialog.Body>Text</Dialog.Body>,
    );
    expect(screen.getByRole("region", { name: "Terms" })).toHaveAttribute(
      "aria-labelledby",
      "terms-title",
    );
    expect(screen.getByRole("dialog", { name: "Terms" })).toBeInTheDocument();
  });

  it("takes the name passed to it over the Title", () => {
    renderBody(
      <Dialog.Title>Terms</Dialog.Title>,
      <Dialog.Body aria-label="Terms text">Text</Dialog.Body>,
    );
    const body = screen.getByRole("region", { name: "Terms text" });
    expect(body).not.toHaveAttribute("aria-labelledby");
  });

  it("takes the name on the render element over the Title", () => {
    renderBody(
      <Dialog.Title>New task</Dialog.Title>,
      <Dialog.Body render={<form aria-label="Task fields" />}>
        <input aria-label="Title" />
      </Dialog.Body>,
    );
    const body = screen.getByRole("form", { name: "Task fields" });
    expect(body).not.toHaveAttribute("aria-labelledby");
  });

  it("drops the name when the Title unmounts", () => {
    function Toggle({ title }: { title: boolean }) {
      return (
        <Dialog.Root open>
          <Dialog.Portal>
            <Dialog.Popup aria-label="Terms">
              {title && <Dialog.Title>Terms</Dialog.Title>}
              <Dialog.Body data-testid="body">Text</Dialog.Body>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      );
    }
    const { rerender } = render(<Toggle title />);
    expect(screen.getByTestId("body")).toHaveAttribute("aria-labelledby");
    rerender(<Toggle title={false} />);
    expect(screen.getByTestId("body")).not.toHaveAttribute("aria-labelledby");
  });

  it("is a tab stop only while its content overflows, and stays focusable when it fits", () => {
    renderBody(<Dialog.Title>Terms</Dialog.Title>, <Dialog.Body {...short}>Text</Dialog.Body>);
    const body = screen.getByRole("region", { name: "Terms" });
    expect(body).toHaveAttribute("tabindex", "-1");

    // The viewport shrinks, or the content grows: the box reports its new size
    setSizes(body, tall);
    act(() => resize(body));
    expect(body).toHaveAttribute("tabindex", "0");

    setSizes(body, short);
    act(() => resize(body));
    expect(body).toHaveAttribute("tabindex", "-1");
  });

  it("is a tab stop while its content overflows sideways", () => {
    renderBody(<Dialog.Title>Terms</Dialog.Title>, <Dialog.Body {...wide}>Text</Dialog.Body>);
    expect(screen.getByRole("region", { name: "Terms" })).toHaveAttribute("tabindex", "0");
  });

  it("has data-overflowing while its content overflows, and drops it when it fits", () => {
    renderBody(<Dialog.Title>Terms</Dialog.Title>, <Dialog.Body {...tall}>Text</Dialog.Body>);
    const body = screen.getByRole("region", { name: "Terms" });
    expect(body).toHaveAttribute("data-overflowing", "");

    setSizes(body, short);
    act(() => resize(body));
    expect(body).not.toHaveAttribute("data-overflowing");

    setSizes(body, tall);
    act(() => resize(body));
    expect(body).toHaveAttribute("data-overflowing", "");
  });

  it("stays a tab stop when its ref never arrives, so nothing measures it", () => {
    // A render function that drops the ref: the Body never gets its node, and fails closed
    renderBody(
      <Dialog.Title>Terms</Dialog.Title>,
      <Dialog.Body render={({ ref: _ref, ...props }) => <section {...props} />} {...short}>
        Text
      </Dialog.Body>,
    );
    const body = screen.getByRole("region", { name: "Terms" });
    expect(body).toHaveAttribute("tabindex", "0");
    // Unmeasured is not overflowing: the attribute reports a measurement, the tab stop fails closed
    expect(body).not.toHaveAttribute("data-overflowing");
  });

  it("measures again when a child grows on its own, without a render of the Body", () => {
    // In a side drawer the Body is `flex-1`: the box is the same whatever the content, so only the
    // child reports that it grew
    renderBody(
      <Dialog.Title>Terms</Dialog.Title>,
      <Dialog.Body {...short}>
        <img alt="" data-testid="child" />
      </Dialog.Body>,
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
      <Dialog.Title>Terms</Dialog.Title>,
      <Dialog.Body {...short}>
        <Filling />
      </Dialog.Body>,
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
      <Dialog.Root open>
        <Dialog.Portal>
          <Dialog.Popup>
            <Dialog.Title>Terms</Dialog.Title>
            <Dialog.Body className={className} {...short}>
              Text
            </Dialog.Body>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
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
      <Dialog.Title>Terms</Dialog.Title>,
      <Dialog.Body
        onFocus={(e) => (nameAtFocus = e.currentTarget.getAttribute("aria-labelledby"))}
        {...tall}
      >
        Text
      </Dialog.Body>,
    );
    await waitFor(() => expect(screen.getByRole("region", { name: "Terms" })).toHaveFocus());
    // Named by the time it takes the focus
    expect(nameAtFocus).toBeTruthy();
  });

  it("takes the initial focus when a keepMounted popup opens from its Trigger", async () => {
    // The Body mounts hidden and measures no overflow; the open renders the popup, not the Body
    render(
      <Dialog.Root>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Portal keepMounted>
          <Dialog.Popup>
            <Dialog.Title>Terms</Dialog.Title>
            <Dialog.Body data-testid="body" {...tall}>
              Text
            </Dialog.Body>
            <Dialog.Close>Cancel</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    const body = screen.getByTestId("body");
    expect(body).toHaveAttribute("tabindex", "-1");
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    await waitFor(() => expect(body).toHaveFocus());
    expect(body).toHaveAttribute("tabindex", "0");
  });

  it("leaves the initial focus to the first action when its content fits", async () => {
    renderBody(<Dialog.Title>Terms</Dialog.Title>, <Dialog.Body {...short}>Text</Dialog.Body>);
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus());
  });

  it("renders as a form through render, which a button outside it submits", () => {
    const onSubmit = vi.fn((e: FormEvent) => e.preventDefault());
    render(
      <Dialog.Root open>
        <Dialog.Portal>
          <Dialog.Popup>
            <Dialog.Title>New task</Dialog.Title>
            <Dialog.Body
              render={<form id="new-task" onSubmit={onSubmit} />}
              className="custom"
              {...tall}
            >
              <input aria-label="Title" />
            </Dialog.Body>
            <div>
              <Dialog.Close>Cancel</Dialog.Close>
              <button type="submit" form="new-task">
                Create
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    // The form is the Body: named by the Title, with the scroll region, its class and its tab stop
    const body = screen.getByRole("form", { name: "New task" });
    expect(body.tagName).toBe("FORM");
    expect(body).toHaveClass("custom", "OverlayBody", "overflow-y-auto");
    expect(body).toHaveAttribute("tabindex", "0");
    expect(body).toContainElement(screen.getByRole("textbox", { name: "Title" }));

    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  describe("role on a render element", () => {
    it("gives a div role=region, so the Title's name is exposed", async () => {
      renderBody(
        <Dialog.Title>Terms</Dialog.Title>,
        <Dialog.Body render={<div />}>Text</Dialog.Body>,
      );
      const body = screen.getByRole("region", { name: "Terms" });
      expect(body.tagName).toBe("DIV");
      // The popup is portalled into the body, outside the container RTL hands back
      const results = await axe(document.body);
      expect(results).toHaveNoViolations();
      expect(undecided(results, "aria-hidden-focus")).toEqual([]);
    });

    it("gives a div returned by a function render role=region", () => {
      renderBody(
        <Dialog.Title>Terms</Dialog.Title>,
        <Dialog.Body render={(props) => <div {...props} />}>Text</Dialog.Body>,
      );
      const body = screen.getByRole("region", { name: "Terms" });
      expect(body.tagName).toBe("DIV");
      // jsdom has no layout, so the Body reads as fitting only if its ref survived the wrapper
      expect(body).toHaveAttribute("tabindex", "-1");
    });

    it("leaves a form, which has a role of its own, without one", () => {
      renderBody(
        <Dialog.Title>New task</Dialog.Title>,
        <Dialog.Body render={<form />}>Text</Dialog.Body>,
      );
      expect(screen.getByRole("form", { name: "New task" })).not.toHaveAttribute("role");
    });

    it("leaves a form returned by a function render without a role, though its props could carry one", () => {
      renderBody(
        <Dialog.Title>New task</Dialog.Title>,
        <Dialog.Body render={(props) => <form {...props} />}>Text</Dialog.Body>,
      );
      expect(screen.getByRole("form", { name: "New task" })).not.toHaveAttribute("role");
    });

    it("reads the name of a lazy render element, so its aria-label wins over the Title", () => {
      // The Flight client hands over `{ $$typeof: react.lazy, _payload, _init }` in place of the
      // element; React's own children logic reads it through `_init`
      const lazy = {
        $$typeof: Symbol.for("react.lazy"),
        // biome-ignore lint/a11y/useAriaPropsSupportedByRole: a generic div, which the Body gives the region role
        _payload: <div aria-label="Notes" />,
        _init: (payload: ReactElement) => payload,
      } as unknown as ReactElement;
      renderBody(<Dialog.Title>Terms</Dialog.Title>, <Dialog.Body render={lazy}>Text</Dialog.Body>);
      expect(screen.getByRole("region", { name: "Notes" })).toBeInTheDocument();
    });

    it("gives a div named by an aria-label on the Body the role, with no Title", () => {
      renderBody(
        null,
        <Dialog.Body aria-label="Notes" render={<div />}>
          Text
        </Dialog.Body>,
      );
      expect(screen.getByRole("region", { name: "Notes" })).toHaveAttribute("role", "region");
    });

    // A region must have a name: with none it is a generic element, and a role would only add noise
    it("gives an unnamed div no role", () => {
      renderBody(null, <Dialog.Body render={<div data-testid="body" />}>Text</Dialog.Body>);
      expect(screen.getByTestId("body")).not.toHaveAttribute("role");
    });

    it("gives an unnamed div returned by a function render no role", () => {
      renderBody(
        null,
        <Dialog.Body render={(props) => <div data-testid="body" {...props} />}>Text</Dialog.Body>,
      );
      expect(screen.getByTestId("body")).not.toHaveAttribute("role");
    });

    it("still warns about a component passed as a function render", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      // Named like a component, as Base UI checks: `render={MyBodyRender}` calls it as a function
      function MyBodyRender(props: object) {
        return <div {...props} />;
      }
      try {
        // Named by its label, so the wrapper is in place from the first render: the Title's id
        // arrives only after it, and Base UI warns once per message
        renderBody(
          null,
          <Dialog.Body aria-label="Terms" render={MyBodyRender}>
            Text
          </Dialog.Body>,
        );
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("`MyBodyRender`"));
      } finally {
        warn.mockRestore();
      }
    });

    // The specs use role="note" for another role on a <div>: Biome's `useSemanticElements` flags
    // role="region" on one
    it("keeps a role set on the render element", () => {
      renderBody(
        <Dialog.Title>Terms</Dialog.Title>,
        <Dialog.Body render={<div role="note" />}>Text</Dialog.Body>,
      );
      expect(screen.getByRole("note", { name: "Terms" })).toBeInTheDocument();
      expect(screen.queryByRole("region")).toBeNull();
    });

    it("gives a span the role", () => {
      renderBody(
        <Dialog.Title>Terms</Dialog.Title>,
        <Dialog.Body render={<span />}>Text</Dialog.Body>,
      );
      const body = screen.getByRole("region", { name: "Terms" });
      expect(body.tagName).toBe("SPAN");
    });

    it("keeps a role set on the Body for a div returned by a function render", () => {
      renderBody(
        <Dialog.Title>Terms</Dialog.Title>,
        <Dialog.Body role="note" render={(props) => <div {...props} />}>
          Text
        </Dialog.Body>,
      );
      expect(screen.getByRole("note", { name: "Terms" })).toBeInTheDocument();
      expect(screen.queryByRole("region")).toBeNull();
    });

    it("keeps a role set on the Body", () => {
      renderBody(
        <Dialog.Title>Terms</Dialog.Title>,
        <Dialog.Body role="note" render={<div />}>
          Text
        </Dialog.Body>,
      );
      expect(screen.getByRole("note", { name: "Terms" })).toBeInTheDocument();
      expect(screen.queryByRole("region")).toBeNull();
    });
  });

  it("has no a11y violations", async () => {
    renderBody(
      <>
        <Dialog.Title>Terms</Dialog.Title>
        <Dialog.Description>Read before you accept.</Dialog.Description>
      </>,
      <Dialog.Body {...tall}>
        <p>Text</p>
      </Dialog.Body>,
    );
    // The popup is portalled into the body, outside the container RTL hands back
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
    expect(undecided(results, "aria-hidden-focus")).toEqual([]);
  });
});

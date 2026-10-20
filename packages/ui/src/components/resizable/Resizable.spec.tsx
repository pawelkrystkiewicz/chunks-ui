import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ResizableLayout } from "../../lib/resizable";
import { Resizable } from "./Resizable";
import type { ResizableGroupProps } from "./ResizableGroup";

// jsdom has no layout: the group measures 1000 x 500, everything else 0 x 0 (handles take no space)
const GROUP = { width: 1000, height: 500 };
const rect = (width: number, height: number) =>
  ({
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }) as DOMRect;

/** Every live observer, so a spec can tell the browser's "an element resized" */
const observers = new Set<{ callback: ResizeObserverCallback; targets: Set<Element> }>();
function resized(target: Element) {
  act(() => {
    for (const { callback, targets } of observers) {
      if (targets.has(target)) callback([{ target } as ResizeObserverEntry], {} as ResizeObserver);
    }
  });
}

beforeAll(() => {
  globalThis.ResizeObserver = class {
    #watch: { callback: ResizeObserverCallback; targets: Set<Element> };
    constructor(callback: ResizeObserverCallback) {
      this.#watch = { callback, targets: new Set() };
      observers.add(this.#watch);
    }
    observe(target: Element) {
      this.#watch.targets.add(target);
    }
    unobserve(target: Element) {
      this.#watch.targets.delete(target);
    }
    disconnect() {
      observers.delete(this.#watch);
    }
  };
});
afterAll(() => {
  delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
});

beforeEach(() => {
  GROUP.width = 1000;
  // jsdom has no pointer capture; a browser grants it for a live pointer
  Object.assign(HTMLElement.prototype, { setPointerCapture: () => {} });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.getAttribute("role") === "group" && this.dataset.testGroup !== undefined
      ? rect(GROUP.width, GROUP.height)
      : rect(0, 0);
  });
});
afterEach(() => {
  cleanup();
  delete (HTMLElement.prototype as { setPointerCapture?: unknown }).setPointerCapture;
  vi.restoreAllMocks();
  document.body.removeAttribute("style");
});

type Props = Partial<ResizableGroupProps>;

function Split(props: Props) {
  return (
    <Resizable.Group aria-label="Split" data-test-group="" {...props}>
      <Resizable.Panel id="side" defaultSize="30%" minSize="10%" maxSize="60%">
        Side
      </Resizable.Panel>
      <Resizable.Handle aria-label="Resize side" />
      <Resizable.Panel id="main" defaultSize="70%">
        Main
      </Resizable.Panel>
    </Resizable.Group>
  );
}

const handle = () => screen.getByRole("separator");
/** The DOM id of the panel whose layout key is `key` */
const panelId = (key: string) => document.querySelector(`[data-panel-id="${key}"]`)?.id;
const valueNow = () => handle().getAttribute("aria-valuenow");

describe("Resizable structure and ARIA", () => {
  it("renders a group, two panels and a separator", () => {
    render(<Split />);
    expect(screen.getByRole("group", { name: "Split" })).toBeInTheDocument();
    expect(screen.getByText("Side")).toHaveAttribute("data-panel-id", "side");
    expect(screen.getByText("Main")).toHaveAttribute("data-panel-id", "main");
    expect(handle()).toBeInTheDocument();
  });

  it("gives the handle the window splitter attributes", () => {
    render(<Split />);
    expect(handle()).toHaveAttribute("tabindex", "0");
    expect(handle()).toHaveAttribute("aria-orientation", "vertical");
    expect(handle()).toHaveAttribute("aria-valuenow", "30");
    expect(handle()).toHaveAttribute("aria-valuemin", "10");
    expect(handle()).toHaveAttribute("aria-valuemax", "60");
    expect(handle()).toHaveAttribute("aria-controls", `${panelId("side")} ${panelId("main")}`);
    expect(handle()).toHaveAttribute("data-orientation", "vertical");
  });

  it("keeps the layout key out of the DOM id, so two groups can reuse a name", () => {
    render(
      <>
        <Split />
        <Split />
      </>,
    );
    const ids = [...document.querySelectorAll("[data-panel-id]")].map((el) => el.id);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
    for (const id of ids) expect(id).not.toBe("side");
    const [first, second] = screen.getAllByRole("separator");
    // Each handle points at the panels of its own group
    expect(first?.getAttribute("aria-controls")).not.toBe(second?.getAttribute("aria-controls"));
    for (const separator of [first, second]) {
      for (const id of separator?.getAttribute("aria-controls")?.split(" ") ?? []) {
        expect(separator?.parentElement?.contains(document.getElementById(id))).toBe(true);
      }
    }
  });

  it("gives the separator of a vertical group a horizontal orientation", () => {
    render(<Split orientation="vertical" />);
    expect(handle()).toHaveAttribute("aria-orientation", "horizontal");
    expect(handle()).toHaveAttribute("data-orientation", "horizontal");
    expect(screen.getByRole("group")).toHaveAttribute("data-orientation", "vertical");
  });

  it("has no a11y violations", async () => {
    const { container } = render(<Split />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no a11y violations when vertical, disabled and nested", async () => {
    const { container } = render(
      <Resizable.Group orientation="vertical" aria-label="Outer">
        <Resizable.Panel id="top" defaultSize="50%">
          <Split />
        </Resizable.Panel>
        <Resizable.Handle disabled aria-label="Resize rows" />
        <Resizable.Panel id="bottom" defaultSize="50%">
          Bottom
        </Resizable.Panel>
      </Resizable.Group>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("merges className and forwards refs", () => {
    const groupRef = createRef<HTMLDivElement>();
    const panelRef = createRef<HTMLDivElement>();
    const handleRef = createRef<HTMLDivElement>();
    render(
      <Resizable.Group ref={groupRef} className="g-custom" aria-label="x">
        <Resizable.Panel id="a" ref={panelRef} className="p-custom">
          A
        </Resizable.Panel>
        <Resizable.Handle ref={handleRef} className="h-custom" aria-label="r" />
        <Resizable.Panel id="b">B</Resizable.Panel>
      </Resizable.Group>,
    );
    expect(groupRef.current).toHaveClass("g-custom");
    expect(panelRef.current).toHaveClass("p-custom");
    expect(handleRef.current).toHaveClass("h-custom");
    expect(handleRef.current).toBe(handle());
  });
});

describe("Resizable layout at first render", () => {
  it("writes each panel's size as the fallback of its CSS variable in the server HTML", () => {
    const html = renderToString(<Split defaultLayout={{ side: 25, main: 75 }} />);
    expect(html).toContain("var(--resizable-side, 25)");
    expect(html).toContain("var(--resizable-main, 75)");
  });

  it("falls back to the panel's defaultSize without a defaultLayout", () => {
    const html = renderToString(<Split />);
    expect(html).toContain("var(--resizable-side, 30)");
  });

  it("gives a panel without a defaultSize what the others leave, in the server HTML", () => {
    const html = renderToString(
      <Resizable.Group>
        <Resizable.Panel id="side" defaultSize="30%">
          Side
        </Resizable.Panel>
        <Resizable.Handle />
        <Resizable.Panel id="main">Main</Resizable.Panel>
      </Resizable.Group>,
    );
    expect(html).toContain("var(--resizable-main, 70)");
  });

  it("finds panels inside a fragment for that too", () => {
    const html = renderToString(
      <Resizable.Group>
        {/* biome-ignore lint/complexity/noUselessFragments: the fragment is what the test looks through */}
        <>
          <Resizable.Panel id="side" defaultSize="25%">
            Side
          </Resizable.Panel>
          <Resizable.Handle />
        </>
        <Resizable.Panel id="main">Main</Resizable.Panel>
      </Resizable.Group>,
    );
    expect(html).toContain("var(--resizable-main, 75)");
  });

  it("uses a px panel's unit in the server HTML", () => {
    const html = renderToString(
      <Resizable.Group>
        <Resizable.Panel id="nav" defaultSize={240}>
          Nav
        </Resizable.Panel>
        <Resizable.Handle />
        <Resizable.Panel id="main">Main</Resizable.Panel>
      </Resizable.Group>,
    );
    expect(html).toMatch(/flex:0 0 var\(--resizable-nav, 240px\)/);
  });

  it("keeps the handle out of the tab order in the server HTML, until it has its values", () => {
    expect(renderToString(<Split />)).not.toContain("tabindex");
  });

  it("ignores a stored value that is not a size", () => {
    const html = renderToString(<Split defaultLayout={{ side: Number.NaN, main: -4 }} />);
    expect(html).toContain("var(--resizable-side, 30)");
    expect(html).toContain("var(--resizable-main, 70)");
  });

  it("sets the variables on the group once mounted, from defaultLayout", () => {
    render(<Split defaultLayout={{ side: 25, main: 75 }} />);
    const group = screen.getByRole("group");
    expect(group.style.getPropertyValue("--resizable-side")).toBe("25");
    expect(group.style.getPropertyValue("--resizable-main")).toBe("75");
    expect(valueNow()).toBe("25");
  });

  it("normalises a defaultLayout that does not sum to 100", () => {
    render(<Split defaultLayout={{ side: 10, main: 10 }} />);
    expect(screen.getByRole("group").style.getPropertyValue("--resizable-side")).toBe("50");
  });

  it("drops ids that match no panel", () => {
    render(<Split defaultLayout={{ side: 40, main: 60, ghost: 5 }} />);
    expect(screen.getByRole("group").style.getPropertyValue("--resizable-ghost")).toBe("");
  });

  it("uses px for a px panel and shares the rest between % panels", () => {
    render(
      <Resizable.Group data-test-group="" aria-label="x">
        <Resizable.Panel id="nav" defaultSize={200}>
          Nav
        </Resizable.Panel>
        <Resizable.Handle aria-label="r1" />
        <Resizable.Panel id="a" defaultSize="50%">
          A
        </Resizable.Panel>
        <Resizable.Handle aria-label="r2" />
        <Resizable.Panel id="b" defaultSize="50%">
          B
        </Resizable.Panel>
      </Resizable.Group>,
    );
    const group = screen.getByRole("group");
    expect(group.style.getPropertyValue("--resizable-nav")).toBe("200px");
    expect(group.style.getPropertyValue("--resizable-a")).toBe("50");
    const [first, second] = screen.getAllByRole("separator");
    expect(first).toHaveAttribute("aria-valuenow", "20");
    expect(second).toHaveAttribute("aria-valuenow", "40");
    expect(first).toHaveAttribute("aria-controls", `${panelId("nav")} ${panelId("a")}`);
    expect(second).toHaveAttribute("aria-controls", `${panelId("a")} ${panelId("b")}`);
  });
});

describe("Resizable keyboard", () => {
  it("steps the neighbours 1% per arrow key and reports each step once", async () => {
    const onLayoutChange = vi.fn();
    const user = userEvent.setup();
    render(<Split onLayoutChange={onLayoutChange} />);
    handle().focus();
    await user.keyboard("{ArrowRight}");
    expect(onLayoutChange).toHaveBeenCalledTimes(1);
    expect(onLayoutChange).toHaveBeenLastCalledWith({ side: 31, main: 69 });
    expect(valueNow()).toBe("31");
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(onLayoutChange).toHaveBeenCalledTimes(3);
    expect(onLayoutChange).toHaveBeenLastCalledWith({ side: 29, main: 71 });
  });

  it("steps 10% with Shift", async () => {
    const onLayoutChange = vi.fn();
    const user = userEvent.setup();
    render(<Split onLayoutChange={onLayoutChange} />);
    handle().focus();
    await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
    expect(onLayoutChange).toHaveBeenLastCalledWith({ side: 40, main: 60 });
  });

  it("sends Home and End to the limits", async () => {
    const onLayoutChange = vi.fn();
    const user = userEvent.setup();
    render(<Split onLayoutChange={onLayoutChange} />);
    handle().focus();
    await user.keyboard("{End}");
    expect(onLayoutChange).toHaveBeenLastCalledWith({ side: 60, main: 40 });
    await user.keyboard("{Home}");
    expect(onLayoutChange).toHaveBeenLastCalledWith({ side: 10, main: 90 });
    expect(valueNow()).toBe("10");
  });

  it("says nothing when a key can't move the handle", async () => {
    const onLayoutChange = vi.fn();
    const user = userEvent.setup();
    render(<Split onLayoutChange={onLayoutChange} defaultLayout={{ side: 60, main: 40 }} />);
    handle().focus();
    await user.keyboard("{ArrowRight}{End}");
    expect(onLayoutChange).not.toHaveBeenCalled();
  });

  it("ignores keys of the other axis and other keys", async () => {
    const onLayoutChange = vi.fn();
    const user = userEvent.setup();
    render(<Split onLayoutChange={onLayoutChange} />);
    handle().focus();
    await user.keyboard("{ArrowDown}{ArrowUp}a{Enter}");
    expect(onLayoutChange).not.toHaveBeenCalled();
  });

  it("uses the vertical arrows in a vertical group", async () => {
    const onLayoutChange = vi.fn();
    const user = userEvent.setup();
    render(<Split orientation="vertical" onLayoutChange={onLayoutChange} />);
    handle().focus();
    await user.keyboard("{ArrowRight}");
    expect(onLayoutChange).not.toHaveBeenCalled();
    await user.keyboard("{ArrowDown}");
    expect(onLayoutChange).toHaveBeenLastCalledWith({ side: 31, main: 69 });
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(onLayoutChange).toHaveBeenLastCalledWith({ side: 29, main: 71 });
  });

  it("flips the horizontal arrows in RTL", async () => {
    const onLayoutChange = vi.fn();
    const user = userEvent.setup();
    render(<Split style={{ direction: "rtl" }} onLayoutChange={onLayoutChange} />);
    handle().focus();
    await user.keyboard("{ArrowRight}");
    expect(onLayoutChange).toHaveBeenLastCalledWith({ side: 29, main: 71 });
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(onLayoutChange).toHaveBeenLastCalledWith({ side: 31, main: 69 });
  });

  it("keeps the vertical arrows as they are in RTL", async () => {
    const onLayoutChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Split orientation="vertical" style={{ direction: "rtl" }} onLayoutChange={onLayoutChange} />,
    );
    handle().focus();
    await user.keyboard("{ArrowDown}");
    expect(onLayoutChange).toHaveBeenLastCalledWith({ side: 31, main: 69 });
  });

  it("moves only the two neighbours of the handle", async () => {
    const onLayoutChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Resizable.Group data-test-group="" aria-label="x" onLayoutChange={onLayoutChange}>
        <Resizable.Panel id="a" defaultSize="20%">
          A
        </Resizable.Panel>
        <Resizable.Handle aria-label="r1" />
        <Resizable.Panel id="b" defaultSize="30%">
          B
        </Resizable.Panel>
        <Resizable.Handle aria-label="r2" />
        <Resizable.Panel id="c" defaultSize="50%">
          C
        </Resizable.Panel>
      </Resizable.Group>,
    );
    screen.getByRole("separator", { name: "r2" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(onLayoutChange).toHaveBeenLastCalledWith({ a: 20, b: 31, c: 49 });
  });

  it("respects a px min on a % panel", async () => {
    const onLayoutChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Resizable.Group data-test-group="" aria-label="x" onLayoutChange={onLayoutChange}>
        <Resizable.Panel id="a" defaultSize="50%" minSize={400}>
          A
        </Resizable.Panel>
        <Resizable.Handle aria-label="r1" />
        <Resizable.Panel id="b" defaultSize="50%">
          B
        </Resizable.Panel>
      </Resizable.Group>,
    );
    handle().focus();
    await user.keyboard("{Home}");
    expect(onLayoutChange).toHaveBeenLastCalledWith({ a: 40, b: 60 });
    expect(handle()).toHaveAttribute("aria-valuemin", "40");
  });
});

describe("Resizable callbacks", () => {
  it("does not call onLayoutChange on mount or when re-rendered", () => {
    const onLayoutChange = vi.fn();
    const { rerender } = render(<Split onLayoutChange={onLayoutChange} />);
    rerender(<Split onLayoutChange={onLayoutChange} />);
    expect(onLayoutChange).not.toHaveBeenCalled();
  });

  it("follows the group's size without calling onLayoutChange when it is resized", () => {
    const onLayoutChange = vi.fn();
    render(
      <Resizable.Group data-test-group="" aria-label="x" onLayoutChange={onLayoutChange}>
        <Resizable.Panel id="nav" defaultSize={200}>
          Nav
        </Resizable.Panel>
        <Resizable.Handle aria-label="r" />
        <Resizable.Panel id="main">Main</Resizable.Panel>
      </Resizable.Group>,
    );
    expect(valueNow()).toBe("20");
    GROUP.width = 500;
    resized(screen.getByRole("group"));
    GROUP.width = 1000;
    expect(valueNow()).toBe("40");
    expect(onLayoutChange).not.toHaveBeenCalled();
  });

  it("passes the whole layout, each value in its panel's unit", async () => {
    const onLayoutChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Resizable.Group data-test-group="" aria-label="x" onLayoutChange={onLayoutChange}>
        <Resizable.Panel id="nav" defaultSize={200}>
          Nav
        </Resizable.Panel>
        <Resizable.Handle aria-label="r1" />
        <Resizable.Panel id="main">Main</Resizable.Panel>
      </Resizable.Group>,
    );
    handle().focus();
    await user.keyboard("{ArrowRight}");
    expect(onLayoutChange).toHaveBeenLastCalledWith({ nav: 210, main: 100 });
  });
});

describe("Resizable controlled layout", () => {
  it("shows the layout prop and reports a change without applying it", async () => {
    const onLayoutChange = vi.fn();
    const user = userEvent.setup();
    render(<Split layout={{ side: 40, main: 60 }} onLayoutChange={onLayoutChange} />);
    expect(valueNow()).toBe("40");
    handle().focus();
    await user.keyboard("{ArrowRight}");
    expect(onLayoutChange).toHaveBeenLastCalledWith({ side: 41, main: 59 });
    expect(valueNow()).toBe("40");
    expect(screen.getByRole("group").style.getPropertyValue("--resizable-side")).toBe("40");
  });

  it("follows the parent when it accepts the change", async () => {
    const user = userEvent.setup();
    function Parent() {
      const [layout, setLayout] = useState<ResizableLayout>({ side: 40, main: 60 });
      return <Split layout={layout} onLayoutChange={setLayout} />;
    }
    render(<Parent />);
    handle().focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(valueNow()).toBe("42");
    expect(screen.getByRole("group").style.getPropertyValue("--resizable-side")).toBe("42");
  });

  it("follows a new layout prop", () => {
    const { rerender } = render(<Split layout={{ side: 40, main: 60 }} />);
    rerender(<Split layout={{ side: 20, main: 80 }} />);
    expect(valueNow()).toBe("20");
    expect(screen.getByRole("group").style.getPropertyValue("--resizable-main")).toBe("80");
  });

  it("puts the sizes back when onLayoutChange throws, and lets the error through", () => {
    const errors: unknown[] = [];
    // React reports an error thrown in an event handler to the window; catch it here
    const onError = (event: ErrorEvent) => {
      event.preventDefault();
      errors.push(event.error);
    };
    window.addEventListener("error", onError);
    try {
      render(
        <Split
          layout={{ side: 40, main: 60 }}
          onLayoutChange={() => {
            throw new Error("boom");
          }}
        />,
      );
      fireEvent.pointerDown(handle(), { button: 0, pointerId: 1, clientX: 400, clientY: 0 });
      fireEvent.pointerMove(handle(), { pointerId: 1, clientX: 500, clientY: 0 });
      expect(valueNow()).toBe("50");
      fireEvent.pointerUp(handle(), { pointerId: 1 });
    } finally {
      window.removeEventListener("error", onError);
    }
    expect(errors).toEqual([new Error("boom")]);
    // The preview is gone: the DOM shows the layout the parent holds
    expect(valueNow()).toBe("40");
    expect(screen.getByRole("group").style.getPropertyValue("--resizable-side")).toBe("40");
    expect(screen.getByRole("group").style.getPropertyValue("--resizable-main")).toBe("60");
    expect(handle()).not.toHaveAttribute("data-dragging");
    expect(document.body.style.userSelect).toBe("");
  });

  it("sanitizes a layout prop that is out of range", () => {
    render(<Split layout={{ side: 99, main: 1 }} />);
    // side has a 60% max, so the 99/1 split is brought inside it, still adding up to 100
    expect(valueNow()).toBe("60");
    const group = screen.getByRole("group");
    expect(group.style.getPropertyValue("--resizable-side")).toBe("60");
    expect(group.style.getPropertyValue("--resizable-main")).toBe("40");
    // The first render reads the same sizes as the fallback of each panel's variable
    const side = document.querySelector<HTMLElement>('[data-panel-id="side"]');
    expect(side?.getAttribute("style")).toContain("var(--resizable-side, 60)");
  });
});

describe("Resizable disabled handle", () => {
  it("is not tabbable, says it is disabled and ignores keys", async () => {
    const onLayoutChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Resizable.Group data-test-group="" aria-label="x" onLayoutChange={onLayoutChange}>
        <Resizable.Panel id="a">A</Resizable.Panel>
        <Resizable.Handle disabled aria-label="r" />
        <Resizable.Panel id="b">B</Resizable.Panel>
      </Resizable.Group>,
    );
    expect(handle()).not.toHaveAttribute("tabindex");
    expect(handle()).toHaveAttribute("aria-disabled", "true");
    expect(handle()).toHaveAttribute("data-disabled");
    fireEvent.keyDown(handle(), { key: "ArrowRight" });
    await user.keyboard("{ArrowRight}");
    expect(onLayoutChange).not.toHaveBeenCalled();
  });
});

describe("Resizable nesting", () => {
  it("renders a group inside a panel, each with its own handle", async () => {
    const outer = vi.fn();
    const inner = vi.fn();
    const user = userEvent.setup();
    render(
      <Resizable.Group data-test-group="" aria-label="outer" onLayoutChange={outer}>
        <Resizable.Panel id="left" defaultSize="40%">
          Left
        </Resizable.Panel>
        <Resizable.Handle aria-label="outer handle" />
        <Resizable.Panel id="right" defaultSize="60%">
          <Resizable.Group
            orientation="vertical"
            aria-label="inner"
            data-test-group=""
            onLayoutChange={inner}
          >
            <Resizable.Panel id="top" defaultSize="50%">
              Top
            </Resizable.Panel>
            <Resizable.Handle aria-label="inner handle" />
            <Resizable.Panel id="bottom" defaultSize="50%">
              Bottom
            </Resizable.Panel>
          </Resizable.Group>
        </Resizable.Panel>
      </Resizable.Group>,
    );
    expect(screen.getByRole("separator", { name: "outer handle" })).toHaveAttribute(
      "aria-controls",
      `${panelId("left")} ${panelId("right")}`,
    );
    const innerHandle = screen.getByRole("separator", { name: "inner handle" });
    expect(innerHandle).toHaveAttribute("aria-controls", `${panelId("top")} ${panelId("bottom")}`);
    innerHandle.focus();
    await user.keyboard("{ArrowDown}");
    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
  });
});

describe("Resizable programmer errors", () => {
  it("warns about a duplicate id and keeps rendering", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Resizable.Group aria-label="x">
        <Resizable.Panel id="a">A</Resizable.Panel>
        <Resizable.Handle aria-label="r" />
        <Resizable.Panel id="a">B</Resizable.Panel>
      </Resizable.Group>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/duplicate/i));
    expect(screen.getAllByRole("separator")).toHaveLength(1);
  });

  it("warns about a missing id and falls back to a generated one", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Resizable.Group aria-label="x">
        {/* @ts-expect-error id is required */}
        <Resizable.Panel>A</Resizable.Panel>
        <Resizable.Handle aria-label="r" />
        <Resizable.Panel id="b">B</Resizable.Panel>
      </Resizable.Group>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/needs a stable `id`/));
    expect(handle().getAttribute("aria-controls")?.split(" ")).toHaveLength(2);
  });

  it("warns about min above max and keeps rendering", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Resizable.Group aria-label="x">
        <Resizable.Panel id="a" minSize={300} maxSize={100}>
          A
        </Resizable.Panel>
        <Resizable.Handle aria-label="r" />
        <Resizable.Panel id="b">B</Resizable.Panel>
      </Resizable.Group>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/maxSize/));
  });

  it("keeps a handle with no neighbours out of the tab order, with no a11y violations", async () => {
    const { container } = render(
      <Resizable.Group aria-label="x">
        <Resizable.Handle aria-label="before" />
        <Resizable.Panel id="a">A</Resizable.Panel>
        <Resizable.Handle aria-label="after" />
      </Resizable.Group>,
    );
    for (const separator of screen.getAllByRole("separator")) {
      expect(separator).not.toHaveAttribute("tabindex");
      expect(separator).not.toHaveAttribute("aria-valuenow");
    }
    expect(await axe(container)).toHaveNoViolations();
  });

  it("keeps the handle of a px group out of the tab order while the group is unmeasured", async () => {
    // No size mocks: jsdom has no layout, so the group never measures, as in a consumer's own test
    const { container } = render(
      <Resizable.Group aria-label="x">
        <Resizable.Panel id="nav" defaultSize={240}>
          Nav
        </Resizable.Panel>
        <Resizable.Handle aria-label="Resize nav" />
        <Resizable.Panel id="main">Main</Resizable.Panel>
      </Resizable.Group>,
    );
    expect(handle()).not.toHaveAttribute("tabindex");
    expect(handle()).not.toHaveAttribute("aria-valuenow");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("makes the handle of a px group a tab stop once the group has been measured", () => {
    GROUP.width = 0;
    render(
      <Resizable.Group data-test-group="" aria-label="x">
        <Resizable.Panel id="nav" defaultSize={200}>
          Nav
        </Resizable.Panel>
        <Resizable.Handle aria-label="r" />
        <Resizable.Panel id="main">Main</Resizable.Panel>
      </Resizable.Group>,
    );
    expect(handle()).not.toHaveAttribute("tabindex");
    expect(handle()).not.toHaveAttribute("aria-valuenow");
    GROUP.width = 1000;
    resized(screen.getByRole("group"));
    expect(handle()).toHaveAttribute("tabindex", "0");
    expect(valueNow()).toBe("20");
  });

  it("renders a handle with no neighbours as an inert separator", async () => {
    const onLayoutChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Resizable.Group aria-label="x" onLayoutChange={onLayoutChange}>
        <Resizable.Panel id="a">A</Resizable.Panel>
        <Resizable.Handle aria-label="r" />
      </Resizable.Group>,
    );
    handle().focus();
    await user.keyboard("{ArrowRight}{End}");
    expect(onLayoutChange).not.toHaveBeenCalled();
  });
});

describe("Resizable body lock", () => {
  it("keeps the lock of a dragging handle when an idle one unmounts", () => {
    const Two = ({ idle }: { idle: boolean }) => (
      <Resizable.Group data-test-group="" aria-label="x">
        <Resizable.Panel id="a" defaultSize="30%">
          A
        </Resizable.Panel>
        <Resizable.Handle aria-label="first" />
        <Resizable.Panel id="b" defaultSize="30%">
          B
        </Resizable.Panel>
        {idle && <Resizable.Handle aria-label="idle" />}
        <Resizable.Panel id="c" defaultSize="40%">
          C
        </Resizable.Panel>
      </Resizable.Group>
    );
    const { rerender } = render(<Two idle />);
    fireEvent.pointerDown(screen.getByRole("separator", { name: "first" }), {
      button: 0,
      pointerId: 1,
      clientX: 300,
    });
    expect(document.body.style.userSelect).toBe("none");
    rerender(<Two idle={false} />);
    expect(screen.queryByRole("separator", { name: "idle" })).not.toBeInTheDocument();
    expect(document.body.style.userSelect).toBe("none");
    fireEvent.pointerUp(screen.getByRole("separator", { name: "first" }), { pointerId: 1 });
    expect(document.body.style.userSelect).toBe("");
  });
});

describe("Resizable drag ending", () => {
  const down = () =>
    fireEvent.pointerDown(handle(), { button: 0, pointerId: 1, clientX: 300, clientY: 0 });

  it("treats a failed pointer capture as no drag: keys and later drags still work", async () => {
    Object.assign(HTMLElement.prototype, {
      setPointerCapture: () => {
        throw new DOMException("gone", "NotFoundError");
      },
    });
    const onLayoutChange = vi.fn();
    const user = userEvent.setup();
    render(<Split onLayoutChange={onLayoutChange} />);
    down();
    expect(document.body.style.userSelect).toBe("");
    expect(handle()).not.toHaveAttribute("data-dragging");
    handle().focus();
    await user.keyboard("{ArrowRight}");
    expect(onLayoutChange).toHaveBeenLastCalledWith({ side: 31, main: 69 });
    // A later pointerdown is not ignored: with capture working again it starts a drag
    Object.assign(HTMLElement.prototype, { setPointerCapture: () => {} });
    down();
    expect(handle()).toHaveAttribute("data-dragging");
    fireEvent.pointerUp(handle(), { pointerId: 1 });
  });

  it("puts the sizes back on lostpointercapture without a pointerup, and reports nothing", () => {
    const onLayoutChange = vi.fn();
    render(<Split onLayoutChange={onLayoutChange} />);
    down();
    fireEvent.pointerMove(handle(), { pointerId: 1, clientX: 400, clientY: 0 });
    expect(valueNow()).toBe("40");
    fireEvent.lostPointerCapture(handle(), { pointerId: 1 });
    expect(valueNow()).toBe("30");
    expect(onLayoutChange).not.toHaveBeenCalled();
    expect(handle()).not.toHaveAttribute("data-dragging");
    expect(document.body.style.userSelect).toBe("");
  });
});

describe("Resizable in StrictMode", () => {
  it("registers once, reports nothing extra and cleans up the body lock", async () => {
    const onLayoutChange = vi.fn();
    const user = userEvent.setup();
    const { unmount } = render(
      <StrictMode>
        <Split onLayoutChange={onLayoutChange} />
      </StrictMode>,
    );
    expect(screen.getAllByRole("separator")).toHaveLength(1);
    expect(onLayoutChange).not.toHaveBeenCalled();
    expect(valueNow()).toBe("30");
    expect(handle().getAttribute("aria-controls")?.split(" ")).toHaveLength(2);
    expect(document.querySelector<HTMLElement>("[data-panel-id=side]")?.style.cssText).toContain(
      "30",
    );
    handle().focus();
    await user.keyboard("{ArrowRight}");
    expect(onLayoutChange).toHaveBeenCalledTimes(1);
    expect(onLayoutChange).toHaveBeenLastCalledWith({ side: 31, main: 69 });
    expect(valueNow()).toBe("31");
    fireEvent.pointerDown(handle(), { button: 0, pointerId: 1, clientX: 300 });
    expect(document.body.style.userSelect).toBe("none");
    unmount();
    expect(document.body.style.userSelect).toBe("");
    expect(onLayoutChange).toHaveBeenCalledTimes(1);
  });
});

describe("Resizable.Grip", () => {
  const WithGrip = (props: React.ComponentProps<typeof Resizable.Grip>) => (
    <Resizable.Group data-test-group="" aria-label="x">
      <Resizable.Panel id="a" defaultSize="50%">
        A
      </Resizable.Panel>
      <Resizable.Handle aria-label="Resize a">
        <Resizable.Grip data-testid="grip" {...props} />
      </Resizable.Handle>
      <Resizable.Panel id="b">B</Resizable.Panel>
    </Resizable.Group>
  );

  it("renders inside the handle, hidden from assistive technology", () => {
    render(<WithGrip />);
    const grip = screen.getByTestId("grip");
    expect(handle()).toContainElement(grip);
    expect(grip).toHaveAttribute("aria-hidden", "true");
    expect(grip).not.toHaveAttribute("tabindex");
    expect(grip).toHaveClass("pointer-events-none");
  });

  it("stays out of the tab order", async () => {
    const user = userEvent.setup();
    render(<WithGrip />);
    await user.tab();
    expect(handle()).toHaveFocus();
    await user.tab();
    expect(screen.getByTestId("grip")).not.toHaveFocus();
  });

  it("merges className, passes props through and keeps aria-hidden", () => {
    render(<WithGrip className="grip-custom" title="drag" aria-hidden={false} />);
    const grip = screen.getByTestId("grip");
    expect(grip).toHaveClass("grip-custom", "pointer-events-none");
    expect(grip).toHaveAttribute("title", "drag");
    expect(grip).toHaveAttribute("aria-hidden", "true");
  });

  it("lets a class replace a library one", () => {
    render(<WithGrip className="rounded-full" />);
    expect(screen.getByTestId("grip")).toHaveClass("rounded-full");
    expect(screen.getByTestId("grip")).not.toHaveClass("rounded-md");
  });

  it("leaves the handle's name and values alone", () => {
    render(<WithGrip />);
    expect(screen.getByRole("separator", { name: "Resize a" })).toHaveAttribute(
      "aria-valuenow",
      "50",
    );
  });

  it("has no a11y violations", async () => {
    const { container } = render(<WithGrip />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, useState } from "react";
import { renderToString } from "react-dom/server";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Layout } from "../../lib/resizable";
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
const valueNow = () => handle().getAttribute("aria-valuenow");

describe("Resizable structure and ARIA", () => {
  it("renders a group, two panels and a separator", () => {
    render(<Split />);
    expect(screen.getByRole("group", { name: "Split" })).toBeInTheDocument();
    expect(screen.getByText("Side")).toHaveAttribute("id", "side");
    expect(screen.getByText("Main")).toHaveAttribute("id", "main");
    expect(handle()).toBeInTheDocument();
  });

  it("gives the handle the window splitter attributes", () => {
    render(<Split />);
    expect(handle()).toHaveAttribute("tabindex", "0");
    expect(handle()).toHaveAttribute("aria-orientation", "vertical");
    expect(handle()).toHaveAttribute("aria-valuenow", "30");
    expect(handle()).toHaveAttribute("aria-valuemin", "10");
    expect(handle()).toHaveAttribute("aria-valuemax", "60");
    expect(handle()).toHaveAttribute("aria-controls", "side main");
    expect(handle()).toHaveAttribute("data-orientation", "vertical");
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
  it("writes each panel's size as a CSS variable in the server HTML", () => {
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

  it("ignores a stored value that is not a size", () => {
    const html = renderToString(<Split defaultLayout={{ side: Number.NaN, main: -4 }} />);
    expect(html).toContain("var(--resizable-side, 30)");
    expect(html).toContain("var(--resizable-main, 70)");
  });

  it("renders without touching window", () => {
    const html = renderToString(<Split />);
    expect(html).toContain('data-orientation="horizontal"');
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
    expect(first).toHaveAttribute("aria-controls", "nav a");
    expect(second).toHaveAttribute("aria-controls", "a b");
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
      const [layout, setLayout] = useState<Layout>({ side: 40, main: 60 });
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

  it("sanitizes a layout prop that is out of range", () => {
    render(<Split layout={{ side: 99, main: 1 }} />);
    // the group measures 1000px, so the 60% max shows
    expect(Number(valueNow())).toBeLessThanOrEqual(60);
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
      "left right",
    );
    const innerHandle = screen.getByRole("separator", { name: "inner handle" });
    expect(innerHandle).toHaveAttribute("aria-controls", "top bottom");
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

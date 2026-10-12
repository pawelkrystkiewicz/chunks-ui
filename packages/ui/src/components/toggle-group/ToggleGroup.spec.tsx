import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, useState } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { reloadMotion } from "../../lib/use-motion";
import { ToggleGroup } from "./ToggleGroup";

/** The elements each live ResizeObserver watches, and its callback */
const observers = new Map<
  ResizeObserver,
  { callback: ResizeObserverCallback; targets: Set<Element> }
>();

/**
 * Notifies the observers that watch `target`, as the browser does after layout and before it
 * paints. jsdom has no layout, so the browser specs cover when that happens.
 */
function resize(target: Element) {
  for (const [observer, { callback, targets }] of observers) {
    if (targets.has(target)) callback([], observer);
  }
}

/** Boxes set by a test; any other element measures 40×24 at the origin */
const boxes = new Map<Element, DOMRect>();

beforeAll(() => {
  globalThis.ResizeObserver = class {
    #watched: { callback: ResizeObserverCallback; targets: Set<Element> };
    constructor(callback: ResizeObserverCallback) {
      this.#watched = { callback, targets: new Set() };
    }
    observe(target: Element) {
      this.#watched.targets.add(target);
      observers.set(this, this.#watched);
    }
    unobserve(target: Element) {
      this.#watched.targets.delete(target);
    }
    disconnect() {
      observers.delete(this);
    }
  };
  // jsdom has no layout, so every element measures 0×0, as in a group hidden with display:none,
  // where the indicator unmounts. Give elements a box, as a browser shows them.
  HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    return boxes.get(this) ?? new DOMRect(0, 0, 40, 24);
  };
});

afterEach(() => {
  cleanup();
  boxes.clear();
});

describe("ToggleGroup", () => {
  it("renders Root and Items", () => {
    render(
      <ToggleGroup.Root data-testid="root">
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
        <ToggleGroup.Item value="b">B</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    expect(screen.getByTestId("root")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("merges custom className on Root", () => {
    render(<ToggleGroup.Root className="custom" data-testid="root" />);
    expect(screen.getByTestId("root")).toHaveClass("custom");
  });

  it("merges custom className on Item", () => {
    render(
      <ToggleGroup.Root>
        <ToggleGroup.Item value="a" className="custom">
          A
        </ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    expect(screen.getByRole("button")).toHaveClass("custom");
  });

  it("supports single selection mode by default", async () => {
    const user = userEvent.setup();
    render(
      <ToggleGroup.Root>
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
        <ToggleGroup.Item value="b">B</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    const btnA = screen.getByText("A");
    const btnB = screen.getByText("B");

    await user.click(btnA);
    expect(btnA).toHaveAttribute("aria-pressed", "true");
    expect(btnB).toHaveAttribute("aria-pressed", "false");

    await user.click(btnB);
    expect(btnA).toHaveAttribute("aria-pressed", "false");
    expect(btnB).toHaveAttribute("aria-pressed", "true");
  });

  it("supports multiple selection mode", async () => {
    const user = userEvent.setup();
    render(
      <ToggleGroup.Root multiple>
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
        <ToggleGroup.Item value="b">B</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    const btnA = screen.getByText("A");
    const btnB = screen.getByText("B");

    await user.click(btnA);
    await user.click(btnB);
    expect(btnA).toHaveAttribute("aria-pressed", "true");
    expect(btnB).toHaveAttribute("aria-pressed", "true");
  });

  it("disables all items when disabled", () => {
    render(
      <ToggleGroup.Root disabled>
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
        <ToggleGroup.Item value="b">B</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    for (const btn of screen.getAllByRole("button")) {
      expect(btn).toBeDisabled();
    }
  });

  it("calls onValueChange when selection changes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ToggleGroup.Root onValueChange={onValueChange}>
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    await user.click(screen.getByText("A"));
    expect(onValueChange).toHaveBeenCalled();
  });

  it("syncs to externally controlled value", () => {
    const { rerender } = render(
      <ToggleGroup.Root value={["a"]}>
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
        <ToggleGroup.Item value="b">B</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    rerender(
      <ToggleGroup.Root value={["b"]}>
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
        <ToggleGroup.Item value="b">B</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    expect(screen.getByText("B")).toHaveAttribute("aria-pressed", "true");
  });

  it("renders CSS indicator after single-select", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ToggleGroup.Root>
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    await user.click(screen.getByText("A"));
    expect(container.querySelector("span.absolute.z-0")).toBeInTheDocument();
  });

  it("forwards a ref on Root to the group, and still shows the indicator", async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <ToggleGroup.Root ref={ref}>
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    expect(ref.current).toBe(screen.getByRole("group"));
    await user.click(screen.getByText("A"));
    expect(container.querySelector("span.absolute.z-0")).toBeInTheDocument();
  });

  it("forwards a ref on Item to its button, and still shows the indicator when it is selected", async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLButtonElement>();
    const { container } = render(
      <ToggleGroup.Root>
        <ToggleGroup.Item value="a" ref={ref}>
          A
        </ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    expect(ref.current).toBe(screen.getByRole("button"));
    await user.click(screen.getByText("A"));
    expect(container.querySelector("span.absolute.z-0")).toBeInTheDocument();
  });

  it("renders Root through a consumer's render element", () => {
    render(
      <ToggleGroup.Root render={<nav data-probe="" />}>
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    const group = screen.getByRole("group");
    expect(group.tagName).toBe("NAV");
    expect(group).toHaveAttribute("data-probe");
    // Base UI >=1.6 leaves aria-orientation off role="group"; guard that it doesn't come back
    // through `render`
    expect(group).not.toHaveAttribute("aria-orientation");
  });

  it("passes Root's state to a consumer's render function", () => {
    render(
      <ToggleGroup.Root
        orientation="vertical"
        render={(props, state) => <nav {...props} data-probe={state.orientation} />}
      >
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    const group = screen.getByRole("group");
    expect(group.tagName).toBe("NAV");
    expect(group).toHaveAttribute("data-probe", "vertical");
    // Base UI >=1.6 leaves aria-orientation off role="group"; guard that it doesn't come back
    // through `render`
    expect(group).not.toHaveAttribute("aria-orientation");
  });

  it("keeps the indicator when onValueChange cancels deselecting the pressed item", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ToggleGroup.Root
        onValueChange={(value, details) => {
          if (!value.length) details.cancel();
        }}
      >
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    const button = screen.getByRole("button");
    await user.click(button);
    expect(container.querySelector("span.absolute.z-0")).toBeInTheDocument();

    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelector("span.absolute.z-0")).toBeInTheDocument();
  });

  it("deregisters Item on unmount", () => {
    const { rerender } = render(
      <ToggleGroup.Root>
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    expect(() => rerender(<ToggleGroup.Root />)).not.toThrow();
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <ToggleGroup.Root>
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
        <ToggleGroup.Item value="b">B</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("allows controlled mode to reject empty selection", async () => {
    const user = userEvent.setup();

    function ControlledToggleGroup() {
      const [value, setValue] = useState(["a"]);
      return (
        <ToggleGroup.Root
          value={value}
          onValueChange={(newValue) => {
            // Reject empty selection
            if (newValue.length > 0) setValue(newValue);
          }}
        >
          <ToggleGroup.Item value="a">A</ToggleGroup.Item>
          <ToggleGroup.Item value="b">B</ToggleGroup.Item>
        </ToggleGroup.Root>
      );
    }

    render(<ControlledToggleGroup />);
    const btnA = screen.getByText("A");

    expect(btnA).toHaveAttribute("aria-pressed", "true");

    // Click selected item to deselect — should be rejected
    await user.click(btnA);
    expect(btnA).toHaveAttribute("aria-pressed", "true");
  });
});

describe("ToggleGroup indicator measurement", () => {
  // Motion never arrives, so the CSS fallback renders the indicator's box inline, and a test can
  // read it from the span as soon as React commits
  beforeAll(() => {
    void reloadMotion(new Promise(() => {}));
  });
  afterAll(() => reloadMotion());

  const px = (left: number, top: number, width: number, height: number) => ({
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
  });

  /**
   * A controlled group of items A and B with nothing pressed, then A pressed. The group is at
   * (10, 0) and A at (14, 4), so the indicator is at (4, 4) within the group.
   */
  function renderPressed() {
    const ui = (value: string[]) => (
      <ToggleGroup.Root value={value}>
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
        <ToggleGroup.Item value="b">B</ToggleGroup.Item>
      </ToggleGroup.Root>
    );
    const { rerender } = render(ui([]));
    const group = screen.getByRole("group");
    const items = {
      a: screen.getByRole("button", { name: "A" }),
      b: screen.getByRole("button", { name: "B" }),
    };
    boxes.set(group, new DOMRect(10, 0, 100, 32));
    boxes.set(items.a, new DOMRect(14, 4, 40, 24));
    boxes.set(items.b, new DOMRect(56, 4, 50, 24));
    const press = (value: "a" | "b") => rerender(ui([value]));
    press("a");
    /** The box written on the indicator; null without one */
    const indicator = () => {
      const span = group.querySelector<HTMLElement>(":scope > span");
      if (!span) return null;
      const { left, top, width, height } = span.style;
      return { left, top, width, height };
    };
    expect(indicator()).toEqual(px(4, 4, 40, 24));
    return { group, items, press, indicator };
  }

  /** Runs `notify` as a browser does, outside act(), where React schedules its own updates */
  function outsideAct(notify: () => void) {
    const env = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
    const previous = env.IS_REACT_ACT_ENVIRONMENT;
    env.IS_REACT_ACT_ENVIRONMENT = false;
    try {
      notify();
    } finally {
      env.IS_REACT_ACT_ENVIRONMENT = previous;
    }
  }

  const frames = (count: number) =>
    act(async () => {
      for (let i = 0; i < count; i++) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
    });

  // Items register before the group measures, so the indicator needs no resize notification
  it("shows the indicator over the default item without a resize notification", () => {
    render(
      <ToggleGroup.Root defaultValue={["a"]}>
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
        <ToggleGroup.Item value="b">B</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    const span = screen.getByRole("group").querySelector<HTMLElement>(":scope > span");
    expect(span?.style.width).toBe("40px");
  });

  // The browser paints right after its ResizeObserver callbacks: a measure deferred to a frame,
  // or a React update left to the scheduler, paints a group shown again without its indicator
  it("commits the new box in the ResizeObserver callback itself", () => {
    const { group, items, indicator } = renderPressed();
    boxes.set(items.a, new DOMRect(30, 6, 48, 20));
    outsideAct(() => resize(group));
    expect(indicator()).toEqual(px(20, 6, 48, 20));
  });

  // In a group of fixed size an item can change size, or be shown again, while the group doesn't
  it.each(["a", "b"] as const)(
    "measures pressed item %s again when only that item resizes",
    (value) => {
      const { items, press, indicator } = renderPressed();
      press(value);
      boxes.set(items[value], new DOMRect(20, 2, 64, 28));
      act(() => resize(items[value]));
      expect(indicator()).toEqual(px(10, 2, 64, 28));
    },
  );

  it("shows the indicator again when the pressed item is shown again in a group that keeps its size", () => {
    const { items, indicator } = renderPressed();
    // Hidden with display:none, the item measures 0×0: no box to show
    boxes.set(items.a, new DOMRect(0, 0, 0, 0));
    act(() => resize(items.a));
    expect(indicator()).toBeNull();

    boxes.set(items.a, new DOMRect(14, 4, 40, 24));
    act(() => resize(items.a));
    expect(indicator()).toEqual(px(4, 4, 40, 24));
  });

  // A measure queued before the press would put the indicator back on the item pressed before
  it("keeps the indicator on a newly pressed item after a resize notification just before", async () => {
    const { group, press, indicator } = renderPressed();
    act(() => resize(group));
    press("b");
    await frames(2);
    expect(indicator()).toEqual(px(46, 4, 50, 24));
  });
});

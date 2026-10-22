import { act, cleanup, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FOCUS_RING } from "chunks-ui-core";
import { axe } from "jest-axe";
import { type ReactNode, StrictMode, useEffect, useRef, useState } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  type MockInstance,
  vi,
} from "vitest";
// The file `#prehydration/tabs/indicator` resolves to outside browser builds, by the path
// Tabs.visual.spec.tsx imports it from
import { script as prehydrationScript } from "../../../node_modules/@base-ui/react/tabs/indicator/prehydrationScript.min.mjs";
import { useIndicatorSlide } from "../../lib/use-indicator-slide";
import { Tabs, type TabsRootProps, useTabsValue } from "./Tabs";

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(cleanup);

/** Returns true if the panel wrapper is hidden via CSS fallback or motion-mode inert. */
function isHiddenPanel(wrapper: HTMLElement): boolean {
  return wrapper.style.display === "none" || wrapper.hasAttribute("inert");
}

function ValueProbe() {
  const value = useTabsValue();
  return <span data-testid="value">{String(value)}</span>;
}

describe("Tabs", () => {
  it("renders all sub-components", () => {
    render(
      <Tabs.Root defaultValue="a" data-testid="root">
        <Tabs.List data-testid="list">
          <Tabs.Tab value="a">Tab A</Tabs.Tab>
          <Tabs.Tab value="b">Tab B</Tabs.Tab>
          <Tabs.Indicator data-testid="ind" />
        </Tabs.List>
        <Tabs.Panel value="a" data-testid="panel">
          Content A
        </Tabs.Panel>
      </Tabs.Root>,
    );
    expect(screen.getByTestId("root")).toBeInTheDocument();
    expect(screen.getByTestId("list")).toBeInTheDocument();
    expect(screen.getByText("Tab A")).toBeInTheDocument();
    expect(screen.getByText("Content A")).toBeInTheDocument();
  });

  it("merges custom className on Root", () => {
    render(<Tabs.Root className="custom" data-testid="root" defaultValue="a" />);
    expect(screen.getByTestId("root")).toHaveClass("custom");
  });

  it("merges custom className on List", () => {
    render(
      <Tabs.Root defaultValue="a">
        <Tabs.List className="custom" data-testid="list" />
      </Tabs.Root>,
    );
    expect(screen.getByTestId("list")).toHaveClass("custom");
  });

  it("merges custom className on Tab", () => {
    render(
      <Tabs.Root defaultValue="a">
        <Tabs.List>
          <Tabs.Tab value="a" className="custom">
            A
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>,
    );
    expect(screen.getByRole("tab")).toHaveClass("custom");
  });

  it("merges custom className on Panel", () => {
    render(
      <Tabs.Root defaultValue="a">
        <Tabs.List>
          <Tabs.Tab value="a">A</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a" className="custom" data-testid="panel">
          Content
        </Tabs.Panel>
      </Tabs.Root>,
    );
    expect(screen.getByTestId("panel")).toHaveClass("custom");
  });

  it("merges custom className on Indicator", () => {
    render(
      <Tabs.Root defaultValue="a">
        <Tabs.List>
          <Tabs.Tab value="a">A</Tabs.Tab>
          <Tabs.Indicator className="custom" data-testid="ind" />
        </Tabs.List>
      </Tabs.Root>,
    );
    expect(screen.getByTestId("ind")).toHaveClass("custom");
  });

  it("hides inactive panels via display:none or inert", () => {
    render(
      <Tabs.Root defaultValue="a">
        <Tabs.List>
          <Tabs.Tab value="a">A</Tabs.Tab>
          <Tabs.Tab value="b">B</Tabs.Tab>
        </Tabs.List>
        <Tabs.Contents>
          <Tabs.Content value="a">Panel A</Tabs.Content>
          <Tabs.Content value="b" data-testid="panel-b">
            Panel B
          </Tabs.Content>
        </Tabs.Contents>
      </Tabs.Root>,
    );
    expect(screen.getByText("Panel A")).toBeInTheDocument();
    expect(isHiddenPanel(screen.getByTestId("panel-b").parentElement!)).toBe(true);
  });

  it("merges custom className on Contents", () => {
    render(
      <Tabs.Root defaultValue="a">
        <Tabs.Contents className="custom" data-testid="contents">
          <Tabs.Content value="a">Panel A</Tabs.Content>
        </Tabs.Contents>
      </Tabs.Root>,
    );
    expect(screen.getByTestId("contents")).toHaveClass("custom");
  });

  it("merges custom className on Content", () => {
    render(
      <Tabs.Root defaultValue="a">
        <Tabs.Contents>
          <Tabs.Content value="a" className="custom" data-testid="content">
            Panel A
          </Tabs.Content>
        </Tabs.Contents>
      </Tabs.Root>,
    );
    expect(screen.getByTestId("content")).toHaveClass("custom");
  });

  it("renders Contents with custom transition prop", () => {
    render(
      <Tabs.Root defaultValue="a">
        <Tabs.Contents transition={{ duration: 0.1 }}>
          <Tabs.Content value="a">Panel A</Tabs.Content>
        </Tabs.Contents>
      </Tabs.Root>,
    );
    expect(screen.getByText("Panel A")).toBeInTheDocument();
  });

  it("calls onValueChange when tab is clicked", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Tabs.Root defaultValue="a" onValueChange={onValueChange}>
        <Tabs.List>
          <Tabs.Tab value="a">A</Tabs.Tab>
          <Tabs.Tab value="b">B</Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>,
    );
    await user.click(screen.getByText("B"));
    expect(onValueChange).toHaveBeenCalled();
  });

  it("syncs Contents to controlled value", () => {
    const { rerender } = render(
      <Tabs.Root value="a">
        <Tabs.Contents>
          <Tabs.Content value="a" data-testid="panel-a">
            Panel A
          </Tabs.Content>
          <Tabs.Content value="b" data-testid="panel-b">
            Panel B
          </Tabs.Content>
        </Tabs.Contents>
      </Tabs.Root>,
    );
    expect(isHiddenPanel(screen.getByTestId("panel-b").parentElement!)).toBe(true);
    rerender(
      <Tabs.Root value="b">
        <Tabs.Contents>
          <Tabs.Content value="a" data-testid="panel-a">
            Panel A
          </Tabs.Content>
          <Tabs.Content value="b" data-testid="panel-b">
            Panel B
          </Tabs.Content>
        </Tabs.Contents>
      </Tabs.Root>,
    );
    expect(isHiddenPanel(screen.getByTestId("panel-a").parentElement!)).toBe(true);
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <Tabs.Root defaultValue="a">
        <Tabs.List>
          <Tabs.Tab value="a">A</Tabs.Tab>
          <Tabs.Indicator />
        </Tabs.List>
        <Tabs.Panel value="a">Content</Tabs.Panel>
      </Tabs.Root>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders Contents in motion mode using inert instead of display:none", async () => {
    // CSS fallback: inactive panels get `style="display: none"`.
    // Motion mode: panels stay mounted with `inert` attribute; no display:none.
    const { container } = render(
      <Tabs.Root defaultValue="a">
        <Tabs.Contents>
          <Tabs.Content value="a">Panel A</Tabs.Content>
          <Tabs.Content value="b" data-testid="panel-b">
            Panel B
          </Tabs.Content>
        </Tabs.Contents>
      </Tabs.Root>,
    );
    await waitFor(() => {
      const panelB = container.querySelector('[data-testid="panel-b"]');
      expect(panelB?.parentElement).not.toHaveStyle("display: none");
    });
  });
});

describe("Tabs.Content", () => {
  const tabs = (
    <Tabs.Root defaultValue="a">
      <Tabs.List>
        <Tabs.Tab value="a">Alpha</Tabs.Tab>
        <Tabs.Tab value="b">Beta</Tabs.Tab>
      </Tabs.List>
      <Tabs.Contents>
        <Tabs.Content value="a">Panel A</Tabs.Content>
        <Tabs.Content value="b">Panel B</Tabs.Content>
      </Tabs.Contents>
    </Tabs.Root>
  );

  it("is a tabpanel named by its tab, and the tab controls it", () => {
    render(tabs);
    for (const name of ["Alpha", "Beta"]) {
      // The inactive panel is hidden from the accessibility tree
      const panel = screen.getByRole("tabpanel", { name, hidden: true });
      expect(screen.getByRole("tab", { name })).toHaveAttribute("aria-controls", panel.id);
    }
  });

  it("has no a11y violations", async () => {
    const { container } = render(tabs);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Tabs.Indicator in server HTML", () => {
  const tabs = (indicator: ReactNode) => (
    <Tabs.Root defaultValue="a">
      <Tabs.List>
        <Tabs.Tab value="a">Alpha</Tabs.Tab>
        <Tabs.Tab value="b">Beta</Tabs.Tab>
        {indicator}
      </Tabs.List>
    </Tabs.Root>
  );

  function serverHtml(ui: ReactNode) {
    const container = document.createElement("div");
    container.innerHTML = renderToString(ui);
    return container;
  }

  // Base UI's script finds the indicator as its previous sibling, measures the active tab, and
  // shows the indicator over it before React hydrates. It is the file the browser spec runs: a
  // Base UI that renders another one fails here, not with a stale script there.
  it("is followed by the script that places it before hydration", () => {
    const html = serverHtml(tabs(<Tabs.Indicator data-testid="indicator" />));
    const script = html.querySelector('[data-testid="indicator"]')?.nextElementSibling;
    expect(script?.tagName).toBe("SCRIPT");
    expect(script?.textContent).toBe(prehydrationScript);
  });

  it("has no script with renderBeforeHydration={false}", () => {
    const html = serverHtml(
      tabs(<Tabs.Indicator data-testid="indicator" renderBeforeHydration={false} />),
    );
    expect(html.querySelector('[data-testid="indicator"]')).not.toBeNull();
    expect(html.querySelector("script")).toBeNull();
  });

  it("hydrates the server HTML without errors, and drops the script", async () => {
    const ui = tabs(<Tabs.Indicator data-testid="indicator" />);
    const container = serverHtml(ui);
    document.body.append(container);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const root = await act(async () => hydrateRoot(container, <StrictMode>{ui}</StrictMode>));
      expect(consoleError).not.toHaveBeenCalled();
      expect(container.querySelector('[data-testid="indicator"]')).not.toBeNull();
      expect(container.querySelector("script")).toBeNull();
      act(() => root.unmount());
    } finally {
      consoleError.mockRestore();
      container.remove();
    }
  });
});

// Base UI keeps the selected tab when onValueChange calls eventDetails.cancel(); every part
// that follows the tab value (Contents, Animate, useTabsValue) must stay with it
describe("cancelling a change in onValueChange", () => {
  function Harness({
    controlled = false,
    cancel = false,
    disableA = false,
  }: {
    controlled?: boolean;
    cancel?: boolean;
    disableA?: boolean;
  }) {
    const [value, setValue] = useState<unknown>("a");
    const onValueChange: TabsRootProps["onValueChange"] = (next, details) => {
      if (cancel) details.cancel();
      else setValue(next);
    };
    return (
      <Tabs.Root
        {...(controlled ? { value } : { defaultValue: "a" })}
        onValueChange={onValueChange}
      >
        <Tabs.List>
          <Tabs.Tab value="a" disabled={disableA}>
            A
          </Tabs.Tab>
          <Tabs.Tab value="b">B</Tabs.Tab>
        </Tabs.List>
        <ValueProbe />
        <Tabs.Contents>
          <Tabs.Content value="a" data-testid="content-a">
            Content A
          </Tabs.Content>
          <Tabs.Content value="b" data-testid="content-b">
            Content B
          </Tabs.Content>
        </Tabs.Contents>
        <Tabs.Animate data-testid="animate">
          <Tabs.Panel value="a">Panel A</Tabs.Panel>
          <Tabs.Panel value="b">Panel B</Tabs.Panel>
        </Tabs.Animate>
      </Tabs.Root>
    );
  }

  function expectSelected(value: "a" | "b") {
    const other = value === "a" ? "b" : "a";
    expect(screen.getByRole("tab", { name: value.toUpperCase() })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByTestId("value")).toHaveTextContent(value);
    expect(isHiddenPanel(screen.getByTestId(`content-${value}`).parentElement!)).toBe(false);
    expect(isHiddenPanel(screen.getByTestId(`content-${other}`).parentElement!)).toBe(true);
  }

  it.each([
    ["uncontrolled", false],
    ["controlled", true],
  ])("keeps every part on the selected tab (%s)", async (_mode, controlled) => {
    const user = userEvent.setup();
    render(<Harness controlled={controlled} cancel />);
    const pane = screen.getByTestId("animate");
    await user.click(screen.getByRole("tab", { name: "B" }));
    expectSelected("a");
    // Tabs.Animate re-keys (remounts its pane) only when the value changes
    expect(screen.getByTestId("animate")).toBe(pane);
  });

  it.each([
    ["uncontrolled", false],
    ["controlled", true],
  ])("switches every part when the change is not cancelled (%s)", async (_mode, controlled) => {
    const user = userEvent.setup();
    render(<Harness controlled={controlled} />);
    const pane = screen.getByTestId("animate");
    await user.click(screen.getByRole("tab", { name: "B" }));
    expectSelected("b");
    expect(screen.getByTestId("animate")).not.toBe(pane);
  });

  it("follows Base UI off a tab that becomes disabled, which cancel() can't stop", () => {
    const { rerender } = render(<Harness cancel />);
    rerender(<Harness cancel disableA />);
    expectSelected("b");
  });
});

describe("function tab values", () => {
  // `calls` counts calls of either value: no part may call a tab value
  let calls = 0;
  function first() {
    calls++;
    return "first";
  }
  function second() {
    calls++;
    return "second";
  }

  beforeEach(() => {
    calls = 0;
  });

  function IsSecondProbe() {
    return <span data-testid="is-second">{String(useTabsValue() === second)}</span>;
  }

  function Harness({
    controlled,
    onValueChange,
  }: {
    controlled: boolean;
    onValueChange: NonNullable<TabsRootProps["onValueChange"]>;
  }) {
    const [value, setValue] = useState<unknown>(() => first);
    return (
      <Tabs.Root
        {...(controlled ? { value } : { defaultValue: first })}
        onValueChange={(next, details) => {
          onValueChange(next, details);
          setValue(() => next);
        }}
      >
        <Tabs.List>
          <Tabs.Tab value={first}>A</Tabs.Tab>
          <Tabs.Tab value={second}>B</Tabs.Tab>
          <Tabs.Indicator data-testid="indicator" />
        </Tabs.List>
        <IsSecondProbe />
        <Tabs.Contents>
          <Tabs.Content value={first} data-testid="content-a">
            Content A
          </Tabs.Content>
          <Tabs.Content value={second} data-testid="content-b">
            Content B
          </Tabs.Content>
        </Tabs.Contents>
      </Tabs.Root>
    );
  }

  it.each([
    ["uncontrolled", false],
    ["controlled", true],
  ])("selects the clicked tab, with its value as is (%s)", async (_mode, controlled) => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness controlled={controlled} onValueChange={onValueChange} />);
    expect(screen.getByRole("tab", { name: "A" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("is-second")).toHaveTextContent("false");

    await user.click(screen.getByRole("tab", { name: "B" }));
    expect(screen.getByRole("tab", { name: "B" })).toHaveAttribute("aria-selected", "true");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0]?.[0]).toBe(second);
    expect(screen.getByTestId("is-second")).toHaveTextContent("true");
    expect(isHiddenPanel(screen.getByTestId("content-a").parentElement!)).toBe(true);
    expect(isHiddenPanel(screen.getByTestId("content-b").parentElement!)).toBe(false);
    expect(calls).toBe(0);
  });

  it("useIndicatorSlide slides to a function target", () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: unknown }) => useIndicatorSlide<HTMLElement>(target, null),
      { initialProps: { target: first } },
    );
    expect(result.current.sliding).toBe(false);
    rerender({ target: second });
    expect(result.current.sliding).toBe(true);
    expect(calls).toBe(0);
  });
});

// StrictMode runs a mount's effects twice on one instance; a remount is a new instance
function MountedChild({ instances }: { instances: Set<object> }) {
  const instance = useRef({});
  useEffect(() => {
    instances.add(instance.current);
  }, [instances]);
  return null;
}

function Animate({ value, instances }: { value: unknown; instances: Set<object> }) {
  return (
    <Tabs.Root value={value}>
      <Tabs.Animate data-testid="animate">
        <MountedChild instances={instances} />
      </Tabs.Animate>
    </Tabs.Root>
  );
}

// Contents and Animate key by value; distinct values need distinct, stable keys.
describe("tab values with the same String() text", () => {
  const first = { id: 1 };
  const second = { id: 2 };
  const sameSource = () => () => null;
  const pairs = [
    ["two objects", first, second],
    ["two functions with the same source", sameSource(), sameSource()],
    ['1 and "1"', 1, "1"],
  ] as const;

  // React reports two children with the same key through console.error
  let consoleError: MockInstance<typeof console.error>;
  beforeEach(() => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    consoleError.mockRestore();
  });

  function Contents({
    value,
    a,
    b,
    children,
  }: {
    value: unknown;
    a: unknown;
    b: unknown;
    children?: ReactNode;
  }) {
    return (
      <Tabs.Root value={value}>
        <Tabs.Contents>
          <Tabs.Content value={a} data-testid="content-a">
            Content A{children}
          </Tabs.Content>
          <Tabs.Content value={b} data-testid="content-b">
            Content B
          </Tabs.Content>
        </Tabs.Contents>
      </Tabs.Root>
    );
  }

  function expectShown(shown: "a" | "b") {
    const hidden = shown === "a" ? "b" : "a";
    expect(isHiddenPanel(screen.getByTestId(`content-${shown}`).parentElement!)).toBe(false);
    expect(isHiddenPanel(screen.getByTestId(`content-${hidden}`).parentElement!)).toBe(true);
  }

  it.each(pairs)("Tabs.Contents shows the pane of each of %s, with no duplicate key", (_, a, b) => {
    const { rerender } = render(<Contents value={a} a={a} b={b} />);
    expectShown("a");
    rerender(<Contents value={b} a={a} b={b} />);
    expectShown("b");
    expect(consoleError).not.toHaveBeenCalled();
  });

  it.each(pairs)(
    "Tabs.Animate remounts its pane, so its entry plays, for a switch between %s",
    (_, a, b) => {
      const instances = new Set<object>();
      const { rerender } = render(<Animate value={a} instances={instances} />);
      const pane = screen.getByTestId("animate");
      expect(instances.size).toBe(1);
      rerender(<Animate value={b} instances={instances} />);
      expect(screen.getByTestId("animate")).not.toBe(pane);
      expect(instances.size).toBe(2);
    },
  );

  // A value keeps its key, so a re-render with the same values does not remount a pane
  it("keeps a Tabs.Contents pane mounted across a re-render with the same object values", () => {
    const instances = new Set<object>();
    // A new element each time, or React would skip the unchanged subtree
    const ui = () => (
      <Contents value={first} a={first} b={second}>
        <MountedChild instances={instances} />
      </Contents>
    );
    const { rerender } = render(ui());
    const pane = screen.getByTestId("content-a");
    rerender(ui());
    expect(screen.getByTestId("content-a")).toBe(pane);
    expect(instances.size).toBe(1);
  });

  it("keeps a Tabs.Animate pane mounted across a re-render with the same object value", () => {
    const instances = new Set<object>();
    const { rerender } = render(<Animate value={first} instances={instances} />);
    const pane = screen.getByTestId("animate");
    rerender(<Animate value={first} instances={instances} />);
    expect(screen.getByTestId("animate")).toBe(pane);
    expect(instances.size).toBe(1);
  });

  // undefined (nothing tracked yet) and null (Base UI: no enabled tab) both mean no selection
  it("mounts a Tabs.Animate pane once when every tab is disabled", () => {
    const instances = new Set<object>();
    render(
      <Tabs.Root>
        <Tabs.List>
          <Tabs.Tab value="a" disabled>
            A
          </Tabs.Tab>
          <Tabs.Tab value="b" disabled>
            B
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Animate>
          <MountedChild instances={instances} />
        </Tabs.Animate>
      </Tabs.Root>,
    );
    expect(instances.size).toBe(1);
  });

  it("keys a Tabs.Contents child without a value apart from a sibling with value={1}", () => {
    render(
      <Tabs.Root value={1}>
        <Tabs.Contents>
          <Tabs.Content value={0}>Zero</Tabs.Content>
          {/* @ts-expect-error value is required by the types, but a child can lack it */}
          <Tabs.Content>No value</Tabs.Content>
          <Tabs.Content value={1}>One</Tabs.Content>
        </Tabs.Contents>
      </Tabs.Root>,
    );
    expect(consoleError).not.toHaveBeenCalled();
    expect(screen.getByText("No value")).toBeInTheDocument();
    expect(screen.getByText("One")).toBeInTheDocument();
  });
});

describe("useTabsValue", () => {
  it("returns the active value from context", () => {
    render(
      <Tabs.Root value="a">
        <ValueProbe />
      </Tabs.Root>,
    );
    expect(screen.getByTestId("value")).toHaveTextContent("a");
  });

  it("updates when the controlled value changes", () => {
    const { rerender } = render(
      <Tabs.Root value="a">
        <ValueProbe />
      </Tabs.Root>,
    );
    expect(screen.getByTestId("value")).toHaveTextContent("a");
    rerender(
      <Tabs.Root value="b">
        <ValueProbe />
      </Tabs.Root>,
    );
    expect(screen.getByTestId("value")).toHaveTextContent("b");
  });

  it("throws when used outside <Tabs.Root>", () => {
    // Suppress the expected React error log for this case.
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<ValueProbe />)).toThrow(/Tabs\.Root/);
    errSpy.mockRestore();
  });
});

describe("Tabs.Animate", () => {
  it("renders children", () => {
    render(
      <Tabs.Root value="a">
        <Tabs.Animate>
          <span data-testid="kid">hello</span>
        </Tabs.Animate>
      </Tabs.Root>,
    );
    expect(screen.getByTestId("kid")).toHaveTextContent("hello");
  });

  it("re-keys on tab value change (forces remount)", () => {
    const instances = new Set<object>();
    const { rerender } = render(<Animate value="a" instances={instances} />);
    const pane = screen.getByTestId("animate");
    expect(instances.size).toBe(1);
    rerender(<Animate value="b" instances={instances} />);
    // The key changes with the value, so the pane is a new element with a new child instance
    expect(screen.getByTestId("animate")).not.toBe(pane);
    expect(instances.size).toBe(2);
  });

  it("accepts custom initial / animate / transition without error", () => {
    render(
      <Tabs.Root value="a">
        <Tabs.Animate
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="custom-anim"
          data-testid="anim"
        >
          <span>content</span>
        </Tabs.Animate>
      </Tabs.Root>,
    );
    const el = screen.getByTestId("anim");
    expect(el).toBeInTheDocument();
    expect(el).toHaveClass("custom-anim");
    expect(el).toHaveAttribute("data-testid", "anim");
  });

  it("forwards className", () => {
    render(
      <Tabs.Root value="a">
        <Tabs.Animate className="custom" data-testid="anim">
          <span>content</span>
        </Tabs.Animate>
      </Tabs.Root>,
    );
    expect(screen.getByTestId("anim")).toHaveClass("custom");
  });
});

describe("Tabs focus ring", () => {
  const tabs = () =>
    render(
      <Tabs.Root defaultValue="a">
        <Tabs.List>
          <Tabs.Tab value="a">A</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a" data-testid="panel">
          Content
        </Tabs.Panel>
      </Tabs.Root>,
    );

  it("draws the library focus ring on Tab", () => {
    tabs();
    expect(screen.getByRole("tab")).toHaveClass(FOCUS_RING);
  });

  it("draws the library focus ring on Panel", () => {
    tabs();
    expect(screen.getByTestId("panel")).toHaveClass(FOCUS_RING);
  });

  // Tabs.Contents clips its panels, so Tabs.Content keeps the ring inside its edge
  it("keeps the inset ring on Content", () => {
    render(
      <Tabs.Root defaultValue="a">
        <Tabs.List>
          <Tabs.Tab value="a">A</Tabs.Tab>
        </Tabs.List>
        <Tabs.Contents>
          <Tabs.Content value="a" data-testid="content">
            Content
          </Tabs.Content>
        </Tabs.Contents>
      </Tabs.Root>,
    );
    expect(screen.getByTestId("content")).toHaveClass("focus-visible:-outline-offset-2");
    expect(screen.getByTestId("content")).not.toHaveClass("focus-visible:outline-offset-2");
  });
});

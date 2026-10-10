import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { type ReactNode, useEffect, useState } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
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
  // shows the indicator over it before React hydrates
  it("is followed by the script that places it before hydration", () => {
    const html = serverHtml(tabs(<Tabs.Indicator data-testid="indicator" />));
    const script = html.querySelector('[data-testid="indicator"]')?.nextElementSibling;
    expect(script?.tagName).toBe("SCRIPT");
    expect(script?.textContent).toContain("--active-tab-");
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
      const root = await act(async () => hydrateRoot(container, ui));
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

  it("re-keys on tab value change (forces remount)", async () => {
    const onMount = vi.fn();
    function MountedChild() {
      useEffect(() => {
        onMount();
      }, []);
      return null;
    }
    const { rerender } = render(
      <Tabs.Root value="a">
        <Tabs.Animate>
          <MountedChild />
        </Tabs.Animate>
      </Tabs.Root>,
    );
    await waitFor(() => {
      expect(onMount.mock.calls.length).toBeGreaterThanOrEqual(1);
    });
    // Capture the count after any post-mount upgrades (e.g. motion module
    // load swapping the wrapper element type) settle.
    const before = onMount.mock.calls.length;
    rerender(
      <Tabs.Root value="b">
        <Tabs.Animate>
          <MountedChild />
        </Tabs.Animate>
      </Tabs.Root>,
    );
    // A `key` change must cause at least one additional mount.
    await waitFor(() => {
      expect(onMount.mock.calls.length).toBeGreaterThan(before);
    });
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

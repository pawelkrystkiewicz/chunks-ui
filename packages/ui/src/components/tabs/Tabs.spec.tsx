import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useEffect } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Tabs, useTabsValue } from "./Tabs";

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

describe("useTabsValue", () => {
  function ValueProbe() {
    const value = useTabsValue();
    return <span data-testid="value">{String(value)}</span>;
  }

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

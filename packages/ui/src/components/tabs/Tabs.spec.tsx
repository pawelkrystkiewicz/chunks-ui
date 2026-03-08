import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Tabs } from "./Tabs";

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(cleanup);

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

  it("renders Contents with panels (CSS fallback)", () => {
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
    expect(screen.getByTestId("panel-b").parentElement).toHaveStyle("display: none");
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
    expect(screen.getByTestId("panel-b").parentElement).toHaveStyle("display: none");
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
    expect(screen.getByTestId("panel-a").parentElement).toHaveStyle("display: none");
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

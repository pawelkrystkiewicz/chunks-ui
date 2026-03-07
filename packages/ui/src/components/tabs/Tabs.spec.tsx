import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Tabs } from "./Tabs";

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
});

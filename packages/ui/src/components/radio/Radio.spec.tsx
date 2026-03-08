import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
import { Radio } from "./Radio";

afterEach(cleanup);

describe("Radio", () => {
  it("renders a radio group", () => {
    render(
      <Radio.Group data-testid="group">
        <Radio.Root value="a">
          <Radio.Indicator />
        </Radio.Root>
      </Radio.Group>,
    );
    expect(screen.getByTestId("group")).toBeInTheDocument();
    expect(screen.getByRole("radio")).toBeInTheDocument();
  });

  it("merges custom className on Group", () => {
    render(<Radio.Group className="custom" data-testid="group" />);
    expect(screen.getByTestId("group")).toHaveClass("custom");
  });

  it("merges custom className on Root", () => {
    render(
      <Radio.Group>
        <Radio.Root value="a" className="custom" />
      </Radio.Group>,
    );
    expect(screen.getByRole("radio")).toHaveClass("custom");
  });

  it("renders Indicator with custom className", () => {
    render(
      <Radio.Group defaultValue="a">
        <Radio.Root value="a">
          <Radio.Indicator data-testid="ind" className="custom" />
        </Radio.Root>
      </Radio.Group>,
    );
    expect(screen.getByTestId("ind")).toHaveClass("custom");
  });

  it("renders Item with label", () => {
    render(
      <Radio.Group aria-label="Options">
        <Radio.Item value="a">Option A</Radio.Item>
      </Radio.Group>,
    );
    expect(screen.getByText("Option A")).toBeInTheDocument();
    expect(screen.getByRole("radio")).toBeInTheDocument();
  });

  it("renders disabled Item with cursor-not-allowed class", () => {
    const { container } = render(
      <Radio.Group aria-label="Options">
        <Radio.Item value="a" disabled>
          Option A
        </Radio.Item>
      </Radio.Group>,
    );
    expect(container.querySelector("label")).toHaveClass("cursor-not-allowed");
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <Radio.Group defaultValue="a" aria-label="Options">
        <Radio.Root value="a" aria-label="Option A">
          <Radio.Indicator />
        </Radio.Root>
      </Radio.Group>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("keeps Indicator mounted when unchecked in motion mode", async () => {
    // No defaultValue → radio is unchecked.
    // CSS fallback: Indicator unmounts when unchecked (no keepMounted).
    // Motion mode: keepMounted keeps it in the DOM.
    render(
      <Radio.Group>
        <Radio.Root value="a">
          <Radio.Indicator data-testid="ind" />
        </Radio.Root>
      </Radio.Group>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("ind")).toBeInTheDocument();
    });
  });
});

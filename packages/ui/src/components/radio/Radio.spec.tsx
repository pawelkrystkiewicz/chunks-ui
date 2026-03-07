import { cleanup, render, screen } from "@testing-library/react";
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
});

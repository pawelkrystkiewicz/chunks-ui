import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Switch } from "./Switch";

afterEach(cleanup);

describe("Switch", () => {
  it("renders a switch", () => {
    render(
      <Switch.Root>
        <Switch.Thumb />
      </Switch.Root>,
    );
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("merges custom className on Root", () => {
    render(<Switch.Root className="custom" />);
    expect(screen.getByRole("switch")).toHaveClass("custom");
  });

  it("renders Thumb with custom className", () => {
    render(
      <Switch.Root>
        <Switch.Thumb data-testid="thumb" className="custom" />
      </Switch.Root>,
    );
    expect(screen.getByTestId("thumb")).toHaveClass("custom");
  });
});

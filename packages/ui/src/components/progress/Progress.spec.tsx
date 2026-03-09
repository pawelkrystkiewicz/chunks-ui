import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
import { Progress } from "./Progress";

afterEach(cleanup);

function BasicProgress(props: Partial<React.ComponentProps<typeof Progress.Root>> = {}) {
  return (
    <Progress.Root value={75} aria-label="Loading" {...props}>
      <Progress.Track>
        <Progress.Indicator />
      </Progress.Track>
    </Progress.Root>
  );
}

describe("Progress", () => {
  it("renders all sub-components", () => {
    render(<BasicProgress />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("merges custom className on Root", () => {
    render(<BasicProgress className="custom" data-testid="root" />);
    expect(screen.getByTestId("root")).toHaveClass("custom");
  });

  it("merges custom className on Track", () => {
    render(
      <Progress.Root value={50} aria-label="Loading">
        <Progress.Track className="custom" data-testid="track">
          <Progress.Indicator />
        </Progress.Track>
      </Progress.Root>,
    );
    expect(screen.getByTestId("track")).toHaveClass("custom");
  });

  it("merges custom className on Indicator", () => {
    render(
      <Progress.Root value={50} aria-label="Loading">
        <Progress.Track>
          <Progress.Indicator className="custom" data-testid="indicator" />
        </Progress.Track>
      </Progress.Root>,
    );
    expect(screen.getByTestId("indicator")).toHaveClass("custom");
  });

  it("reflects value on the progressbar element", () => {
    render(<BasicProgress value={42} />);
    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveAttribute("aria-valuenow", "42");
  });

  it("reflects indeterminate state when value is null", () => {
    render(
      <Progress.Root value={null} aria-label="Loading">
        <Progress.Track>
          <Progress.Indicator data-testid="indicator" />
        </Progress.Track>
      </Progress.Root>,
    );
    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveAttribute("data-indeterminate");
  });

  it("has no a11y violations", async () => {
    const { container } = render(<BasicProgress />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

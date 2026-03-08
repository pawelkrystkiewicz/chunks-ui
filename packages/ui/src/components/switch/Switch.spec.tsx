import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
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

  it("has no a11y violations", async () => {
    const { container } = render(
      <Switch.Root aria-label="Toggle">
        <Switch.Thumb />
      </Switch.Root>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders Thumb without CSS transition class in motion mode", async () => {
    // CSS fallback: Thumb has `micro-interactions` class.
    // Motion mode: motion handles animation; `micro-interactions` is absent.
    render(
      <Switch.Root>
        <Switch.Thumb data-testid="thumb" />
      </Switch.Root>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("thumb")).not.toHaveClass("micro-interactions");
    });
  });
});

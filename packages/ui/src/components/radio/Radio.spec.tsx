import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FOCUS_RING } from "../shared";
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

  // The item's dimmed, not-allowed look is measured in Radio.visual.spec
  it("marks a disabled Item and ignores clicks on it", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Radio.Group aria-label="Plan" onValueChange={onValueChange}>
        <Radio.Item value="a" disabled>
          Disabled
        </Radio.Item>
        <Radio.Item value="b">Enabled</Radio.Item>
      </Radio.Group>,
    );
    const disabled = screen.getByRole("radio", { name: "Disabled" });
    expect(disabled).toHaveAttribute("data-disabled");
    await user.click(screen.getByText("Disabled"));
    expect(disabled).toHaveAttribute("aria-checked", "false");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("radio", { name: "Enabled" })).not.toHaveAttribute("data-disabled");
    await user.click(screen.getByText("Enabled"));
    expect(onValueChange).toHaveBeenCalledWith("b", expect.anything());
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

describe("Radio focus ring", () => {
  it("draws the library focus ring on Root", () => {
    render(
      <Radio.Group>
        <Radio.Root value="a" />
      </Radio.Group>,
    );
    expect(screen.getByRole("radio")).toHaveClass(FOCUS_RING);
  });
});

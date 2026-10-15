import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Field } from "../field";
import { Checkbox } from "./Checkbox";

afterEach(cleanup);

describe("Checkbox", () => {
  it("renders Root as a checkbox", () => {
    render(<Checkbox.Root />);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("merges custom className on Root", () => {
    render(<Checkbox.Root className="custom" />);
    expect(screen.getByRole("checkbox")).toHaveClass("custom");
  });

  it("renders Indicator inside Root", () => {
    render(
      <Checkbox.Root defaultChecked>
        <Checkbox.Indicator data-testid="ind" />
      </Checkbox.Root>,
    );
    expect(screen.getByTestId("ind")).toBeInTheDocument();
  });

  it("renders Indicator with custom className", () => {
    render(
      <Checkbox.Root defaultChecked>
        <Checkbox.Indicator data-testid="ind" className="custom" />
      </Checkbox.Root>,
    );
    expect(screen.getByTestId("ind")).toHaveClass("custom");
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <Checkbox.Root aria-label="Accept terms">
        <Checkbox.Indicator />
      </Checkbox.Root>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  // The not-allowed cursor is measured in Checkbox.visual.spec; Base UI ignores the click
  it.each<[string, boolean, (checkbox: ReactNode) => ReactNode]>([
    ["its own prop", true, (checkbox) => checkbox],
    ["a disabled Field.Root", false, (checkbox) => <Field.Root disabled>{checkbox}</Field.Root>],
  ])("ignores clicks when disabled by %s", async (_, own, wrap) => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      wrap(
        <Checkbox.Root aria-label="Accept" disabled={own} onCheckedChange={onCheckedChange}>
          <Checkbox.Indicator />
        </Checkbox.Root>,
      ),
    );
    const checkbox = screen.getByRole("checkbox", { name: "Accept" });
    expect(checkbox).toHaveAttribute("data-disabled");
    await user.click(checkbox);
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(checkbox).toHaveAttribute("aria-checked", "false");
  });
});

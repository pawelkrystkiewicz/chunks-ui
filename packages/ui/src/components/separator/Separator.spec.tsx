import { cleanup, render } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
import { Separator } from "./Separator";

afterEach(cleanup);

describe("Separator", () => {
  it("renders a separator", () => {
    const { container } = render(<Separator />);
    expect(container.querySelector("[role='separator']")).toBeInTheDocument();
  });

  it("merges custom className", () => {
    const { container } = render(<Separator className="custom" />);
    expect(container.querySelector("[role='separator']")).toHaveClass("custom");
  });

  it("has no a11y violations", async () => {
    const { container } = render(<Separator />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

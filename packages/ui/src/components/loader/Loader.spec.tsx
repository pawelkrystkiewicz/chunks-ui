import { cleanup, render } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
import { Loader } from "./Loader";

afterEach(cleanup);

describe("Loader", () => {
  it("renders an svg with aria-hidden", () => {
    const { container } = render(<Loader />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("applies animate-spin class", () => {
    const { container } = render(<Loader />);
    expect(container.querySelector("svg")).toHaveClass("animate-spin");
  });

  it("merges custom className", () => {
    const { container } = render(<Loader className="custom" />);
    expect(container.querySelector("svg")).toHaveClass("custom");
  });

  it("applies size from CSS variable", () => {
    const { container } = render(<Loader />);
    expect(container.querySelector("svg")).toHaveClass("size-ui-icon-height");
  });

  it("applies color variant", () => {
    const { container } = render(<Loader color="primary" />);
    expect(container.querySelector("svg")).toHaveClass("text-primary");
  });

  it("has no a11y violations", async () => {
    const { container } = render(<Loader />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

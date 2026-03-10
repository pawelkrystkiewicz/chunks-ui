import { cleanup, render } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
import { Skeleton } from "./Skeleton";

afterEach(cleanup);

describe("Skeleton", () => {
  it("renders a div", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });

  it("merges custom className", () => {
    const { container } = render(<Skeleton className="h-4 w-32" data-testid="skel" />);
    expect(container.firstChild).toHaveClass("h-4", "w-32");
  });

  it("applies animate-pulse", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass("animate-pulse");
  });

  it("has no a11y violations", async () => {
    const { container } = render(<Skeleton className="h-4 w-32" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
import { Badge } from "./Badge";

afterEach(cleanup);

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("merges custom className", () => {
    render(
      <Badge className="custom" data-testid="badge">
        Tag
      </Badge>,
    );
    expect(screen.getByTestId("badge")).toHaveClass("custom");
  });

  it("renders with different colors", () => {
    const { rerender } = render(
      <Badge color="primary" data-testid="badge">
        Primary
      </Badge>,
    );
    expect(screen.getByTestId("badge")).toHaveClass("text-primary");
    rerender(
      <Badge color="destructive" data-testid="badge">
        Destructive
      </Badge>,
    );
    expect(screen.getByTestId("badge")).toHaveClass("text-destructive");
  });

  it("renders outlined variant", () => {
    render(
      <Badge variant="outlined" data-testid="badge">
        Outlined
      </Badge>,
    );
    expect(screen.getByTestId("badge")).toHaveClass("bg-transparent");
  });

  it("has no a11y violations", async () => {
    const { container } = render(<Badge>Accessible</Badge>);
    expect(await axe(container)).toHaveNoViolations();
  });
});

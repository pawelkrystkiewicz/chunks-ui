import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
import { Breadcrumb } from "./Breadcrumb";

afterEach(cleanup);

function BasicBreadcrumb() {
  return (
    <Breadcrumb.Root>
      <Breadcrumb.List>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/">Home</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Separator />
        <Breadcrumb.Item>
          <Breadcrumb.Page>Current</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb.List>
    </Breadcrumb.Root>
  );
}

describe("Breadcrumb", () => {
  it("renders a nav with aria-label", () => {
    render(<BasicBreadcrumb />);
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders links and current page", () => {
    render(<BasicBreadcrumb />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Current")).toBeInTheDocument();
  });

  it("marks Page with aria-current", () => {
    render(<BasicBreadcrumb />);
    expect(screen.getByText("Current")).toHaveAttribute("aria-current", "page");
  });

  it("renders custom separator children", () => {
    render(
      <Breadcrumb.Root>
        <Breadcrumb.List>
          <Breadcrumb.Item>
            <Breadcrumb.Link href="/">Home</Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator>/</Breadcrumb.Separator>
          <Breadcrumb.Item>
            <Breadcrumb.Page>Page</Breadcrumb.Page>
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>,
    );
    expect(screen.getByText("/")).toBeInTheDocument();
  });

  it("renders Ellipsis", () => {
    render(
      <Breadcrumb.Root>
        <Breadcrumb.List>
          <Breadcrumb.Item>
            <Breadcrumb.Ellipsis />
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>,
    );
    expect(screen.getByText("More")).toBeInTheDocument();
  });

  it("renders Link with render prop", () => {
    render(
      <Breadcrumb.Root>
        <Breadcrumb.List>
          <Breadcrumb.Item>
            <Breadcrumb.Link render={<a href="/test">Test</a>}>Ignored</Breadcrumb.Link>
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>,
    );
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("merges custom className on Root", () => {
    render(
      <Breadcrumb.Root className="custom" data-testid="root">
        <Breadcrumb.List>
          <Breadcrumb.Item>
            <Breadcrumb.Page>Page</Breadcrumb.Page>
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>,
    );
    expect(screen.getByTestId("root")).toHaveClass("custom");
  });

  it("has no a11y violations", async () => {
    const { container } = render(<BasicBreadcrumb />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

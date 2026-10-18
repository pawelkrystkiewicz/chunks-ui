import { cleanup, isInaccessible, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Pagination, type PaginationRootProps } from "./Pagination";
import { DEFAULT_PAGINATION_LABELS } from "./Pagination.Labels";

afterEach(cleanup);

function BasicPagination() {
  return (
    <Pagination.Root>
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.Previous href="#" />
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Link href="#">1</Pagination.Link>
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Link href="#" active>
            2
          </Pagination.Link>
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Next href="#" />
        </Pagination.Item>
      </Pagination.Content>
    </Pagination.Root>
  );
}

describe("Pagination", () => {
  it("renders a nav named Pagination", () => {
    render(<BasicPagination />);
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
  });

  it("renders page links", () => {
    render(<BasicPagination />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("marks active link with aria-current", () => {
    render(<BasicPagination />);
    expect(screen.getByText("2").closest("[aria-current]")).toHaveAttribute("aria-current", "page");
  });

  it("renders Previous and Next", () => {
    render(<BasicPagination />);
    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("renders Ellipsis", () => {
    render(
      <Pagination.Root>
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Ellipsis />
          </Pagination.Item>
        </Pagination.Content>
      </Pagination.Root>,
    );
    expect(screen.getByText("More pages")).toBeInTheDocument();
  });

  it("renders Link with render prop", () => {
    render(
      <Pagination.Root>
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Link render={<a href="/test">Test</a>} active>
              Ignored
            </Pagination.Link>
          </Pagination.Item>
        </Pagination.Content>
      </Pagination.Root>,
    );
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("renders Previous with render prop", () => {
    render(
      <Pagination.Root>
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Previous render={<a href="/prev">Back</a>} />
          </Pagination.Item>
        </Pagination.Content>
      </Pagination.Root>,
    );
    expect(screen.getByText("Back")).toBeInTheDocument();
  });

  it("renders Next with render prop", () => {
    render(
      <Pagination.Root>
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Next render={<a href="/next">Forward</a>} />
          </Pagination.Item>
        </Pagination.Content>
      </Pagination.Root>,
    );
    expect(screen.getByText("Forward")).toBeInTheDocument();
  });

  it("merges custom className on Root", () => {
    render(
      <Pagination.Root className="custom" data-testid="root">
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Link href="#">1</Pagination.Link>
          </Pagination.Item>
        </Pagination.Content>
      </Pagination.Root>,
    );
    expect(screen.getByTestId("root")).toHaveClass("custom");
  });

  it("has no a11y violations", async () => {
    const { container } = render(<BasicPagination />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

// The dots are only the default content: children replace them, and the hidden label stays (#564)
describe("Pagination.Ellipsis content", () => {
  const ellipsis = (children?: ReactNode) =>
    render(
      <Pagination.Root>
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Ellipsis data-testid="ellipsis">{children}</Pagination.Ellipsis>
          </Pagination.Item>
        </Pagination.Content>
      </Pagination.Root>,
    );

  it("renders the dots when it has no children", () => {
    ellipsis();
    const dots = screen.getByTestId("ellipsis").querySelector("svg");
    expect(dots).toHaveAttribute("aria-hidden", "true");
  });

  it("renders its children in place of the dots, beside its label", () => {
    ellipsis(<span>custom</span>);
    const el = screen.getByTestId("ellipsis");
    expect(el.querySelector("svg")).not.toBeInTheDocument();
    const custom = screen.getByText("custom");
    expect(el).toContainElement(custom);
    expect(isInaccessible(custom)).toBe(false);
    const label = screen.getByText(DEFAULT_PAGINATION_LABELS.ellipsis);
    expect(label).toHaveClass("sr-only");
    expect(isInaccessible(label)).toBe(false);
  });
});

describe("Pagination labels", () => {
  function LabelledPagination(props: PaginationRootProps) {
    return (
      <Pagination.Root {...props}>
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Previous href="#" />
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Ellipsis />
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Next href="#" />
          </Pagination.Item>
        </Pagination.Content>
      </Pagination.Root>
    );
  }

  it("uses DEFAULT_PAGINATION_LABELS", () => {
    render(<LabelledPagination />);
    const { root, previous, next, ellipsis } = DEFAULT_PAGINATION_LABELS;
    expect(screen.getByRole("navigation", { name: root })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: previous })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: next })).toBeInTheDocument();
    expect(screen.getByText(ellipsis)).toBeInTheDocument();
  });

  it("takes every string from labels on Root", () => {
    render(
      <LabelledPagination
        labels={{
          root: "Paginacja",
          previous: "Poprzednia",
          next: "Następna",
          ellipsis: "Więcej stron",
        }}
      />,
    );
    expect(screen.getByRole("navigation", { name: "Paginacja" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Poprzednia" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Następna" })).toBeInTheDocument();
    expect(screen.getByText("Więcej stron")).toBeInTheDocument();
  });

  it("prefers aria-label on Root and children on Previous and Next over labels", () => {
    render(
      <Pagination.Root
        aria-label="Results pages"
        labels={{ root: "Paginacja", previous: "Wstecz" }}
      >
        <Pagination.Previous href="#">Back</Pagination.Previous>
      </Pagination.Root>,
    );
    expect(screen.getByRole("navigation", { name: "Results pages" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back" })).toBeInTheDocument();
  });
});

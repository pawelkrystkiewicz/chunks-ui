import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
import { Pagination } from "./Pagination";

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
  it("renders a nav with aria-label", () => {
    render(<BasicPagination />);
    expect(screen.getByRole("navigation", { name: "pagination" })).toBeInTheDocument();
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

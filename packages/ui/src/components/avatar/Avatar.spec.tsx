import { cleanup, render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { Avatar } from "./Avatar";

afterEach(cleanup);

describe("Avatar", () => {
  // jsdom never loads images, so these cover the not-loaded state; the loaded image and a
  // failed load are covered in Avatar.visual.spec.tsx
  it("shows the initials while src loads", () => {
    render(<Avatar src="/photo.jpg" alt="John Doe" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("puts the image in server HTML, named once by alt", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<Avatar src="/photo.jpg" alt="John Doe" />);
    expect(container.querySelector("img")).toHaveAttribute("src", "/photo.jpg");
    expect(within(container).getAllByRole("img", { name: "John Doe" })).toHaveLength(1);
  });

  it("renders initials from alt when no src", () => {
    render(<Avatar alt="John Doe" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("is an image named by alt without src", () => {
    render(<Avatar alt="John Doe" />);
    expect(screen.getByRole("img", { name: "John Doe" })).toHaveTextContent("JD");
  });

  it("is named once by alt while src loads", () => {
    render(<Avatar src="/photo.jpg" alt="John Doe" />);
    expect(screen.getAllByRole("img", { name: "John Doe" })).toHaveLength(1);
  });

  it("keeps an avatar without alt out of the accessibility tree", () => {
    render(<Avatar fallback="AB" />);
    expect(screen.getByText("AB")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("uses fallback over alt-derived initials", () => {
    render(<Avatar alt="John Doe" fallback="X" />);
    expect(screen.getByText("X")).toBeInTheDocument();
    expect(screen.queryByText("JD")).not.toBeInTheDocument();
  });

  it("limits initials to 2 characters", () => {
    render(<Avatar alt="A B C D" />);
    expect(screen.getByText("AB")).toBeInTheDocument();
  });

  it("renders with numeric size as inline style", () => {
    const { rerender } = render(<Avatar alt="T" size={24} data-testid="av" />);
    const el = screen.getByTestId("av");
    expect(el.style.width).toBe("24px");
    expect(el.style.height).toBe("24px");

    rerender(<Avatar alt="T" size={64} data-testid="av" />);
    expect(el.style.width).toBe("64px");
    expect(el.style.height).toBe("64px");
  });

  it("renders with different shapes", () => {
    const { rerender } = render(<Avatar alt="T" shape="circle" data-testid="av" />);
    expect(screen.getByTestId("av")).toHaveClass("rounded-full");

    rerender(<Avatar alt="T" shape="rounded" data-testid="av" />);
    expect(screen.getByTestId("av")).toHaveClass("rounded-md");

    rerender(<Avatar alt="T" shape="square" data-testid="av" />);
    expect(screen.getByTestId("av")).toHaveClass("rounded-none");
  });

  it("merges custom className", () => {
    render(<Avatar alt="T" className="custom" data-testid="av" />);
    expect(screen.getByTestId("av")).toHaveClass("custom");
  });

  it("renders with no src and no alt (undefined initials)", () => {
    const { container } = render(<Avatar data-testid="av" />);
    expect(container.querySelector("[data-testid='av']")).toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <>
        <Avatar src="https://example.com/avatar.jpg" alt="John Doe" />
        <Avatar alt="Jane Doe" />
        <Avatar fallback="AB" />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

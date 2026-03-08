import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Avatar } from "./Avatar";

afterEach(cleanup);

describe("Avatar", () => {
  it("renders an image when src is provided", () => {
    render(<Avatar src="/photo.jpg" alt="John Doe" />);
    expect(screen.getByRole("img", { name: "John Doe" })).toHaveAttribute("src", "/photo.jpg");
  });

  it("renders initials from alt when no src", () => {
    render(<Avatar alt="John Doe" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
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
    expect(screen.getByTestId("av")).toHaveClass("rounded");

    rerender(<Avatar alt="T" shape="square" data-testid="av" />);
    expect(screen.getByTestId("av")).toHaveClass("rounded-none");
  });

  it("renders img with empty alt when alt is not provided", () => {
    const { container } = render(<Avatar src="/photo.jpg" />);
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("alt", "");
    expect(img).toHaveAttribute("src", "/photo.jpg");
  });

  it("merges custom className", () => {
    render(<Avatar alt="T" className="custom" data-testid="av" />);
    expect(screen.getByTestId("av")).toHaveClass("custom");
  });

  it("renders with no src and no alt (undefined initials)", () => {
    const { container } = render(<Avatar data-testid="av" />);
    expect(container.querySelector("[data-testid='av']")).toBeInTheDocument();
  });
});

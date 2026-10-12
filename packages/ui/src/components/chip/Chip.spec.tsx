import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useState } from "react";
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { Chip, type ChipLabels, DEFAULT_CHIP_LABELS } from "./Chip";

afterEach(cleanup);

describe("Chip", () => {
  it("renders children", () => {
    render(<Chip>Status</Chip>);
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("merges custom className", () => {
    render(
      <Chip className="custom" data-testid="chip">
        Tag
      </Chip>,
    );
    expect(screen.getByTestId("chip")).toHaveClass("custom");
  });

  it("shows remove button when onRemove is provided", async () => {
    const onRemove = vi.fn();
    render(<Chip onRemove={onRemove}>Tag</Chip>);
    const btn = screen.getByRole("button", { name: "Remove Tag" });
    await userEvent.click(btn);
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("does not show remove button without onRemove", () => {
    render(<Chip>Tag</Chip>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps its children mounted when onRemove comes and goes", async () => {
    const user = userEvent.setup();
    function Counter() {
      const [count, setCount] = useState(0);
      return (
        <button type="button" onClick={() => setCount(count + 1)}>
          {`Clicked ${count}`}
        </button>
      );
    }
    const { rerender } = render(
      <Chip>
        <Counter />
      </Chip>,
    );
    await user.click(screen.getByRole("button", { name: "Clicked 0" }));
    rerender(
      <Chip onRemove={vi.fn()}>
        <Counter />
      </Chip>,
    );
    expect(screen.getByRole("button", { name: "Clicked 1" })).toBeInTheDocument();
    rerender(
      <Chip>
        <Counter />
      </Chip>,
    );
    expect(screen.getByRole("button", { name: "Clicked 1" })).toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    const { container } = render(<Chip>Tag</Chip>);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Chip labels", () => {
  it("types DEFAULT_CHIP_LABELS as read-only", () => {
    expectTypeOf(DEFAULT_CHIP_LABELS).toEqualTypeOf<Readonly<ChipLabels>>();
  });

  it("keeps the default when a label is undefined", () => {
    render(
      <Chip onRemove={vi.fn()} labels={{ remove: undefined }}>
        Apple
      </Chip>,
    );
    expect(screen.getByRole("button", { name: "Remove Apple" })).toBeInTheDocument();
  });

  // aria-labelledby joins its parts with spaces, so punctuation next to {chip} is read apart
  it.each([
    { remove: "{chip}", name: "Apple" },
    { remove: "{chip}!", name: "Apple !" },
    { remove: "x{chip}", name: "x Apple" },
    { remove: "{chip} y", name: "Apple y" },
  ])("names the button $name for the label $remove", ({ remove, name }) => {
    render(
      <Chip onRemove={vi.fn()} labels={{ remove }}>
        Apple
      </Chip>,
    );
    expect(screen.getByRole("button", { name })).toBeInTheDocument();
  });

  it("names the remove button after the chip", () => {
    render(<Chip onRemove={vi.fn()}>Apple</Chip>);
    expect(screen.getByRole("button", { name: "Remove Apple" })).toBeInTheDocument();
  });

  it("names the remove button after rich chip content", () => {
    render(
      <Chip onRemove={vi.fn()}>
        <svg aria-hidden="true" />
        <span>Apple</span> pie
      </Chip>,
    );
    expect(screen.getByRole("button", { name: "Remove Apple pie" })).toBeInTheDocument();
  });

  it("takes the remove word from labels", () => {
    render(
      <Chip onRemove={vi.fn()} labels={{ remove: "Usuń" }}>
        Apple
      </Chip>,
    );
    expect(screen.getByRole("button", { name: "Usuń Apple" })).toBeInTheDocument();
  });

  it.each([
    { remove: "{chip} を削除", name: "Apple を削除" },
    { remove: "Supprimer {chip} ?", name: "Supprimer Apple ?" },
  ])("puts the chip's content where $remove has {chip}", ({ remove, name }) => {
    render(
      <Chip onRemove={vi.fn()} labels={{ remove }}>
        Apple
      </Chip>,
    );
    expect(screen.getByRole("button", { name })).toBeInTheDocument();
  });

  it("names the remove button after the chip itself", () => {
    render(
      <Chip data-testid="chip" onRemove={vi.fn()}>
        Apple
      </Chip>,
    );
    const chip = screen.getByTestId("chip");
    const button = screen.getByRole("button", { name: "Remove Apple" });
    expect(chip.id).not.toBe("");
    expect(button.getAttribute("aria-labelledby")?.split(" ")).toContain(chip.id);
    // An aria-label would be read again as part of the chip's text: "Remove Apple Remove"
    expect(button).not.toHaveAttribute("aria-label");
  });

  it("names the remove button after a chip with the consumer's id", () => {
    render(
      <Chip id="fruit" data-testid="chip" onRemove={vi.fn()}>
        Apple
      </Chip>,
    );
    expect(screen.getByTestId("chip")).toHaveAttribute("id", "fruit");
    const button = screen.getByRole("button", { name: "Remove Apple" });
    expect(button.getAttribute("aria-labelledby")?.split(" ")).toContain("fruit");
  });

  // axe's color-contrast rule skips text under `display: contents`, so no wrapper may hold it
  it("keeps the text directly in the chip", () => {
    render(
      <Chip data-testid="chip" onRemove={vi.fn()}>
        Apple
      </Chip>,
    );
    expect(screen.getByText("Apple")).toBe(screen.getByTestId("chip"));
  });

  it("starts the name with DEFAULT_CHIP_LABELS.remove", () => {
    render(<Chip onRemove={vi.fn()}>Apple</Chip>);
    expect(
      screen.getByRole("button", { name: `${DEFAULT_CHIP_LABELS.remove} Apple` }),
    ).toBeInTheDocument();
  });

  it("has no a11y violations when removable", async () => {
    const { container } = render(<Chip onRemove={vi.fn()}>Apple</Chip>);
    expect(await axe(container)).toHaveNoViolations();
  });
});

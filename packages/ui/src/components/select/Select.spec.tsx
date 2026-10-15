import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
import { FOCUS_RING } from "../shared";
import { Select } from "./Select";

afterEach(cleanup);

describe("Select", () => {
  it("renders Trigger with custom className", () => {
    render(
      <Select.Root>
        <Select.Trigger className="custom" data-testid="trigger">
          <Select.Value placeholder="Pick" />
        </Select.Trigger>
      </Select.Root>,
    );
    expect(screen.getByTestId("trigger")).toHaveClass("custom");
  });

  it("renders Icon with custom className", () => {
    render(
      <Select.Root>
        <Select.Trigger>
          <Select.Icon className="custom" data-testid="icon" />
        </Select.Trigger>
      </Select.Root>,
    );
    expect(screen.getByTestId("icon")).toHaveClass("custom");
  });

  it("renders Popup with custom className", () => {
    render(
      <Select.Root open>
        <Select.Trigger>Pick</Select.Trigger>
        <Select.Positioner>
          <Select.Popup className="custom" data-testid="popup">
            <Select.Item value="a">A</Select.Item>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>,
    );
    expect(screen.getByTestId("popup")).toHaveClass("custom");
  });

  it("renders Item with custom className", () => {
    render(
      <Select.Root open>
        <Select.Trigger>Pick</Select.Trigger>
        <Select.Positioner>
          <Select.Popup>
            <Select.Item value="a" className="custom" data-testid="item">
              A
            </Select.Item>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>,
    );
    expect(screen.getByTestId("item")).toHaveClass("custom");
  });

  it("renders ItemIndicator with checkmark svg", () => {
    render(
      <Select.Root open defaultValue="a">
        <Select.Trigger>Pick</Select.Trigger>
        <Select.Positioner>
          <Select.Popup>
            <Select.Item value="a">
              <Select.ItemIndicator data-testid="ind" />A
            </Select.Item>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>,
    );
    expect(screen.getByTestId("ind")).toBeInTheDocument();
  });

  it("renders GroupLabel with custom className", () => {
    render(
      <Select.Root open>
        <Select.Trigger>Pick</Select.Trigger>
        <Select.Positioner>
          <Select.Popup>
            <Select.Group>
              <Select.GroupLabel className="custom" data-testid="gl">
                Fruits
              </Select.GroupLabel>
            </Select.Group>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>,
    );
    expect(screen.getByTestId("gl")).toHaveClass("custom");
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <Select.Root>
        <Select.Trigger aria-label="Choose">
          <Select.Value placeholder="Pick" />
          <Select.Icon />
        </Select.Trigger>
      </Select.Root>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Select focus ring", () => {
  const trigger = (className?: string) =>
    render(
      <Select.Root>
        <Select.Trigger className={className} data-testid="trigger">
          <Select.Value placeholder="Pick" />
        </Select.Trigger>
      </Select.Root>,
    );

  it("draws the library focus ring on the Trigger", () => {
    trigger();
    expect(screen.getByTestId("trigger")).toHaveClass(...FOCUS_RING.split(" "));
  });

  // Both offsets are in one tailwind-merge group under the same variant: the consumer's wins
  it("keeps a flush ring with focus-visible:outline-offset-0 in className", () => {
    trigger("focus-visible:outline-offset-0");
    const el = screen.getByTestId("trigger");
    expect(el).toHaveClass(
      "focus-visible:outline-offset-0",
      "focus-visible:outline-2",
      "focus-visible:outline-ring",
    );
    expect(el).not.toHaveClass("focus-visible:outline-offset-2");
  });
});

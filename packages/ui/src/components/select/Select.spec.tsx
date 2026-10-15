import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { reloadMotion } from "../../lib/use-motion";
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
  const trigger = () =>
    render(
      <Select.Root>
        <Select.Trigger data-testid="trigger">
          <Select.Value placeholder="Pick" />
        </Select.Trigger>
      </Select.Root>,
    );

  it("draws the library focus ring on the Trigger", () => {
    trigger();
    expect(screen.getByTestId("trigger")).toHaveClass(FOCUS_RING);
  });
});

describe("Select.Popup with Motion loaded", () => {
  function renderPopup(renderProp?: ReactElement) {
    render(
      <Select.Root open>
        <Select.Trigger>Pick</Select.Trigger>
        <Select.Positioner>
          <Select.Popup render={renderProp} data-testid="popup">
            <Select.Item value="a">A</Select.Item>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>,
    );
    return screen.getByTestId("popup");
  }

  it("animates the default element with Motion, not CSS", async () => {
    await reloadMotion();
    const el = renderPopup();
    expect(el).not.toHaveClass("micro-interactions");
    // A motion.div renders its initial values inline
    expect(el.style.opacity).not.toBe("");
  });

  // A consumer's `render` replaces the animated element, so the spring cannot attach to it
  it("keeps the CSS transition on the element a render prop gives it", async () => {
    await reloadMotion();
    const popup = renderPopup(<section />);
    expect(popup.tagName).toBe("SECTION");
    expect(popup).toHaveClass("micro-interactions", "data-starting-style:opacity-0");
  });
});

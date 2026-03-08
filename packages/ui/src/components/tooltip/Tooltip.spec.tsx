import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
import { Tooltip } from "./Tooltip";

afterEach(cleanup);

describe("Tooltip", () => {
  it("renders Popup with custom className", () => {
    render(
      <Tooltip.Root open>
        <Tooltip.Trigger>Hover</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup className="custom" data-testid="popup">
              Tip
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );
    expect(screen.getByTestId("popup")).toHaveClass("custom");
    expect(screen.getByText("Tip")).toBeInTheDocument();
  });

  it("renders Arrow with custom className", () => {
    render(
      <Tooltip.Root open>
        <Tooltip.Trigger>Hover</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup>
              Tip
              <Tooltip.Arrow className="custom" data-testid="arrow" />
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );
    expect(screen.getByTestId("arrow")).toHaveClass("custom");
  });

  it("renders Positioner with custom className", () => {
    render(
      <Tooltip.Root open>
        <Tooltip.Trigger>Hover</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner className="custom" data-testid="pos">
            <Tooltip.Popup>Tip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );
    expect(screen.getByTestId("pos")).toHaveClass("custom");
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <Tooltip.Root open>
        <Tooltip.Trigger>Hover</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup>Tip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );
    expect(
      await axe(container, {
        rules: {
          // Base UI focus-guard spans with role="button" are internal implementation details
          "aria-command-name": { enabled: false },
        },
      }),
    ).toHaveNoViolations();
  });
});

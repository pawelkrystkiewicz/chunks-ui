import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Popover } from "./Popover";

afterEach(cleanup);

describe("Popover", () => {
  it("renders Popup with custom className", () => {
    render(
      <Popover.Root open>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup className="custom" data-testid="popup">
              Content
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );
    expect(screen.getByTestId("popup")).toHaveClass("custom");
  });

  it("renders Positioner with custom className", () => {
    render(
      <Popover.Root open>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner className="custom" data-testid="pos">
            <Popover.Popup>Content</Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );
    expect(screen.getByTestId("pos")).toHaveClass("custom");
  });

  it("renders Arrow with custom className", () => {
    render(
      <Popover.Root open>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup>
              <Popover.Arrow className="custom" data-testid="arrow" />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );
    expect(screen.getByTestId("arrow")).toHaveClass("custom");
  });

  it("renders Title with custom className", () => {
    render(
      <Popover.Root open>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup>
              <Popover.Title className="custom" data-testid="title">
                Heading
              </Popover.Title>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );
    expect(screen.getByTestId("title")).toHaveClass("custom");
  });

  it("renders Description with custom className", () => {
    render(
      <Popover.Root open>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup>
              <Popover.Description className="custom" data-testid="desc">
                Info
              </Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );
    expect(screen.getByTestId("desc")).toHaveClass("custom");
  });
});

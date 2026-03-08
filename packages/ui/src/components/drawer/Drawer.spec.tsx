import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
import { Drawer } from "./Drawer";

afterEach(cleanup);

describe("Drawer", () => {
  it("renders Backdrop with custom className", () => {
    render(
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Backdrop className="custom" data-testid="backdrop" />
          <Drawer.Popup>Content</Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    expect(screen.getByTestId("backdrop")).toHaveClass("custom");
  });

  it("renders Popup with default side (right)", () => {
    render(
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Popup data-testid="popup">Content</Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    expect(screen.getByTestId("popup")).toHaveClass("right-0");
  });

  it("renders Popup with left side", () => {
    render(
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Popup side="left" data-testid="popup">
            Content
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    expect(screen.getByTestId("popup")).toHaveClass("left-0");
  });

  it("renders Popup with bottom side", () => {
    render(
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Popup side="bottom" data-testid="popup">
            Content
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    expect(screen.getByTestId("popup")).toHaveClass("bottom-0");
  });

  it("renders Popup with custom className", () => {
    render(
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Popup className="custom" data-testid="popup">
            Content
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    expect(screen.getByTestId("popup")).toHaveClass("custom");
  });

  it("renders Title with custom className", () => {
    render(
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Popup>
            <Drawer.Title className="custom" data-testid="title">
              Heading
            </Drawer.Title>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    expect(screen.getByTestId("title")).toHaveClass("custom");
  });

  it("renders Description with custom className", () => {
    render(
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Popup>
            <Drawer.Description className="custom" data-testid="desc">
              Info
            </Drawer.Description>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    expect(screen.getByTestId("desc")).toHaveClass("custom");
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Popup>
            <Drawer.Title>Title</Drawer.Title>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

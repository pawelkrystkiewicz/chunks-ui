import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { reloadMotion } from "../../lib/use-motion";
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

  // The Motion path positions the popup with its own classes, the same ones the CSS variants use
  it("positions the Popup by its side on the Motion path", async () => {
    await reloadMotion();
    render(
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Popup side="bottom" data-testid="popup">
            Content
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    const popup = screen.getByTestId("popup");
    expect(popup).not.toHaveClass("micro-interactions");
    expect(popup).toHaveClass("inset-x-0 bottom-0 h-auto max-h-[80dvh] border-t rounded-t-xl");
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

describe("Drawer.Backdrop with Motion loaded", () => {
  function renderBackdrop(renderProp?: ReactElement) {
    render(
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Backdrop render={renderProp} data-testid="backdrop" />
          <Drawer.Popup>Content</Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    return screen.getByTestId("backdrop");
  }

  it("animates the default element with Motion, not CSS", async () => {
    await reloadMotion();
    const el = renderBackdrop();
    expect(el).not.toHaveClass("micro-interactions");
    // A motion.div renders its initial values inline
    expect(el.style.opacity).not.toBe("");
  });

  // A consumer's `render` replaces the animated element, so the spring cannot attach to it
  it("keeps the CSS transition on the element a render prop gives it", async () => {
    await reloadMotion();
    const backdrop = renderBackdrop(<section />);
    expect(backdrop.tagName).toBe("SECTION");
    expect(backdrop).toHaveClass("micro-interactions", "data-starting-style:opacity-0");
  });
});

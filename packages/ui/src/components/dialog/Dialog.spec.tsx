import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { reloadMotion } from "../../lib/use-motion";
import { FOCUS_RING } from "../shared";
import { Dialog } from "./Dialog";

afterEach(cleanup);

describe("Dialog", () => {
  it("renders Backdrop with custom className", () => {
    render(
      <Dialog.Root open>
        <Dialog.Portal>
          <Dialog.Backdrop className="custom" data-testid="backdrop" />
          <Dialog.Popup>Content</Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    expect(screen.getByTestId("backdrop")).toHaveClass("custom");
  });

  it("renders Popup with custom className", () => {
    render(
      <Dialog.Root open>
        <Dialog.Portal>
          <Dialog.Popup className="custom" data-testid="popup">
            Content
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    expect(screen.getByTestId("popup")).toHaveClass("custom");
  });

  it("draws the library focus ring on the Popup", () => {
    render(
      <Dialog.Root open>
        <Dialog.Portal>
          <Dialog.Popup data-testid="popup">Content</Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    expect(screen.getByTestId("popup")).toHaveClass(...FOCUS_RING.split(" "));
  });

  it("renders Title with custom className", () => {
    render(
      <Dialog.Root open>
        <Dialog.Portal>
          <Dialog.Popup>
            <Dialog.Title className="custom" data-testid="title">
              Heading
            </Dialog.Title>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    expect(screen.getByTestId("title")).toHaveClass("custom");
  });

  it("renders Description with custom className", () => {
    render(
      <Dialog.Root open>
        <Dialog.Portal>
          <Dialog.Popup>
            <Dialog.Description className="custom" data-testid="desc">
              Info
            </Dialog.Description>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    expect(screen.getByTestId("desc")).toHaveClass("custom");
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <Dialog.Root open>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup>
            <Dialog.Title>Title</Dialog.Title>
            <Dialog.Description>Desc</Dialog.Description>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

// Last, since Motion stays loaded for the tests that follow
describe("Dialog.Backdrop with Motion loaded", () => {
  function renderBackdrop(renderProp?: ReactElement) {
    render(
      <Dialog.Root open>
        <Dialog.Portal>
          <Dialog.Backdrop render={renderProp} data-testid="backdrop" />
          <Dialog.Popup>Content</Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    return screen.getByTestId("backdrop");
  }

  it("animates the default element with Motion, not CSS", async () => {
    await reloadMotion();
    expect(renderBackdrop()).not.toHaveClass("micro-interactions");
  });

  // A consumer's `render` replaces the animated element, so the spring cannot attach to it
  it("keeps the CSS transition on the element a render prop gives it", async () => {
    await reloadMotion();
    const backdrop = renderBackdrop(<section />);
    expect(backdrop.tagName).toBe("SECTION");
    expect(backdrop).toHaveClass("micro-interactions", "data-starting-style:opacity-0");
  });
});

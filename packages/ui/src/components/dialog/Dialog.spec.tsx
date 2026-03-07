import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
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
});

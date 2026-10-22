import { cleanup, render, screen } from "@testing-library/react";
import { FOCUS_RING } from "chunks-ui-core";
import { configureAxe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
import { undecided } from "../../AxeTest.utils";
import { Dialog } from "./Dialog";

afterEach(cleanup);

// aria-hidden-focus skips Base UI's focus guards, aria-hidden spans that hand focus on when Tab
// reaches them. A browser's axe leaves them for review, as it takes the open dialog for a modal.
// Here axe runs while the popup is still at opacity 0 and can't hit-test the backdrop, so it
// finds no modal and flags them. The rule still checks every other aria-hidden node. Base UI
// also aria-hides the page outside a modal dialog, so a trigger rendered beside the open dialog
// fails the same way; these audits leave it out. Were axe to find a modal, it would leave a stray
// focusable aria-hidden node in `incomplete`, which toHaveNoViolations() does not read, so the
// audit also checks that the rule left nothing there
const axe = configureAxe({
  globalOptions: {
    rules: [
      { id: "aria-hidden-focus", selector: '[aria-hidden="true"]:not([data-base-ui-focus-guard])' },
    ],
  },
});

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
    // The popup is portalled out of the container RTL hands back, so audit the body
    expect(container).not.toContainElement(screen.getByRole("dialog"));
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
    expect(undecided(results, "aria-hidden-focus")).toEqual([]);
  });
});

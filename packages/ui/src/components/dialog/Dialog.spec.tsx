import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef, type ReactNode } from "react";
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

  it("draws the library focus ring on the Popup", () => {
    render(
      <Dialog.Root open>
        <Dialog.Portal>
          <Dialog.Popup data-testid="popup">Content</Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    expect(screen.getByTestId("popup")).toHaveClass(
      "focus-visible:outline-2",
      "focus-visible:outline-offset-2",
      "focus-visible:outline-ring",
    );
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

describe("Dialog.Body", () => {
  function renderBody(title: ReactNode, body: ReactNode) {
    return render(
      <Dialog.Root open>
        <Dialog.Portal>
          <Dialog.Popup>
            {title}
            {body}
            <Dialog.Close>Cancel</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );
  }

  it("renders with custom className and forwards ref", () => {
    const ref = createRef<HTMLElement>();
    renderBody(
      <Dialog.Title>Terms</Dialog.Title>,
      <Dialog.Body ref={ref} className="custom">
        Text
      </Dialog.Body>,
    );
    const body = screen.getByRole("region", { name: "Terms" });
    expect(body).toHaveClass("custom");
    expect(body).toHaveAttribute("tabindex", "0");
    expect(ref.current).toBe(body);
  });

  it("is named by the Title when the Title has its own id", () => {
    renderBody(
      <Dialog.Title id="terms-title">Terms</Dialog.Title>,
      <Dialog.Body>Text</Dialog.Body>,
    );
    expect(screen.getByRole("region", { name: "Terms" })).toHaveAttribute(
      "aria-labelledby",
      "terms-title",
    );
    expect(screen.getByRole("dialog", { name: "Terms" })).toBeInTheDocument();
  });

  it("takes the name passed to it over the Title", () => {
    renderBody(
      <Dialog.Title>Terms</Dialog.Title>,
      <Dialog.Body aria-label="Terms text">Text</Dialog.Body>,
    );
    const body = screen.getByRole("region", { name: "Terms text" });
    expect(body).not.toHaveAttribute("aria-labelledby");
  });

  it("drops the name when the Title unmounts", () => {
    function Toggle({ title }: { title: boolean }) {
      return (
        <Dialog.Root open>
          <Dialog.Portal>
            <Dialog.Popup aria-label="Terms">
              {title && <Dialog.Title>Terms</Dialog.Title>}
              <Dialog.Body data-testid="body">Text</Dialog.Body>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      );
    }
    const { rerender } = render(<Toggle title />);
    expect(screen.getByTestId("body")).toHaveAttribute("aria-labelledby");
    rerender(<Toggle title={false} />);
    expect(screen.getByTestId("body")).not.toHaveAttribute("aria-labelledby");
  });

  it("is named by the time it takes the initial focus", async () => {
    let nameAtFocus: string | null | undefined;
    renderBody(
      <Dialog.Title>Terms</Dialog.Title>,
      <Dialog.Body onFocus={(e) => (nameAtFocus = e.currentTarget.getAttribute("aria-labelledby"))}>
        Text
      </Dialog.Body>,
    );
    await waitFor(() => expect(screen.getByRole("region", { name: "Terms" })).toHaveFocus());
    expect(nameAtFocus).toBeTruthy();
  });

  it("has no a11y violations", async () => {
    const { container } = renderBody(
      <>
        <Dialog.Title>Terms</Dialog.Title>
        <Dialog.Description>Read before you accept.</Dialog.Description>
      </>,
      <Dialog.Body>
        <p>Text</p>
      </Dialog.Body>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

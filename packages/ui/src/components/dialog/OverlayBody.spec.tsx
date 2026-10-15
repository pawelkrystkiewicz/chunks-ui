import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef, type ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Drawer } from "../drawer";
import { FOCUS_RING } from "../shared";
import { Dialog } from "./index";

afterEach(cleanup);

// Drawer parts are Dialog parts, so one suite serves both Bodies
const OVERLAYS = [
  { name: "Dialog.Body", X: Dialog, marker: "DialogBody" },
  { name: "Drawer.Body", X: Drawer, marker: "DrawerBody" },
] as const;

describe.each(OVERLAYS)("$name", ({ X, marker }) => {
  /** A Popup with `title`, `body` and a Cancel button after the Body */
  function renderBody(title: ReactNode, body: ReactNode) {
    return render(
      <X.Root open>
        <X.Portal>
          <X.Popup data-testid="popup">
            {title}
            {body}
            <X.Close>Cancel</X.Close>
          </X.Popup>
        </X.Portal>
      </X.Root>,
    );
  }

  it("renders with custom className and forwards ref; the Popup becomes a flex column", () => {
    const ref = createRef<HTMLElement>();
    renderBody(
      <X.Title>Terms</X.Title>,
      <X.Body ref={ref} className="custom">
        Text
      </X.Body>,
    );
    const body = screen.getByRole("region", { name: "Terms" });
    expect(body).toHaveClass("custom", marker, "overflow-y-auto", ...FOCUS_RING.split(" "));
    expect(body).toHaveAttribute("tabindex", "0");
    expect(ref.current).toBe(body);
    expect(screen.getByTestId("popup")).toHaveClass(
      `has-[>.${marker}]:flex`,
      `has-[>.${marker}]:flex-col`,
    );
  });

  it("is named by the Title when the Title has its own id", () => {
    renderBody(<X.Title id="terms-title">Terms</X.Title>, <X.Body>Text</X.Body>);
    expect(screen.getByRole("region", { name: "Terms" })).toHaveAttribute(
      "aria-labelledby",
      "terms-title",
    );
    expect(screen.getByRole("dialog", { name: "Terms" })).toBeInTheDocument();
  });

  it("takes the name passed to it over the Title", () => {
    renderBody(<X.Title>Terms</X.Title>, <X.Body aria-label="Terms text">Text</X.Body>);
    const body = screen.getByRole("region", { name: "Terms text" });
    expect(body).not.toHaveAttribute("aria-labelledby");
  });

  it("drops the name when the Title unmounts", () => {
    function Toggle({ title }: { title: boolean }) {
      return (
        <X.Root open>
          <X.Portal>
            <X.Popup aria-label="Terms">
              {title && <X.Title>Terms</X.Title>}
              <X.Body data-testid="body">Text</X.Body>
            </X.Popup>
          </X.Portal>
        </X.Root>
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
      <X.Title>Terms</X.Title>,
      <X.Body onFocus={(e) => (nameAtFocus = e.currentTarget.getAttribute("aria-labelledby"))}>
        Text
      </X.Body>,
    );
    await waitFor(() => expect(screen.getByRole("region", { name: "Terms" })).toHaveFocus());
    expect(nameAtFocus).toBeTruthy();
  });

  it("has no a11y violations", async () => {
    const { container } = renderBody(
      <>
        <X.Title>Terms</X.Title>
        <X.Description>Read before you accept.</X.Description>
      </>,
      <X.Body>
        <p>Text</p>
      </X.Body>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

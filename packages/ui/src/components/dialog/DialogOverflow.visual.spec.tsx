import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { boxOf, describeMotionPaths, waitForStable } from "../../VisualTest.utils";
import { Dialog } from "./index";

// Geometry only, no screenshots. Both paths: CSS transitions (reduced motion) and Motion springs.

/** Close at the top takes the initial focus, Accept sits after the content. */
async function openDialog(content: ReactNode) {
  render(
    <Dialog.Root defaultOpen>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup data-testid="popup">
          <Dialog.Title>Terms</Dialog.Title>
          <Dialog.Close>Close</Dialog.Close>
          {content}
          <button type="button">Accept</button>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>,
  );
  const popup = await screen.findByTestId("popup");
  await waitForStable(() => boxOf(popup));
  return popup;
}

/** The inside-scroll layout: nothing tabbable above the Body, the actions below it. */
async function openWithBody(content: ReactNode) {
  render(
    <Dialog.Root defaultOpen>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup data-testid="popup">
          <Dialog.Title>Terms</Dialog.Title>
          <Dialog.Body>{content}</Dialog.Body>
          <div>
            <Dialog.Close>Cancel</Dialog.Close>
            <button type="button">Accept</button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>,
  );
  const popup = await screen.findByTestId("popup");
  await waitForStable(() => boxOf(popup));
  return { popup, body: screen.getByRole("region", { name: "Terms" }) };
}

/** `inner` lies inside `outer` and inside the viewport. */
function expectInView(outer: Element, inner: Element) {
  const o = boxOf(outer);
  const i = boxOf(inner);
  expect(i.top).toBeGreaterThanOrEqual(Math.max(o.top, 0));
  expect(i.bottom).toBeLessThanOrEqual(Math.min(o.bottom, window.innerHeight));
}

describeMotionPaths("Dialog", () => {
  it("keeps tall content inside the viewport, title visible, and scrolls to the control focus moves to", async () => {
    const popup = await openDialog(<div style={{ height: 2000 }} />);

    const box = boxOf(popup);
    expect(box.top).toBeGreaterThanOrEqual(0);
    expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
    const title = boxOf(screen.getByRole("heading", { name: "Terms" }));
    expect(title.top).toBeGreaterThanOrEqual(box.top);
    expect(title.bottom).toBeLessThanOrEqual(box.bottom);

    await userEvent.tab();
    const accept = screen.getByRole("button", { name: "Accept" });
    await expect.element(accept).toHaveFocus();
    const button = await waitForStable(() => boxOf(accept));
    expect(button.top).toBeGreaterThanOrEqual(Math.max(box.top, 0));
    expect(button.bottom).toBeLessThanOrEqual(Math.min(box.bottom, window.innerHeight));
  });

  it("sizes short content to fit, centred", async () => {
    const popup = await openDialog(<p>Short terms.</p>);

    expect(popup.scrollHeight).toBe(popup.clientHeight);
    const box = boxOf(popup);
    expect((box.top + box.bottom) / 2).toBeCloseTo(window.innerHeight / 2, 0);
  });

  it("with a Body, opens at the top with the title and actions in view and scrolls only the body", async () => {
    const { popup, body } = await openWithBody(<div style={{ height: 2000 }} />);

    const box = boxOf(popup);
    expect(box.top).toBeGreaterThanOrEqual(0);
    expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
    const title = screen.getByRole("heading", { name: "Terms" });
    const accept = screen.getByRole("button", { name: "Accept" });
    // The body is the first tab stop, so it takes the initial focus, scrolled to its top
    await expect.element(body).toHaveFocus();
    expect(body.scrollTop).toBe(0);
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    expect(popup.scrollHeight).toBe(popup.clientHeight);
    expectInView(popup, title);
    expectInView(popup, accept);

    await userEvent.keyboard("{End}");
    await expect.poll(() => body.scrollTop).toBe(body.scrollHeight - body.clientHeight);
    expect(popup.scrollTop).toBe(0);
    expectInView(popup, title);
    expectInView(popup, accept);
  });

  it("with a Body, sizes short content to fit, centred", async () => {
    const { popup, body } = await openWithBody(<p>Short terms.</p>);

    expect(body.scrollHeight).toBe(body.clientHeight);
    expect(popup.scrollHeight).toBe(popup.clientHeight);
    const box = boxOf(popup);
    expect((box.top + box.bottom) / 2).toBeCloseTo(window.innerHeight / 2, 0);
  });
});

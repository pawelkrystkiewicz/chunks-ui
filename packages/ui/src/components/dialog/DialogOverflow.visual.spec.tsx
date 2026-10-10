import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { reloadMotion } from "../../lib/use-motion";
import { waitForStable } from "../../VisualTest.utils";
import { Dialog } from "./index";

// Geometry only, no screenshots. Both paths: CSS transitions (reduced motion) and Motion springs.
const MOTION = ["reduce", "no-preference"] as const;

const boxOf = (el: Element) => {
  const { top, bottom, left, right } = el.getBoundingClientRect();
  return { top, bottom, left, right };
};

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

describe.each(MOTION)("Dialog with reduced motion: %s", (reducedMotion) => {
  // Motion loaded before the popup opens, so the no-preference case runs the spring path
  beforeAll(() => reloadMotion());
  afterAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));

  it("keeps content taller than the viewport inside it, title visible", async () => {
    await commands.emulateMedia({ reducedMotion });
    const popup = await openDialog(<div style={{ height: 2000 }} />);

    const box = boxOf(popup);
    expect(box.top).toBeGreaterThanOrEqual(0);
    expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
    const title = boxOf(screen.getByRole("heading", { name: "Terms" }));
    expect(title.top).toBeGreaterThanOrEqual(box.top);
    expect(title.bottom).toBeLessThanOrEqual(box.bottom);
  });

  it("scrolls tall content to the control focus moves to", async () => {
    await commands.emulateMedia({ reducedMotion });
    const popup = await openDialog(<div style={{ height: 2000 }} />);

    await userEvent.tab();
    const accept = screen.getByRole("button", { name: "Accept" });
    await expect.element(accept).toHaveFocus();
    const button = await waitForStable(() => boxOf(accept));
    const box = boxOf(popup);
    expect(button.top).toBeGreaterThanOrEqual(Math.max(box.top, 0));
    expect(button.bottom).toBeLessThanOrEqual(Math.min(box.bottom, window.innerHeight));
  });

  it("sizes short content to fit, centred", async () => {
    await commands.emulateMedia({ reducedMotion });
    const popup = await openDialog(<p>Short terms.</p>);

    expect(popup.scrollHeight).toBe(popup.clientHeight);
    const box = boxOf(popup);
    expect((box.top + box.bottom) / 2).toBeCloseTo(window.innerHeight / 2, 0);
  });
});

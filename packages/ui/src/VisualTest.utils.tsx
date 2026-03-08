import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { page } from "vitest/browser";

/** Renders children in a padded fixture wrapper. Returns the wrapper element for screenshotting. */
export async function renderFixture(children: ReactNode) {
  const result = render(
    <div
      data-testid="fixture"
      style={{ padding: 40, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      {children}
    </div>,
  );
  await document.fonts.ready;
  return { ...result, fixture: result.getByTestId("fixture") };
}

/** For portal-based components (Dialog, Drawer, Tooltip, etc.) that render fixed-position content. */
export async function renderPage(children: ReactNode) {
  render(children);
  await document.fonts.ready;
  return page.elementLocator(document.body);
}

/** Pauses all CSS animations — use for components with loaders/spinners. */
export function pauseAnimations() {
  for (const el of document.querySelectorAll("*")) {
    (el as HTMLElement).style.animationPlayState = "paused";
  }
}

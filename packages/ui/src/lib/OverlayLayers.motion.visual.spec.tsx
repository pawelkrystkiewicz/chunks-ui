import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { AppBars, expectAboveAppBars, overlap, overlays } from "../VisualTest.overlays";
import { waitForStable } from "../VisualTest.utils";
import { reloadMotion } from "./use-motion";

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const coversBothBars = (popup: Element) =>
  ["fixed bar", "sticky bar"].every((bar) =>
    overlap(popup.getBoundingClientRect(), page.getByTestId(bar).element().getBoundingClientRect()),
  );

// Runs with reduced motion off, so the overlays slide and scale in with Motion. The page-level
// cases in PortalContainer.visual.spec.tsx check the same layering on the CSS path.
describe("overlays opened from the page, animated with Motion", () => {
  it.each(["Dialog", "Drawer"] as const)(
    "keeps a %s above fixed and sticky app bars while it animates in",
    async (name) => {
      // Resolves once use-motion holds the module, so the overlay opens on the Motion path
      await reloadMotion();
      const Overlay = overlays[name];
      render(
        <>
          <Overlay name={name} />
          <AppBars />
        </>,
      );
      await page.getByRole("button", { name: `Open ${name}` }).click();
      const popupLocator = page.getByRole("dialog", { name });
      await expect.element(popupLocator).toBeInTheDocument();
      const popup = popupLocator.element() as HTMLElement;
      const backdrop = page.getByTestId(`${name} backdrop`).element();

      // Mid-animation: the first frame in which the popup moved and already covers both bars
      let previous = JSON.stringify(popup.getBoundingClientRect());
      let sampled: string | undefined;
      for (let frame = 0; frame < 120 && !sampled; frame++) {
        await nextFrame();
        const current = JSON.stringify(popup.getBoundingClientRect());
        const moving = current !== previous;
        previous = current;
        if (!moving || !coversBothBars(popup)) continue;
        expect(popup.style.transform, `${name} animated by Motion`).not.toBe("");
        expectAboveAppBars(name, popup, backdrop);
        sampled = current;
      }
      expect(sampled, `${name} caught while animating in`).toBeDefined();

      const settled = await waitForStable(() => popup.getBoundingClientRect());
      // The sample was taken before the popup came to rest
      expect(JSON.stringify(settled)).not.toBe(sampled);
      expectAboveAppBars(name, popup, backdrop);
    },
  );
});

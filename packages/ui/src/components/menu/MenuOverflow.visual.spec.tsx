import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { reloadMotion } from "../../lib/use-motion";
import { eachPaintedFrame, waitForStable } from "../../VisualTest.utils";
import { Menu } from "./index";

// More items than fit below the trigger in the test viewport. No screenshots are taken.
const items = Array.from({ length: 80 }, (_, i) => `Item ${i + 1}`);

function LongMenu() {
  return (
    <div style={{ padding: 40 }}>
      <Menu.Root>
        <Menu.Trigger>Options</Menu.Trigger>
        <Menu.Content data-testid="popup">
          {items.map((item) => (
            <Menu.Item key={item}>{item}</Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Root>
    </div>
  );
}

const boxOf = (el: Element) => {
  const { top, bottom, left, right } = el.getBoundingClientRect();
  return { top, bottom, left, right };
};

async function openLongMenu() {
  render(<LongMenu />);
  await userEvent.click(screen.getByRole("button", { name: "Options" }));
  const popup = await screen.findByTestId("popup");
  await waitForStable(() => boxOf(popup));
  return popup;
}

describe("Menu with many items", () => {
  it("keeps the popup inside the viewport", async () => {
    const popup = await openLongMenu();

    const box = boxOf(popup);
    expect(box.top).toBeGreaterThanOrEqual(0);
    expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
  });

  it("scrolls the highlighted item into view as the keyboard moves to the end", async () => {
    const popup = await openLongMenu();

    await userEvent.keyboard("{End}");
    const last = screen.getByRole("menuitem", { name: "Item 80" });
    await expect.poll(() => last.hasAttribute("data-highlighted")).toBe(true);

    // The items scroll inside the popup, which stays where it opened
    const item = await waitForStable(() => boxOf(last));
    const box = boxOf(popup);
    expect(item.top).toBeGreaterThanOrEqual(box.top);
    expect(item.bottom).toBeLessThanOrEqual(box.bottom);
    expect(box.top).toBeGreaterThanOrEqual(0);
    expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
  });
});

describe("Menu popup while it opens without Motion", () => {
  afterEach(async () => {
    await commands.emulateMedia({ reducedMotion: "reduce" });
    await reloadMotion();
  });

  it("keeps its height from the first painted frame", async () => {
    // CSS transition fallback: Motion never arrives, and reduced motion is off
    void reloadMotion(new Promise(() => {}));
    await commands.emulateMedia({ reducedMotion: "no-preference" });
    await expect.poll(() => matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(false);
    render(<LongMenu />);

    const heights = eachPaintedFrame(
      // Layout height, so the opening scale doesn't count
      () =>
        (document.querySelector('[data-testid="popup"]') as HTMLElement | null)?.offsetHeight ??
        null,
      40,
    );
    await userEvent.click(screen.getByRole("button", { name: "Options" }));
    const popup = document.querySelector('[data-testid="popup"]') as HTMLElement;
    // Base UI rewrites --available-height as the space changes (viewport resize, scroll):
    // the CSS fallback must not animate the max-height that follows it
    const animated = getComputedStyle(popup)
      .transitionProperty.split(",")
      .map((p) => p.trim());
    expect(animated).not.toContain("all");
    expect(animated).not.toContain("max-height");

    const painted = (await heights).filter((bottom) => bottom !== null);

    expect(painted.length).toBeGreaterThan(0);
    // Fits the viewport on every frame, and is not still resizing from another height
    expect(Math.max(...painted)).toBeLessThanOrEqual(window.innerHeight);
    expect(new Set(painted).size).toBe(1);
  });
});

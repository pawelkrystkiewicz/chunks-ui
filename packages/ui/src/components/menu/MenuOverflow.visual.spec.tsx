import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { waitForStable } from "../../VisualTest.utils";
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

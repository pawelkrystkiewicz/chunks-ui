import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { waitForStable } from "../../VisualTest.utils";
import { Combobox } from "./index";

// More items than fit below the input in the test viewport. No screenshots are taken.
const items = Array.from({ length: 80 }, (_, i) => `Item ${i + 1}`);

function LongCombobox() {
  return (
    <div style={{ padding: 40 }}>
      <Combobox.Root items={items}>
        <Combobox.Input aria-label="Item" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup data-testid="popup">
              <Combobox.List>
                {(item: string) => (
                  <Combobox.Item key={item} value={item}>
                    {item}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </div>
  );
}

const boxOf = (el: Element) => {
  const { top, bottom, left, right } = el.getBoundingClientRect();
  return { top, bottom, left, right };
};

async function openLongCombobox() {
  render(<LongCombobox />);
  await userEvent.click(screen.getByRole("combobox", { name: "Item" }));
  const popup = await screen.findByTestId("popup");
  await waitForStable(() => boxOf(popup));
  return popup;
}

describe("Combobox with a long list", () => {
  it("keeps the popup inside the viewport", async () => {
    const popup = await openLongCombobox();

    const box = boxOf(popup);
    expect(box.top).toBeGreaterThanOrEqual(0);
    expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
  });

  it("scrolls the highlighted item into view as the keyboard moves to the end", async () => {
    const popup = await openLongCombobox();

    // ArrowUp from no highlight wraps to the last item
    await userEvent.keyboard("{ArrowUp}");
    const last = screen.getByRole("option", { name: "Item 80" });
    await expect.poll(() => last.hasAttribute("data-highlighted")).toBe(true);

    // The list scrolls inside the popup, which stays where it opened
    const item = await waitForStable(() => boxOf(last));
    const box = boxOf(popup);
    expect(item.top).toBeGreaterThanOrEqual(box.top);
    expect(item.bottom).toBeLessThanOrEqual(box.bottom);
    expect(box.top).toBeGreaterThanOrEqual(0);
    expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
  });
});

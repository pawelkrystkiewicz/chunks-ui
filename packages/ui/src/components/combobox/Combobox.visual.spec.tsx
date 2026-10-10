import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { renderFixture, renderPage } from "../../VisualTest.utils";
import { Combobox } from "./index";

const options = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "angular", label: "Angular" },
  { value: "svelte", label: "Svelte" },
];

// Combobox.Empty reads the filtered `items` on Root: without them it counts no matches and
// shows its message under the items
const combobox = ({ defaultOpen = false } = {}) => (
  <Combobox.Root items={options} defaultOpen={defaultOpen}>
    <Combobox.Input placeholder="Search framework..." />
    <Combobox.Portal>
      <Combobox.Positioner>
        <Combobox.Popup>
          <Combobox.List>
            {(item: (typeof options)[number]) => (
              <Combobox.Item key={item.value} value={item}>
                <Combobox.ItemIndicator />
                {item.label}
              </Combobox.Item>
            )}
          </Combobox.List>
          <Combobox.Empty>No results found</Combobox.Empty>
        </Combobox.Popup>
      </Combobox.Positioner>
    </Combobox.Portal>
  </Combobox.Root>
);

describe("Combobox", () => {
  it("closed", async () => {
    const { fixture } = await renderFixture(<div style={{ width: 250 }}>{combobox()}</div>);
    await expect(fixture).toMatchScreenshot();
  });

  it("open", async () => {
    const body = await renderPage(
      <div style={{ padding: 40 }}>{combobox({ defaultOpen: true })}</div>,
    );
    await expect(body).toMatchScreenshot();
  });

  // Combobox.Empty stays mounted as a live region, so while items match it must take no space
  it("leaves no gap under the items, and shows the empty message when nothing matches", async () => {
    await renderPage(<div style={{ padding: 40 }}>{combobox({ defaultOpen: true })}</div>);
    await expect.element(page.getByRole("option", { name: "Svelte" })).toBeVisible();
    const empty = page.getByRole("status").element();
    expect(empty.textContent).toBe("");
    expect(empty.getBoundingClientRect().height).toBe(0);

    await page.getByRole("combobox").fill("zzz");
    await expect.element(page.getByText("No results found")).toBeVisible();
    expect(empty.getBoundingClientRect().height).toBeGreaterThan(0);
  });
});

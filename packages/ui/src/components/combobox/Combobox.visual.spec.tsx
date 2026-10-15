import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { focusVisible, renderFixture, renderPage } from "../../VisualTest.utils";
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

// The docs' multi-select: the Control draws the ring (`has-[:focus-visible]`) while the input
// inside it has focus, and the input's own ring is off
const chipsCombobox = () => (
  <Combobox.Root multiple items={options} defaultValue={options.slice(0, 2)}>
    <Combobox.Control>
      <Combobox.Chips>
        {options.slice(0, 2).map((item) => (
          <Combobox.Chip key={item.value}>
            {item.label}
            <Combobox.ChipRemove />
          </Combobox.Chip>
        ))}
      </Combobox.Chips>
      <Combobox.Input
        className="h-7 min-w-20 flex-1 border-0 bg-transparent px-0 focus-visible:outline-none"
        placeholder="Select framework..."
        aria-label="Frameworks"
      />
      <Combobox.Clear />
      <Combobox.Trigger />
    </Combobox.Control>
  </Combobox.Root>
);

describe("Combobox", () => {
  it("closed", async () => {
    const { fixture } = await renderFixture(<div style={{ width: 250 }}>{combobox()}</div>);
    await expect(fixture).toMatchScreenshot();
  });

  // Keyboard focus shows the ring: 2px of --ring, 2px outside the input
  it("input focus-visible", async () => {
    const { fixture, getByRole } = await renderFixture(
      <div style={{ width: 250 }}>{combobox()}</div>,
    );
    const input = getByRole("combobox");
    focusVisible(input);
    await expect(fixture).toMatchScreenshot();
  });

  // The same ring on the Control, 2px outside the wrapper around the chips and the input
  it("control focus-visible", async () => {
    const { fixture, getByRole } = await renderFixture(
      <div style={{ width: 300 }}>{chipsCombobox()}</div>,
    );
    const input = getByRole("combobox");
    focusVisible(input);
    expect(getComputedStyle(input).outlineStyle).toBe("none");
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

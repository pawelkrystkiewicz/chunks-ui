import { describe, it } from "vitest";
import { renderFixture, renderPage } from "../../VisualTest.utils";
import { Combobox } from "./index";

const options = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "angular", label: "Angular" },
  { value: "svelte", label: "Svelte" },
];

describe("Combobox", () => {
  it("closed", async () => {
    const { fixture } = await renderFixture(
      <div style={{ width: 250 }}>
        <Combobox.Root>
          <Combobox.Input placeholder="Search framework..." />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  {options.map((o) => (
                    <Combobox.Item key={o.value} value={o.value}>
                      <Combobox.ItemIndicator />
                      {o.label}
                    </Combobox.Item>
                  ))}
                  <Combobox.Empty>No results found</Combobox.Empty>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("open", async () => {
    const body = await renderPage(
      <div style={{ padding: 40 }}>
        <Combobox.Root defaultOpen>
          <Combobox.Input placeholder="Search framework..." />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  {options.map((o) => (
                    <Combobox.Item key={o.value} value={o.value}>
                      <Combobox.ItemIndicator />
                      {o.label}
                    </Combobox.Item>
                  ))}
                  <Combobox.Empty>No results found</Combobox.Empty>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
      </div>,
    );
    await expect(body).toMatchScreenshot();
  });
});

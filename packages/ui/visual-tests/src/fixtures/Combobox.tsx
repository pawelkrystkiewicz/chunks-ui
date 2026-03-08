import { Combobox } from "../../../src/components/combobox";

const options = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "angular", label: "Angular" },
  { value: "svelte", label: "Svelte" },
];

export function Closed() {
  return (
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
    </div>
  );
}

export function Open() {
  return (
    <div style={{ width: 250 }}>
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
    </div>
  );
}

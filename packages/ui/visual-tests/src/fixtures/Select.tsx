import { Select } from "../../../src/components/select";

const fruits = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "date", label: "Date" },
];

export function Closed() {
  return (
    <div style={{ width: 200 }}>
      <Select.Root defaultValue="apple">
        <Select.Trigger>
          <Select.Value />
          <Select.Icon />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              {fruits.map((f) => (
                <Select.Item key={f.value} value={f.value}>
                  <Select.ItemIndicator />
                  <Select.ItemText>{f.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

export function Open() {
  return (
    <div style={{ width: 200 }}>
      <Select.Root defaultValue="banana" defaultOpen>
        <Select.Trigger>
          <Select.Value />
          <Select.Icon />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              {fruits.map((f) => (
                <Select.Item key={f.value} value={f.value}>
                  <Select.ItemIndicator />
                  <Select.ItemText>{f.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

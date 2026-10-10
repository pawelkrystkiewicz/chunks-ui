"use client";

import { Combobox } from "chunks-ui";
import { useState } from "react";

type Option = { value: string; label: string };
type OptionGroup = { value: string; items: Option[] };

const fruits: Option[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "grape", label: "Grape" },
  { value: "mango", label: "Mango" },
];

const colors: OptionGroup[] = [
  {
    value: "Warm",
    items: [
      { value: "red", label: "Red" },
      { value: "orange", label: "Orange" },
      { value: "yellow", label: "Yellow" },
    ],
  },
  {
    value: "Cool",
    items: [
      { value: "blue", label: "Blue" },
      { value: "green", label: "Green" },
      { value: "purple", label: "Purple" },
    ],
  },
];

const frameworks: Option[] = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "svelte", label: "Svelte" },
  { value: "angular", label: "Angular" },
  { value: "solid", label: "Solid" },
];

export function ComboboxBasicDemo() {
  return (
    <Combobox.Root items={fruits}>
      <div className="relative">
        <Combobox.Input placeholder="Search a fruit..." aria-label="Fruit" />
        <Combobox.Trigger />
      </div>
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.List>
              {(item: Option) => (
                <Combobox.Item key={item.value} value={item}>
                  {item.label}
                  <Combobox.ItemIndicator />
                </Combobox.Item>
              )}
            </Combobox.List>
            <Combobox.Empty>No results found.</Combobox.Empty>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

export function ComboboxClearDemo() {
  return (
    <Combobox.Root items={fruits}>
      <div className="relative">
        <Combobox.Input placeholder="Search a fruit..." aria-label="Fruit" />
        <Combobox.Clear />
        <Combobox.Trigger />
      </div>
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.List>
              {(item: Option) => (
                <Combobox.Item key={item.value} value={item}>
                  {item.label}
                  <Combobox.ItemIndicator />
                </Combobox.Item>
              )}
            </Combobox.List>
            <Combobox.Empty>No results found.</Combobox.Empty>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

export function ComboboxGroupedDemo() {
  return (
    <Combobox.Root items={colors}>
      <div className="relative">
        <Combobox.Input placeholder="Pick a color..." aria-label="Color" />
        <Combobox.Trigger />
      </div>
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.List>
              {(group: OptionGroup) => (
                <Combobox.Group key={group.value} items={group.items}>
                  <Combobox.GroupLabel>{group.value}</Combobox.GroupLabel>
                  {group.items.map((item) => (
                    <Combobox.Item key={item.value} value={item}>
                      {item.label}
                      <Combobox.ItemIndicator />
                    </Combobox.Item>
                  ))}
                </Combobox.Group>
              )}
            </Combobox.List>
            <Combobox.Empty>No results found.</Combobox.Empty>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

export function ComboboxMultiDemo() {
  const [value, setValue] = useState<Option[]>([]);

  return (
    <Combobox.Root multiple items={frameworks} value={value} onValueChange={setValue}>
      <Combobox.Control>
        <Combobox.Chips>
          {value.map((item) => (
            <Combobox.Chip key={item.value}>
              {item.label}
              <Combobox.ChipRemove />
            </Combobox.Chip>
          ))}
        </Combobox.Chips>
        <Combobox.Input
          className="h-7 min-w-20 flex-1 border-0 bg-transparent px-0 focus-visible:outline-none"
          placeholder="Select frameworks..."
          aria-label="Frameworks"
        />
        <Combobox.Clear />
        <Combobox.Trigger />
      </Combobox.Control>
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.List>
              {(item: Option) => (
                <Combobox.Item key={item.value} value={item}>
                  {item.label}
                  <Combobox.ItemIndicator />
                </Combobox.Item>
              )}
            </Combobox.List>
            <Combobox.Empty>No results found.</Combobox.Empty>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

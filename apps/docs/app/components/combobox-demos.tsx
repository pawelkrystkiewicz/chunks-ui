"use client";

import { Combobox } from "chunks-ui";
import { useState } from "react";

const fruits = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "grape", label: "Grape" },
  { value: "mango", label: "Mango" },
];

const colors = [
  { value: "red", label: "Red" },
  { value: "orange", label: "Orange" },
  { value: "yellow", label: "Yellow" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "purple", label: "Purple" },
];

const frameworks = [
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
        <Combobox.Input placeholder="Search a fruit..." />
        <Combobox.Trigger />
      </div>
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.List>
              {(item: { value: string; label: string }) => (
                <Combobox.Item key={item.value} value={item.value}>
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
        <Combobox.Input placeholder="Search a fruit..." />
        <Combobox.Clear />
        <Combobox.Trigger />
      </div>
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.List>
              {(item: { value: string; label: string }) => (
                <Combobox.Item key={item.value} value={item.value}>
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
        <Combobox.Input placeholder="Pick a color..." />
        <Combobox.Trigger />
      </div>
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.Group>
              <Combobox.GroupLabel>Warm</Combobox.GroupLabel>
              <Combobox.List>
                {(item: { value: string; label: string }) => (
                  <Combobox.Item key={item.value} value={item.value}>
                    {item.label}
                    <Combobox.ItemIndicator />
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Group>
            <Combobox.Empty>No results found.</Combobox.Empty>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

export function ComboboxMultiDemo() {
  const [value, setValue] = useState<string[]>([]);

  return (
    <Combobox.Root multiple items={frameworks} value={value} onValueChange={setValue}>
      <Combobox.Control>
        <Combobox.Chips>
          {value.map((v) => {
            const item = frameworks.find((f) => f.value === v);
            return (
              <Combobox.Chip key={v}>
                {item?.label ?? v}
                <Combobox.ChipRemove />
              </Combobox.Chip>
            );
          })}
        </Combobox.Chips>
        <Combobox.Input
          className="h-7 min-w-20 flex-1 border-0 bg-transparent px-0 focus-visible:outline-none"
          placeholder="Select frameworks..."
        />
        <Combobox.Clear />
        <Combobox.Trigger />
      </Combobox.Control>
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.List>
              {(item: { value: string; label: string }) => (
                <Combobox.Item key={item.value} value={item.value}>
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

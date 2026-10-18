"use client";

import { Combobox } from "chunks-ui";
import { useState } from "react";
import { Container } from "@/components";

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
        <Combobox.Chips className="flex-1">
          {value.map((item) => (
            <Combobox.Chip key={item.value}>
              {item.label}
              <Combobox.ChipRemove />
            </Combobox.Chip>
          ))}
          <Combobox.Input
            className="h-7 min-w-20 flex-1 border-0 bg-transparent px-0"
            placeholder="Select frameworks..."
            aria-label="Frameworks"
          />
        </Combobox.Chips>
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

export function ComboboxTriggerSearchExample() {
  return (
    <Container className="w-64">
      <Combobox.Root items={fruits}>
        <Combobox.Trigger
          aria-label="Favorite fruit"
          className="static h-ui-height w-full rounded-md border border-input bg-background px-3 text-sm max-md:text-base md:[@media(pointer:coarse)]:text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Combobox.Value placeholder="Pick a fruit" />
          <Combobox.Icon />
        </Combobox.Trigger>
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup aria-label="Fruits" className="flex flex-col overflow-hidden">
              <Combobox.Input
                placeholder="Search..."
                aria-label="Search fruits"
                className="mb-1 shrink-0 pe-3"
              />
              <Combobox.List className="min-h-0 overflow-y-auto overscroll-contain scroll-py-1">
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
    </Container>
  );
}

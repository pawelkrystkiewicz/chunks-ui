"use client";

import { Combobox } from "chunks-ui";
import { Container } from "@/components";

type Option = { value: string; label: string };

const fruits: Option[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "grape", label: "Grape" },
  { value: "mango", label: "Mango" },
];

export function ComboboxTriggerSearchExample() {
  return (
    <Container className="w-64">
      <Combobox.Root items={fruits}>
        <Combobox.Trigger
          aria-label="Fruit"
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

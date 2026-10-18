"use client";

import { Select } from "chunks-ui";
import { Container } from "@/components";

const fruits = {
  apple: "Apple",
  banana: "Banana",
  cherry: "Cherry",
  strawberry: "Strawberry",
};

export function SelectBasicExample() {
  return (
    <Container className="w-64">
      <Select.Root items={fruits}>
        <Select.Trigger aria-label="Fruit">
          <Select.Value placeholder="Choose a fruit" />
          <Select.Icon />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner sideOffset={5} alignItemWithTrigger={false}>
            <Select.Popup>
              <Select.Item value="apple">
                <Select.ItemText>Apple</Select.ItemText>
                <Select.ItemIndicator />
              </Select.Item>
              <Select.Item value="banana">
                <Select.ItemText>Banana</Select.ItemText>
                <Select.ItemIndicator />
              </Select.Item>
              <Select.Item value="cherry">
                <Select.ItemText>Cherry</Select.ItemText>
                <Select.ItemIndicator />
              </Select.Item>
              <Select.Item value="strawberry" disabled>
                <Select.ItemText>Strawberry</Select.ItemText>
                <Select.ItemIndicator />
              </Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </Container>
  );
}

const colors = {
  red: "Red",
  orange: "Orange",
  blue: "Blue",
  green: "Green",
};

export function SelectGroupedExample() {
  return (
    <Container className="w-64">
      <Select.Root items={colors}>
        <Select.Trigger aria-label="Color">
          <Select.Value placeholder="Pick a color" />
          <Select.Icon />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner sideOffset={5} alignItemWithTrigger={false}>
            <Select.Popup>
              <Select.Group>
                <Select.GroupLabel className="uppercase">Warm</Select.GroupLabel>
                <Select.Item value="red">
                  <Select.ItemText>Red</Select.ItemText>
                  <Select.ItemIndicator />
                </Select.Item>
                <Select.Item value="orange">
                  <Select.ItemText>Orange</Select.ItemText>
                  <Select.ItemIndicator />
                </Select.Item>
              </Select.Group>
              <Select.Group>
                <Select.GroupLabel className="uppercase">Cool</Select.GroupLabel>
                <Select.Item value="blue">
                  <Select.ItemText>Blue</Select.ItemText>
                  <Select.ItemIndicator />
                </Select.Item>
                <Select.Item value="green">
                  <Select.ItemText>Green</Select.ItemText>
                  <Select.ItemIndicator />
                </Select.Item>
              </Select.Group>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </Container>
  );
}

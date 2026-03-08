import { ToggleGroup } from "../../../src/components/toggle-group";

export function Single() {
  return (
    <ToggleGroup.Root defaultValue={["center"]}>
      <ToggleGroup.Item value="left">Left</ToggleGroup.Item>
      <ToggleGroup.Item value="center">Center</ToggleGroup.Item>
      <ToggleGroup.Item value="right">Right</ToggleGroup.Item>
    </ToggleGroup.Root>
  );
}

export function WithDisabled() {
  return (
    <ToggleGroup.Root defaultValue={["a"]}>
      <ToggleGroup.Item value="a">A</ToggleGroup.Item>
      <ToggleGroup.Item value="b" disabled>
        B
      </ToggleGroup.Item>
      <ToggleGroup.Item value="c">C</ToggleGroup.Item>
    </ToggleGroup.Root>
  );
}

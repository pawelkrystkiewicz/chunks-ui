import { Button } from "../../../src/components/button";
import { Popover } from "../../../src/components/popover";

export function Open() {
  return (
    <Popover.Root defaultOpen>
      <Popover.Trigger render={<Button variant="outlined" />}>Trigger</Popover.Trigger>
      <Popover.Content>
        <Popover.Arrow />
        <Popover.Title>Popover Title</Popover.Title>
        <Popover.Description>Popover description content goes here.</Popover.Description>
      </Popover.Content>
    </Popover.Root>
  );
}

export function Trigger() {
  return (
    <Popover.Root>
      <Popover.Trigger render={<Button variant="outlined" />}>Open Popover</Popover.Trigger>
    </Popover.Root>
  );
}

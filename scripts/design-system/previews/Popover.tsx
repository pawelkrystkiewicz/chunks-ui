import { Button, Popover } from "chunks-ui";
import { mount, Row } from "./_shared";

mount(
  <Row className="items-start gap-40">
    <Popover.Root defaultOpen>
      <Popover.Trigger render={<Button variant="outlined" />}>More info</Popover.Trigger>
      <Popover.Content>
        <Popover.Title>Details</Popover.Title>
        <Popover.Description>This is additional context about the feature.</Popover.Description>
      </Popover.Content>
    </Popover.Root>
    <Popover.Root>
      <Popover.Trigger render={<Button variant="outlined" />}>Help</Popover.Trigger>
      <Popover.Content>
        <Popover.Arrow />
        <Popover.Title>Need help?</Popover.Title>
        <Popover.Description>Contact support at help@example.com.</Popover.Description>
      </Popover.Content>
    </Popover.Root>
  </Row>,
);

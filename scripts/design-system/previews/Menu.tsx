import { Button, Menu } from "chunks-ui";
import { mount, Row } from "./_shared";

mount(
  <Row className="items-start gap-40">
    <Menu.Root defaultOpen modal={false}>
      <Menu.Trigger render={<Button variant="outlined" />}>Options</Menu.Trigger>
      <Menu.Content>
        <Menu.Item>View profile</Menu.Item>
        <Menu.Item>Edit settings</Menu.Item>
        <Menu.Separator />
        <Menu.Item>Sign out</Menu.Item>
      </Menu.Content>
    </Menu.Root>
    <Menu.Root>
      <Menu.Trigger render={<Button variant="outlined" />}>Actions</Menu.Trigger>
      <Menu.Content>
        <Menu.Group>
          <Menu.GroupLabel>File</Menu.GroupLabel>
          <Menu.Item>New file</Menu.Item>
          <Menu.Item>Open...</Menu.Item>
          <Menu.Item>Save</Menu.Item>
        </Menu.Group>
        <Menu.Separator />
        <Menu.Group>
          <Menu.GroupLabel>Edit</Menu.GroupLabel>
          <Menu.Item>Undo</Menu.Item>
          <Menu.Item>Redo</Menu.Item>
        </Menu.Group>
      </Menu.Content>
    </Menu.Root>
  </Row>,
);

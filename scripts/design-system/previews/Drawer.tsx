import { Button, Drawer } from "chunks-ui";
import { mount, Row } from "./_shared";

mount(
  <Row>
    <Drawer.Root>
      <Drawer.Trigger render={<Button variant="outlined" />}>Open Drawer</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop />
        <Drawer.Popup>
          <Drawer.Title>Navigation</Drawer.Title>
          <Drawer.Description>Browse the app sections.</Drawer.Description>
          <nav className="mt-4 flex flex-col gap-2 text-sm">
            <a href="#home">Home</a>
            <a href="#theme">Theme</a>
          </nav>
          <div className="mt-6">
            <Drawer.Close render={<Button variant="outlined" color="secondary" />}>
              Close
            </Drawer.Close>
          </div>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  </Row>,
);

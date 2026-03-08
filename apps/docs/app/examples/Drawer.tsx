"use client";

import { Drawer } from "chunks-ui";
import { Container } from "@/components";

export function DrawerBasicExample() {
  return (
    <Container>
      <Drawer.Root>
        <Drawer.Trigger>Open Drawer</Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Backdrop />
          <Drawer.Popup>
            <Drawer.Title>Navigation</Drawer.Title>
            <Drawer.Description>Browse the app sections.</Drawer.Description>
            <nav className="mt-4 flex flex-col gap-2">
              <a href="/">Home</a>
              <a href="/settings">Settings</a>
            </nav>
            <Drawer.Close>Close</Drawer.Close>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>
    </Container>
  );
}

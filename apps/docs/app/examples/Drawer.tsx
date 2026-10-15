"use client";

import { Button, Drawer } from "chunks-ui";
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
              <a href="/theme">Theme</a>
            </nav>
            <Drawer.Close>Close</Drawer.Close>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>
    </Container>
  );
}

const SECTIONS = Array.from({ length: 12 }, (_, i) => `Section ${i + 1}`);

export function DrawerLongContentExample() {
  return (
    <Container>
      <Drawer.Root>
        <Drawer.Trigger>Read the terms</Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Backdrop />
          <Drawer.Popup>
            <Drawer.Title>Terms of service</Drawer.Title>
            <Drawer.Description>Read the terms before you accept them.</Drawer.Description>
            <Drawer.Body className="mt-4 space-y-3 text-sm">
              {SECTIONS.map((section) => (
                <p key={section}>
                  {section}. These terms apply to your use of the service. Keep your account details
                  safe and tell us when something looks wrong.
                </p>
              ))}
            </Drawer.Body>
            <div className="mt-4 flex justify-end gap-2">
              <Drawer.Close render={<Button variant="outlined" color="secondary" />}>
                Cancel
              </Drawer.Close>
              <Drawer.Close render={<Button />}>Accept</Drawer.Close>
            </div>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>
    </Container>
  );
}

"use client";

import { Button, Dialog } from "chunks-ui";
import { useState } from "react";
import { Container } from "@/components";

export function DialogBasicExample() {
  return (
    <Container>
      <Dialog.Root>
        <Dialog.Trigger>Open Dialog</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup>
            <Dialog.Title>Are you sure?</Dialog.Title>
            <Dialog.Description>This action cannot be undone.</Dialog.Description>
            <div className="mt-4 flex justify-end gap-2">
              <Dialog.Close>Cancel</Dialog.Close>
              <Button color="destructive">Delete</Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </Container>
  );
}

export function DialogBackdropExample() {
  return (
    <Container>
      <Dialog.Root>
        <Dialog.Trigger>Show</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup>
            <Dialog.Title>Dialog with backdrop</Dialog.Title>
            <Dialog.Description>
              The backdrop dims the content behind the dialog.
            </Dialog.Description>
            <Dialog.Close>Close</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </Container>
  );
}

export function DialogControlledExample() {
  const [open, setOpen] = useState(false);

  return (
    <Container>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup>
            <Dialog.Title>Controlled Dialog</Dialog.Title>
            <Dialog.Description>You can control the open state.</Dialog.Description>
            <Dialog.Close>Done</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </Container>
  );
}

const TERMS = Array.from({ length: 12 }, (_, i) => `Section ${i + 1}`);

export function DialogLongContentExample() {
  return (
    <Container>
      <Dialog.Root>
        <Dialog.Trigger>Read the terms</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup>
            <Dialog.Title>Terms of service</Dialog.Title>
            <Dialog.Description>Read the terms before you accept them.</Dialog.Description>
            <Dialog.Body className="mt-4 space-y-3 text-sm">
              {TERMS.map((section) => (
                <p key={section}>
                  {section}. These terms apply to your use of the service. Keep your account details
                  safe and tell us when something looks wrong.
                </p>
              ))}
            </Dialog.Body>
            <div className="mt-4 flex justify-end gap-2">
              <Dialog.Close render={<Button variant="outlined" color="secondary" />}>
                Cancel
              </Dialog.Close>
              <Dialog.Close render={<Button />}>Accept</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </Container>
  );
}

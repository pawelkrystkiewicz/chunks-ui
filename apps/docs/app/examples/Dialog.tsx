"use client";

import { Button, Dialog } from "chunks-ui";
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

import { Button, Dialog } from "chunks-ui";
import { mount, Row } from "./_shared";

mount(
  <Row>
    <Dialog.Root>
      <Dialog.Trigger render={<Button color="destructive" variant="outlined" />}>
        Delete project
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup>
          <Dialog.Title>Are you sure?</Dialog.Title>
          <Dialog.Description>This action cannot be undone.</Dialog.Description>
          <div className="mt-4 flex justify-end gap-2">
            <Dialog.Close render={<Button variant="text" color="secondary" />}>Cancel</Dialog.Close>
            <Button color="destructive">Delete</Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
    <Dialog.Root>
      <Dialog.Trigger render={<Button variant="outlined" />}>Show</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup>
          <Dialog.Title>Dialog with backdrop</Dialog.Title>
          <Dialog.Description>The backdrop dims the content behind the dialog.</Dialog.Description>
          <div className="mt-4 flex justify-end">
            <Dialog.Close render={<Button />}>Close</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  </Row>,
);

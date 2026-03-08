import { Button } from "../../../src/components/button";
import { Dialog } from "../../../src/components/dialog";

export function Open() {
  return (
    <Dialog.Root defaultOpen>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup>
          <Dialog.Title>Dialog Title</Dialog.Title>
          <Dialog.Description>This is a dialog description.</Dialog.Description>
          <div className="mt-4 flex justify-end gap-2">
            <Dialog.Close render={<Button variant="outlined" color="secondary" />}>
              Cancel
            </Dialog.Close>
            <Dialog.Close render={<Button />}>Confirm</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

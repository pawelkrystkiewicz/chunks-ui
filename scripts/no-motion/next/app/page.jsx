"use client";

// A client component: a server component cannot reach into `Dialog.Root` of a "use client"
// module. check-no-motion.ts looks for the trigger texts below in the exported HTML
// (NEXT_TRIGGERS there).
import { Dialog, Tooltip } from "chunks-ui";

export default function Page() {
  return (
    <main>
      <Dialog.Root>
        <Dialog.Trigger>Open the dialog</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup>
            <Dialog.Title>Built without Motion</Dialog.Title>
            <Dialog.Close>Close</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <Tooltip.Root>
        <Tooltip.Trigger>Hover for a tip</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup>A tip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </main>
  );
}

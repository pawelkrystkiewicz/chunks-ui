"use client";

import { Button, Dialog, IconButton, Separator } from "chunks-ui";
import { Archive, Copy, Download, Link, MoreHorizontal } from "lucide-react";
import { useRef } from "react";
import { focusOnOpen, OverlayHeader } from "./parts";

const ACTIONS = [
  { label: "Duplicate project", Icon: Copy },
  { label: "Copy share link", Icon: Link },
  { label: "Export tasks as CSV", Icon: Download },
];

const actionClass = "w-full justify-start gap-3 px-3";

export function ProjectActionsDialog() {
  // Opens on the first action, like a menu: it is harmless, and Archive sits last
  const firstAction = useRef<HTMLButtonElement>(null);

  return (
    <Dialog.Root>
      <Dialog.Trigger
        render={<IconButton aria-label="More" className="size-ui-height text-foreground" />}
      >
        <MoreHorizontal size={16} />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup
          initialFocus={focusOnOpen(firstAction)}
          className="flex w-[calc(100%-32px)] max-w-sm flex-col gap-4"
        >
          <OverlayHeader title="Project actions" description="acme-dashboard · Sprint 14" />
          <div className="-mx-3 flex flex-col gap-1">
            {ACTIONS.map(({ label, Icon }, i) => (
              <Dialog.Close
                key={label}
                ref={i === 0 ? firstAction : undefined}
                render={
                  <Button
                    variant="text"
                    color="secondary"
                    startIcon={<Icon size={16} />}
                    className={actionClass}
                  />
                }
              >
                {label}
              </Dialog.Close>
            ))}
            <Separator className="my-1" />
            <Dialog.Close
              render={
                <Button
                  variant="text"
                  color="destructive"
                  startIcon={<Archive size={16} />}
                  className={actionClass}
                />
              }
            >
              Archive project
            </Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

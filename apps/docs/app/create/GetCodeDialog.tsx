"use client";

import { CopyButton, Dialog, IconButton } from "chunks-ui";
import { Copy, X } from "lucide-react";
import { buildCss, type Theme } from "./theme-model";

export function GetCodeDialog({
  theme,
  open,
  onOpenChange,
}: {
  theme: Theme;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const css = open ? buildCss(theme) : "";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="bg-[oklch(0_0_0/0.4)]" />
        <Dialog.Popup className="flex max-h-[calc(100vh-48px)] w-[calc(100%-48px)] max-w-[640px] flex-col overflow-hidden rounded-[14px] p-0 shadow-[0_24px_64px_-16px_oklch(0_0_0/0.3)]">
          <div className="flex items-start justify-between gap-4 pt-5 pr-5 pb-4 pl-6">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-[17px] tracking-[-0.01em]">Theme CSS</Dialog.Title>
              <Dialog.Description className="text-[13px]">
                Paste after your <code className="font-mono text-xs">chunks-ui</code> import. Light
                and dark included.
              </Dialog.Description>
            </div>
            <Dialog.Close
              render={<IconButton variant="text" color="secondary" aria-label="Close" />}
              className="rounded-lg hover:bg-secondary"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <pre className="min-h-0 flex-1 overflow-auto border-border border-y bg-muted/40 px-6 py-4 font-mono text-xs leading-[1.7]">
            {css}
          </pre>
          <div className="flex items-center justify-between gap-3 py-3.5 pr-4 pl-6">
            <span className="font-mono text-[11.5px] text-muted-foreground">
              {css.match(/--/g)?.length ?? 0} tokens
            </span>
            <CopyButton
              value={css}
              timeout={1600}
              className="h-9 w-auto min-w-[116px] gap-2 rounded-lg bg-foreground px-4 font-medium text-[13px] text-background hover:bg-foreground hover:opacity-88 active:scale-[0.97]"
            >
              {({ copied }) => (
                <>
                  <Copy className="size-[15px]" />
                  {copied ? "Copied" : "Copy CSS"}
                </>
              )}
            </CopyButton>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

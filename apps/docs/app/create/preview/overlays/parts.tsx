import { Dialog, Field, IconButton, Select } from "chunks-ui";
import { X } from "lucide-react";
import type { Ref, RefObject } from "react";

/**
 * `initialFocus` for a Popup: focus `ref` (the first field or action) instead of
 * the close button. A touch open keeps Base UI's default, the popup itself, so
 * no virtual keyboard opens.
 */
export const focusOnOpen = (ref: RefObject<HTMLElement | null>) => (openType: string) =>
  openType === "touch" || ref.current;

/** Title, description and a close button. Drawer parts are Dialog parts, so it serves both. */
export function OverlayHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Description>{description}</Dialog.Description>
      </div>
      <Dialog.Close
        render={<IconButton variant="text" color="secondary" aria-label="Close" />}
        className="-mt-1 -mr-2 shrink-0 text-muted-foreground hover:text-foreground"
      >
        <X size={16} />
      </Dialog.Close>
    </div>
  );
}

export function SelectField({
  label,
  items,
  ref,
}: {
  label: string;
  items: string[];
  ref?: Ref<HTMLButtonElement>;
}) {
  return (
    <Field.Root className="gap-2">
      <Field.Label>{label}</Field.Label>
      <Select.Root defaultValue={items[0]}>
        <Select.Trigger ref={ref}>
          <Select.Value />
          <Select.Icon />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner sideOffset={5} alignItemWithTrigger={false}>
            <Select.Popup>
              {items.map((item) => (
                <Select.Item key={item} value={item}>
                  <Select.ItemText>{item}</Select.ItemText>
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </Field.Root>
  );
}

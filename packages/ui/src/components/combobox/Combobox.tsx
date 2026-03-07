import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import type React from "react";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type ComboboxRootProps = ComponentProps<typeof BaseCombobox.Root>;
export type ComboboxInputProps = ComponentProps<typeof BaseCombobox.Input>;
export type ComboboxTriggerProps = ComponentProps<typeof BaseCombobox.Trigger>;
export type ComboboxPopupProps = ComponentProps<typeof BaseCombobox.Popup>;
export type ComboboxItemProps = ComponentProps<typeof BaseCombobox.Item>;
export type ComboboxItemIndicatorProps = ComponentProps<typeof BaseCombobox.ItemIndicator>;
export type ComboboxEmptyProps = ComponentProps<typeof BaseCombobox.Empty>;
export type ComboboxClearProps = ComponentProps<typeof BaseCombobox.Clear>;
export type ComboboxGroupLabelProps = ComponentProps<typeof BaseCombobox.GroupLabel>;
export type ComboboxIconProps = ComponentProps<typeof BaseCombobox.Icon>;
export type ComboboxPositionerProps = ComponentProps<typeof BaseCombobox.Positioner>;
export type ComboboxGroupProps = ComponentProps<typeof BaseCombobox.Group>;
export type ComboboxListProps = ComponentProps<typeof BaseCombobox.List>;
export type ComboboxChipsProps = ComponentProps<typeof BaseCombobox.Chips>;
export type ComboboxChipProps = ComponentProps<typeof BaseCombobox.Chip>;
export type ComboboxChipRemoveProps = ComponentProps<typeof BaseCombobox.ChipRemove>;
export type ComboboxControlProps = React.ComponentProps<"div">;

function ComboboxControl({ className, ...props }: ComboboxControlProps) {
  return (
    <div
      className={cn(
        "relative flex flex-wrap items-center gap-1 rounded-lg border border-input bg-background px-3 py-1.5",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
        "has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxInput({ className, ...props }: ComboboxInputProps) {
  return (
    <BaseCombobox.Input
      className={cn(
        "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-2 focus-visible:outline-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxTrigger({ className, ...props }: ComboboxTriggerProps) {
  return (
    <BaseCombobox.Trigger
      className={cn(
        "absolute inset-y-0 right-0 flex items-center pr-2",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {props.children ?? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      )}
    </BaseCombobox.Trigger>
  );
}

function ComboboxIcon({ className, ...props }: ComboboxIconProps) {
  return (
    <BaseCombobox.Icon className={cn("ml-auto", className)} {...props}>
      {props.children ?? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      )}
    </BaseCombobox.Icon>
  );
}

function ComboboxPositioner({ className, ...props }: ComboboxPositionerProps) {
  return (
    <BaseCombobox.Positioner className={cn("w-[var(--anchor-width)]", className)} {...props} />
  );
}

function ComboboxPopup({ className, ...props }: ComboboxPopupProps) {
  return (
    <BaseCombobox.Popup
      className={cn(
        "z-dropdowns rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md",
        "data-[starting-style]:opacity-0",
        "data-[ending-style]:opacity-0",
        "micro-interactions",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxItem({ className, ...props }: ComboboxItemProps) {
  return (
    <BaseCombobox.Item
      className={cn(
        "relative flex w-full cursor-default items-center rounded-md py-1.5 pr-8 pl-2 text-sm outline-none",
        "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxItemIndicator({ className, ...props }: ComboboxItemIndicatorProps) {
  return (
    <BaseCombobox.ItemIndicator
      className={cn("absolute right-2 flex items-center", className)}
      {...props}
    >
      {props.children ?? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
    </BaseCombobox.ItemIndicator>
  );
}

function ComboboxEmpty({ className, ...props }: ComboboxEmptyProps) {
  return (
    <BaseCombobox.Empty
      className={cn("px-2 py-4 text-center text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function ComboboxClear({ className, ...props }: ComboboxClearProps) {
  return (
    <BaseCombobox.Clear
      className={cn(
        "absolute inset-y-0 right-7 flex items-center text-muted-foreground hover:text-foreground",
        "micro-interactions",
        className,
      )}
      {...props}
    >
      {props.children ?? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="size-3.5"
          aria-hidden="true"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      )}
    </BaseCombobox.Clear>
  );
}

function ComboboxGroupLabel({ className, ...props }: ComboboxGroupLabelProps) {
  return (
    <BaseCombobox.GroupLabel
      className={cn("px-2 py-1.5 text-xs font-semibold text-muted-foreground", className)}
      {...props}
    />
  );
}

function ComboboxChip({ className, ...props }: ComboboxChipProps) {
  return (
    <BaseCombobox.Chip
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border bg-muted px-1.5 py-0.5 text-xs",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxChipRemove({ className, ...props }: ComboboxChipRemoveProps) {
  return (
    <BaseCombobox.ChipRemove
      className={cn(
        "inline-flex items-center text-muted-foreground hover:text-foreground micro-interactions",
        className,
      )}
      {...props}
    >
      {props.children ?? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="size-3"
          aria-hidden="true"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      )}
    </BaseCombobox.ChipRemove>
  );
}

export const Combobox = {
  Root: BaseCombobox.Root,
  Control: ComboboxControl,
  Input: ComboboxInput,
  Trigger: ComboboxTrigger,
  Icon: ComboboxIcon,
  Portal: BaseCombobox.Portal,
  Positioner: ComboboxPositioner,
  Popup: ComboboxPopup,
  List: BaseCombobox.List,
  Item: ComboboxItem,
  ItemIndicator: ComboboxItemIndicator,
  Empty: ComboboxEmpty,
  Clear: ComboboxClear,
  Group: BaseCombobox.Group,
  GroupLabel: ComboboxGroupLabel,
  Chips: BaseCombobox.Chips,
  Chip: ComboboxChip,
  ChipRemove: ComboboxChipRemove,
  Value: BaseCombobox.Value,
  Status: BaseCombobox.Status,
};

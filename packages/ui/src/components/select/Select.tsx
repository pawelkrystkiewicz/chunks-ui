import { Select as BaseSelect } from "@base-ui/react/select";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type SelectRootProps = ComponentProps<typeof BaseSelect.Root>;
export type SelectTriggerProps = ComponentProps<typeof BaseSelect.Trigger>;
export type SelectValueProps = ComponentProps<typeof BaseSelect.Value>;
export type SelectIconProps = ComponentProps<typeof BaseSelect.Icon>;
export type SelectPositionerProps = ComponentProps<typeof BaseSelect.Positioner>;
export type SelectPopupProps = ComponentProps<typeof BaseSelect.Popup>;
export type SelectItemProps = ComponentProps<typeof BaseSelect.Item>;
export type SelectItemTextProps = ComponentProps<typeof BaseSelect.ItemText>;
export type SelectItemIndicatorProps = ComponentProps<typeof BaseSelect.ItemIndicator>;
export type SelectGroupProps = ComponentProps<typeof BaseSelect.Group>;
export type SelectGroupLabelProps = ComponentProps<typeof BaseSelect.GroupLabel>;

function SelectTrigger({ className, ...props }: SelectTriggerProps) {
  return (
    <BaseSelect.Trigger
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-lg border border-input bg-background px-3 text-sm",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-2 focus-visible:outline-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[placeholder]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function SelectIcon({ className, ...props }: SelectIconProps) {
  return (
    <BaseSelect.Icon className={cn("ml-auto", className)} {...props}>
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
    </BaseSelect.Icon>
  );
}

function SelectPopup({ className, ...props }: SelectPopupProps) {
  return (
    <BaseSelect.Popup
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

function SelectItem({ className, ...props }: SelectItemProps) {
  return (
    <BaseSelect.Item
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

function SelectItemIndicator({ className, ...props }: SelectItemIndicatorProps) {
  return (
    <BaseSelect.ItemIndicator
      className={cn("absolute right-2 flex items-center", className)}
      {...props}
    >
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
    </BaseSelect.ItemIndicator>
  );
}

function SelectGroupLabel({ className, ...props }: SelectGroupLabelProps) {
  return (
    <BaseSelect.GroupLabel
      className={cn("px-2 py-1.5 text-xs font-semibold text-muted-foreground", className)}
      {...props}
    />
  );
}

export const Select = {
  Root: BaseSelect.Root,
  Trigger: SelectTrigger,
  Value: BaseSelect.Value,
  Icon: SelectIcon,
  Portal: BaseSelect.Portal,
  Positioner: BaseSelect.Positioner,
  Popup: SelectPopup,
  Item: SelectItem,
  ItemText: BaseSelect.ItemText,
  ItemIndicator: SelectItemIndicator,
  Group: BaseSelect.Group,
  GroupLabel: SelectGroupLabel,
};

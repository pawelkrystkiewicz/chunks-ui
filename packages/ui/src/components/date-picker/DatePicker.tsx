"use client";

import { Popover as BasePopover } from "@base-ui/react/popover";
import { useState } from "react";
import { cn } from "../../lib/cn";
import { Calendar } from "../calendar/Calendar";

export type DatePickerProps = {
  value?: Date | null;
  defaultValue?: Date | null;
  onValueChange?: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: Date;
  max?: Date;
  isDateDisabled?: (date: Date) => boolean;
  className?: string;
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function DatePicker({
  value,
  defaultValue,
  onValueChange,
  placeholder = "Pick a date",
  disabled,
  min,
  max,
  isDateDisabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [internalDate, setInternalDate] = useState<Date | null>(defaultValue ?? null);
  const selectedDate = value !== undefined ? value : internalDate;

  const handleDateSelect = (date: Date | null) => {
    if (value === undefined) setInternalDate(date);
    onValueChange?.(date);
    setOpen(false);
  };

  const displayValue = selectedDate ? formatDate(selectedDate) : "";

  return (
    <div className={cn("relative", className)}>
      <BasePopover.Root open={open} onOpenChange={setOpen}>
        <BasePopover.Trigger
          disabled={disabled}
          className={cn(
            "flex h-ui-height w-full cursor-pointer items-center rounded border border-input bg-background px-3 text-left text-sm",
            "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
            !displayValue && "text-muted-foreground",
          )}
        >
          {displayValue || placeholder}
        </BasePopover.Trigger>
        <BasePopover.Portal>
          <BasePopover.Positioner sideOffset={8}>
            <BasePopover.Popup
              className={cn(
                "z-dropdowns rounded border border-border bg-popover shadow-md",
                "data-starting-style:scale-95 data-starting-style:opacity-0",
                "data-ending-style:scale-95 data-ending-style:opacity-0",
                "micro-interactions",
              )}
            >
              <Calendar
                value={selectedDate}
                onValueChange={handleDateSelect}
                min={min}
                max={max}
                isDateDisabled={isDateDisabled}
              />
            </BasePopover.Popup>
          </BasePopover.Positioner>
        </BasePopover.Portal>
      </BasePopover.Root>
    </div>
  );
}

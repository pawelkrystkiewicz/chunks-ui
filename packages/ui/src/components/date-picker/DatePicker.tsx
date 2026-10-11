"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { Popover as BasePopover } from "@base-ui/react/popover";
import { type ComponentProps, useId, useLayoutEffect, useRef, useState } from "react";
import { cn } from "../../lib/cn";
import { usePortalContainer } from "../../lib/portal-container";
import { useMergedRef } from "../../lib/use-merged-ref";
import { Calendar, type CalendarProps } from "../calendar/Calendar";

type DatePickerOwnProps = Pick<CalendarProps, "weekStartsOn" | "showOutsideDays"> & {
  /**
   * The currently selected date (controlled).
   */
  value?: Date | null;
  /**
   * The initial selected date when uncontrolled.
   * @default null
   */
  defaultValue?: Date | null;
  /**
   * Called with the picked date (at local midnight) when the user picks an enabled day in the
   * calendar, by click, Enter or Space, also when it is the day already selected. The calendar
   * closes right after. It is never called with `null`, as the picker has no way to clear the
   * date, and a change to `value` from outside does not call it.
   */
  onValueChange?: (date: Date | null) => void;
  /**
   * Placeholder text shown in the trigger when no date is selected.
   * @default "Pick a date"
   */
  placeholder?: string;
  /**
   * Whether the date picker trigger is disabled.
   */
  disabled?: boolean;
  /**
   * The earliest selectable date.
   */
  min?: Date;
  /**
   * The latest selectable date.
   */
  max?: Date;
  /**
   * Predicate function to disable individual dates in the calendar.
   */
  isDateDisabled?: (date: Date) => boolean;
  /**
   * Name of the form field. Renders a hidden input that submits the selected date as
   * `yyyy-mm-dd`, or an empty string when no date is selected.
   */
  name?: string;
  /**
   * Whether a date must be selected before the form can be submitted. An empty required picker
   * blocks submission and takes focus.
   */
  required?: boolean;
  /**
   * The `id` of the `<form>` the hidden input belongs to, for a picker placed outside it.
   */
  form?: string;
  /**
   * Classes for the wrapper element around the trigger.
   */
  className?: string;
};

/**
 * Props for `DatePicker`. Every `<button>` prop not listed here (`id`, `aria-label`,
 * `aria-labelledby`, `aria-describedby`, `data-*`, event handlers, `ref`) goes to the trigger.
 * There is no `onChange`: the trigger never fires it. Use `onValueChange`.
 */
export type DatePickerProps = DatePickerOwnProps &
  Omit<ComponentProps<"button">, keyof DatePickerOwnProps | "children" | "type" | "onChange">;

// Local calendar date, not toISOString(), which shifts to UTC and can change the day
function toIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

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
  weekStartsOn,
  showOutsideDays,
  name,
  required,
  form,
  className,
  ref,
  ...triggerProps
}: DatePickerProps) {
  const container = usePortalContainer();
  const popupRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const mergedTriggerRef = useMergedRef(triggerRef, ref);
  const [open, setOpen] = useState(false);
  const [internalDate, setInternalDate] = useState<Date | null>(defaultValue ?? null);
  const selectedDate = value !== undefined ? value : internalDate;

  const handleDateSelect = (date: Date | null) => {
    if (value === undefined) setInternalDate(date);
    onValueChange?.(date);
    setOpen(false);
  };

  const displayValue = selectedDate ? formatDate(selectedDate) : "";
  const isoValue = selectedDate ? toIsoDate(selectedDate) : "";

  // A <label htmlFor> names the button by itself and drops the date, so collect the ids of the
  // trigger's labels to name it by those and the date. As in Base UI's own controls, this reads
  // the DOM after every commit and gives an id to a label that has none.
  const valueId = useId();
  const [nativeLabelIds, setNativeLabelIds] = useState<string>();
  useLayoutEffect(() => {
    const labels = Array.from(triggerRef.current?.labels ?? []);
    const ids = labels.map((label, index) => {
      if (!label.id) label.id = `${valueId}-label-${index}`;
      return label.id;
    });
    const next = ids.join(" ") || undefined;
    if (next !== nativeLabelIds) setNativeLabelIds(next);
  });

  return (
    <div className={cn("relative", className)}>
      <BasePopover.Root open={open} onOpenChange={setOpen}>
        {/* Field.Control registers the trigger as the control of a surrounding Field.Root, so
            Field.Label names it and Field.Description describes it. Outside a Field it only
            passes the props through. */}
        <BaseField.Control
          // Field.Control types its props for <input>; they reach the trigger <button> unchanged
          {...(triggerProps as BaseField.Control.Props)}
          ref={mergedTriggerRef}
          disabled={disabled}
          // The field reads its value from here, not from the button's empty value
          value={isoValue}
          render={(controlProps, state) => {
            // Field.Root's name comes through here. It goes on the form input, not the button
            const { name: fieldName, ...buttonProps } = controlProps as typeof controlProps & {
              name?: string;
            };
            const formName = name ?? fieldName;
            // A label replaces a button's text as its name. The trigger has no other way to
            // expose the date, so name it by its label and then the date. The label comes from
            // aria-labelledby (the consumer's or Field.Label's), else aria-label (read through the
            // trigger's own id), else a <label htmlFor>. Without a label, the text names it.
            const labelledBy =
              buttonProps["aria-labelledby"] ??
              (buttonProps["aria-label"] ? buttonProps.id : nativeLabelIds);
            return (
              <>
                <BasePopover.Trigger
                  {...buttonProps}
                  aria-labelledby={labelledBy ? `${labelledBy} ${valueId}` : undefined}
                  className={cn(
                    "flex h-ui-height w-full cursor-pointer items-center rounded-md border border-input bg-background px-3 text-left text-sm",
                    "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
                    "disabled:pointer-events-none disabled:opacity-50",
                    !displayValue && "text-muted-foreground",
                  )}
                >
                  <span id={valueId}>{displayValue || placeholder}</span>
                </BasePopover.Trigger>
                {(formName !== undefined || required) && (
                  // Carries the date into the form. Not type="hidden" or readOnly: both skip
                  // `required`. Disabled with the picker or its Field.Root, like a native control,
                  // so it then submits nothing and blocks nothing. When the browser focuses it as
                  // the first invalid field, the trigger takes the focus.
                  <input
                    name={formName}
                    form={form}
                    value={isoValue}
                    required={required}
                    disabled={state.disabled}
                    onChange={() => {}}
                    // focusVisible shows the ring even after a mouse submit; TS's FocusOptions
                    // lacks it
                    onFocus={() =>
                      triggerRef.current?.focus({ focusVisible: true } as FocusOptions)
                    }
                    tabIndex={-1}
                    aria-hidden="true"
                    className="sr-only"
                  />
                )}
              </>
            );
          }}
        />
        <BasePopover.Portal container={container}>
          <BasePopover.Positioner className="z-dropdowns" sideOffset={8}>
            <BasePopover.Popup
              ref={popupRef}
              // Open on the calendar's tab-stop day (selected, else today), as in the APG date picker.
              initialFocus={() =>
                popupRef.current?.querySelector<HTMLElement>('[role="grid"] [tabindex="0"]') ?? null
              }
              className={cn(
                "rounded-md border border-border bg-popover shadow-md",
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
                weekStartsOn={weekStartsOn}
                showOutsideDays={showOutsideDays}
              />
            </BasePopover.Popup>
          </BasePopover.Positioner>
        </BasePopover.Portal>
      </BasePopover.Root>
    </div>
  );
}

"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { Popover as BasePopover } from "@base-ui/react/popover";
import {
  type ComponentProps,
  type RefObject,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "../../lib/cn";
import { mergeLabels } from "../../lib/labels";
import { usePortalContainer } from "../../lib/portal-container";
import { useMergedRef } from "../../lib/use-merged-ref";
import { Calendar, type CalendarProps, validDate } from "../calendar/Calendar";
import { type DatePickerLabels, DEFAULT_DATE_PICKER_LABELS } from "./DatePicker.Labels";

type DatePickerOwnProps = Pick<
  CalendarProps,
  "weekStartsOn" | "showOutsideDays" | "month" | "onMonthChange"
> & {
  /**
   * The currently selected date (controlled). An Invalid Date counts as no date.
   */
  value?: Date | null;
  /**
   * The initial selected date when uncontrolled. A form reset restores it. An Invalid Date
   * counts as no date.
   * @default null
   */
  defaultValue?: Date | null;
  /**
   * Called with the picked date, at local midnight, when the user picks an enabled day (click,
   * Enter or Space). Picking the selected day again also calls it. The calendar then closes. It
   * is never called with `null`: the picker cannot clear a date. A change to `value` from outside
   * does not call it.
   */
  onValueChange?: (date: Date | null) => void;
  /**
   * Placeholder text shown in the trigger when no date is selected. Takes precedence over
   * `labels.placeholder`.
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
   * `yyyy-mm-dd`, or an empty string when no date is selected. A name on a surrounding
   * `Field.Root` wins over this one, as with Base UI's `Field.Control`: the form data, and a Base
   * UI `Form`'s `errors` and `onFormSubmit`, then use the field's name.
   */
  name?: string;
  /**
   * Whether a date must be selected before the form can be submitted. An empty required picker
   * blocks submission and takes focus.
   */
  required?: boolean;
  /**
   * The `id` of the `<form>` the picker belongs to, for a picker placed outside it. A reset of
   * that form restores the picker. With `name` or `required`, the date is submitted with that form.
   */
  form?: string;
  /**
   * Classes for the wrapper element around the trigger.
   */
  className?: string;
  /**
   * Replaces the built-in English strings, e.g. to translate them, including the calendar's.
   * Keys you leave out keep the default from `DEFAULT_DATE_PICKER_LABELS`.
   */
  labels?: Partial<DatePickerLabels>;
};

/**
 * Props for `DatePicker`. Every `<button>` prop not listed here (`id`, `aria-label`,
 * `aria-labelledby`, `aria-describedby`, `data-*`, event handlers, `ref`) goes to the trigger.
 * There is no `onChange`: the trigger never fires it. Use `onValueChange`.
 */
export type DatePickerProps = DatePickerOwnProps &
  Omit<ComponentProps<"button">, keyof DatePickerOwnProps | "children" | "type" | "onChange">;

// Local calendar date, not toISOString(), which shifts to UTC and can change the day. The year
// has 4 digits, as ISO 8601 and <input type="date"> need: 0999, not 999.
function toIsoDate(date: Date): string {
  const pad = (n: number, length = 2) => String(n).padStart(length, "0");
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * The form `control` belongs to. With `formId`, that is the form with that id in the control's
 * tree (document or shadow root), as the browser resolves a `form` attribute: the trigger, the
 * control when there is no form input, does not carry the attribute.
 */
function getForm(
  control: HTMLInputElement | HTMLButtonElement | null,
  formId: string | undefined,
): HTMLFormElement | null {
  if (!control || formId === undefined) return control?.form ?? null;
  const root = control.getRootNode() as Partial<Pick<Document, "getElementById">>;
  const element = root.getElementById?.(formId);
  return element?.tagName === "FORM" ? (element as HTMLFormElement) : null;
}

export function DatePicker({
  value,
  defaultValue,
  onValueChange,
  placeholder,
  disabled,
  min,
  max,
  isDateDisabled,
  weekStartsOn,
  showOutsideDays,
  month,
  onMonthChange,
  name,
  required,
  form,
  className,
  labels,
  ref,
  ...triggerProps
}: DatePickerProps) {
  const names = mergeLabels(DEFAULT_DATE_PICKER_LABELS, labels);
  const container = usePortalContainer();
  const popupRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const mergedTriggerRef = useMergedRef(triggerRef, ref);
  const [open, setOpen] = useState(false);
  const [internalDate, setInternalDate] = useState<Date | null>(defaultValue ?? null);
  const selectedDate = validDate(value !== undefined ? value : internalDate);

  const handleDateSelect = (date: Date | null) => {
    if (value === undefined) setInternalDate(date);
    onValueChange?.(date);
    setOpen(false);
  };

  // A form reset restores the default date, as it restores an input's default value. A
  // controlled picker keeps `value`, as a controlled React input does. The field's control is
  // the form input, which `form` can link to a form it is outside of, else the trigger.
  const fieldControlRef = useRef<HTMLInputElement | HTMLButtonElement>(null);
  useEffect(() => {
    const control = fieldControlRef.current;
    if (!control || value !== undefined) return;
    // Listen on the control's root node (the document, or a shadow root, as `reset` is not
    // composed), in the bubble phase: it runs after React's root listener, so a consumer's
    // `onReset` has had the chance to cancel the reset, which leaves the controls as they are.
    // The form is found when it resets, so one that mounts later, or remounts, counts.
    const root = control.getRootNode();
    const reset = (event: Event) => {
      if (event.defaultPrevented) return;
      if (event.target !== getForm(fieldControlRef.current, form)) return;
      setInternalDate(defaultValue ?? null);
    };
    root.addEventListener("reset", reset);
    return () => root.removeEventListener("reset", reset);
  });

  const displayValue = selectedDate ? names.selectedDate(selectedDate) : "";
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
          ref={fieldControlRef as RefObject<HTMLInputElement>}
          // Registers the name with Field.Root when it has none, so a Base UI Form's `errors`
          // and `onFormSubmit` values find the field under it
          name={name}
          disabled={disabled}
          // The field reads its value from here, not from the button's empty value
          value={isoValue}
          render={(controlProps, state) => {
            // The name Field.Control resolves comes through here: Field.Root's, else the
            // picker's (`const name = fieldName ?? nameProp` in Base UI's FieldControl), so the
            // form data uses the name a Base UI Form uses for `errors` and `onFormSubmit`. It
            // goes on the form input, not the button. `fieldRef` tells the field which element
            // to validate and to focus when invalid.
            const {
              name: formName,
              ref: fieldRef,
              ...buttonProps
            } = controlProps as typeof controlProps & { name?: string };
            const hasFormInput = formName !== undefined || required;
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
                  ref={mergedTriggerRef}
                  // The field validates the form input when there is one: it carries `required`,
                  // which a button cannot. Else it gets the trigger, through the ref of the
                  // render element, which Base UI merges with `ref`.
                  render={hasFormInput ? undefined : <button type="button" ref={fieldRef} />}
                  aria-labelledby={labelledBy ? `${labelledBy} ${valueId}` : undefined}
                  className={cn(
                    "flex h-ui-height w-full cursor-pointer items-center rounded-md border border-input bg-background px-3 text-left text-sm",
                    "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
                    "disabled:pointer-events-none disabled:opacity-50",
                    !displayValue && "text-muted-foreground",
                  )}
                >
                  <span id={valueId}>{displayValue || (placeholder ?? names.placeholder)}</span>
                </BasePopover.Trigger>
                {hasFormInput && (
                  // Carries the date into the form. Not type="hidden" or readOnly: both skip
                  // `required`. Disabled with the picker or its Field.Root, like a native control,
                  // so it then submits nothing and blocks nothing. When the browser or a Base UI
                  // Form focuses it as the first invalid field, the trigger takes the focus.
                  <input
                    ref={fieldRef}
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
                month={month}
                onMonthChange={onMonthChange}
                labels={labels}
              />
            </BasePopover.Popup>
          </BasePopover.Positioner>
        </BasePopover.Portal>
      </BasePopover.Root>
    </div>
  );
}

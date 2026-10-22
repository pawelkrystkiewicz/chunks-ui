"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { Popover as BasePopover } from "@base-ui/react/popover";
import {
  cn,
  type DatePickerLabels,
  DEFAULT_DATE_PICKER_LABELS,
  FIELD_TEXT_SIZE,
  FOCUS_RING,
  mergeLabels,
  RING_TRANSITION,
  toIsoDate,
  validDate,
} from "chunks-ui-core";
import {
  type ComponentProps,
  type RefObject,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { usePortalContainer } from "../../lib/portal-container";
import { useCloseFocusRoot, useFocusOnClose } from "../../lib/use-focus-on-close";
import { useMergedRef } from "../../lib/use-merged-ref";
import { Calendar, type CalendarProps } from "../calendar/Calendar";

// The app's bundler replaces it, as it does in @base-ui/react. The package has no Node types.
declare const process: { env: { NODE_ENV?: string } };

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
   * Enter or Space). Picking the selected day again also calls it. The pick then asks to close the
   * calendar: an uncontrolled one closes unless `onOpenChange` cancels it, a controlled one when you
   * set `open` to `false`. It is never called with `null`: the picker cannot clear a date. A change
   * to `value` from outside does not call it.
   */
  onValueChange?: (date: Date | null) => void;
  /**
   * Whether the calendar is open (controlled). An open or close by the user then calls
   * `onOpenChange` and waits for a new `open`.
   */
  open?: boolean;
  /**
   * Whether the calendar is open on mount, when uncontrolled.
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Called when the user opens or closes the calendar, with the event details of Base UI's
   * `Popover.Root`. A pick closes it with the reason `close-press`, as a press on `Popover.Close`
   * does. `eventDetails.cancel()` keeps an uncontrolled calendar as it is. A change to `open` from
   * outside does not call it, and neither does the close that disabling the picker forces (see
   * Disabled in the docs). Do not call `eventDetails.preventUnmountOnClose()`: the picker has
   * no `actionsRef` to unmount the calendar after it.
   */
  onOpenChange?: (open: boolean, eventDetails: BasePopover.Root.ChangeEventDetails) => void;
  /**
   * Placeholder text shown in the trigger when no date is selected. Takes precedence over
   * `labels.placeholder`.
   * @default "Pick a date"
   */
  placeholder?: string;
  /**
   * Whether the date picker trigger is disabled. A disabled picker stays closed whatever `open`
   * and `defaultOpen` say.
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
   * that form restores the picker. With `name`, `required` or a named `Field.Root`, the date is
   * submitted with that form.
   */
  form?: string;
  /**
   * Classes for the wrapper element around the trigger. The trigger fills it, so set the width
   * here. To style the trigger, use `triggerClassName`.
   */
  className?: string;
  /**
   * Classes for the trigger `<button>`. They merge after the trigger's own classes, so a
   * conflicting class replaces the default: `h-12` sets the height, and a `text-*` colour also
   * replaces the muted colour of the placeholder. A text size applies with a mouse from `md` up:
   * below `md` and on a touch screen the text stays 16px (see Text Size in the docs).
   */
  triggerClassName?: string;
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

/**
 * The details of a pick's close, as Base UI gives them for a press on `Popover.Close`.
 * ponytail: built by hand (Base UI's builder is internal): `preventUnmountOnClose()` does nothing,
 * and a member that a later Base UI adds is missing from a pick's. Accepted.
 */
function pickCloseDetails(event: Event, trigger: Element | undefined) {
  const details: BasePopover.Root.ChangeEventDetails = {
    reason: "close-press",
    event: event as MouseEvent,
    trigger,
    isCanceled: false,
    isPropagationAllowed: false,
    cancel() {
      details.isCanceled = true;
    },
    allowPropagation() {
      details.isPropagationAllowed = true;
    },
    preventUnmountOnClose() {},
  };
  return details;
}

export function DatePicker({
  value,
  defaultValue,
  onValueChange,
  open,
  defaultOpen,
  onOpenChange,
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
  triggerClassName,
  labels,
  ref,
  ...triggerProps
}: DatePickerProps) {
  const names = mergeLabels(DEFAULT_DATE_PICKER_LABELS, labels);
  const container = usePortalContainer();
  const popupRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const mergedTriggerRef = useMergedRef(triggerRef, ref);
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  // A disabled trigger cannot be pressed, and `open` is not a press: the calendar stays closed
  // whatever `open` says, and a pick changes nothing. The picker's `disabled` is not all that
  // disables the trigger: a disabled Field.Root or Base UI Fieldset does, and a native
  // <fieldset disabled>, which only the browser knows. So this reads the DOM after every commit, as
  // the label ids below do. A disabled uncontrolled picker also forgets that it was open, so
  // enabling it later does not pop the calendar open, and take focus, out of nowhere.
  // ponytail: only the picker's own `disabled` counts in the render that sets it; the others count
  // from its next render, or from a pick (which reads the DOM too). A picker that mounts open
  // inside a disabled Field or fieldset mounts its calendar for its first commit, gone before it
  // paints and without taking focus. Accepted.
  // ponytail: when a disabled picker's calendar closes with focus in it, focus falls to <body>, as
  // the disabled trigger cannot take it. A native disabled control does the same. Accepted.
  const [triggerDisabled, setTriggerDisabled] = useState(false);
  const isOpen = !(disabled || triggerDisabled) && (open ?? internalOpen);
  const syncDisabled = () => {
    const next = triggerRef.current?.matches(":disabled") ?? false;
    if (next !== triggerDisabled) setTriggerDisabled(next);
    if (next && internalOpen) setInternalOpen(false);
    return next;
  };
  useLayoutEffect(() => {
    syncDisabled();
  });
  // Focus moves to the trigger as the popup starts to close, not at the unmount after the exit.
  // Only an uncontrolled picker keeps the state: a controlled one shows `open`, so the consumer
  // can refuse a change by not passing it on.
  const [closeFocus, reportOpenChange] = useCloseFocusRoot(
    (next: boolean, eventDetails: BasePopover.Root.ChangeEventDetails) => {
      onOpenChange?.(next, eventDetails);
      if (open === undefined && !eventDetails.isCanceled) setInternalOpen(next);
    },
  );
  // ponytail: drop a close while not open; see Popover.tsx (Base UI focus-out re-close; remove once Base UI checks open first).
  const handleOpenChange: typeof reportOpenChange = (next, eventDetails) => {
    if (!next && !isOpen) return;
    reportOpenChange(next, eventDetails);
  };
  const focusOnCloseRef = useFocusOnClose(popupRef, closeFocus);
  // The picker has one trigger, so focus goes back to it after an open it did not start too
  // (`defaultOpen`, `open` from another control), as the popup starts to close. Base UI would
  // return it only at the unmount, and to another control that opened it.
  useLayoutEffect(() => {
    closeFocus.trigger.current = triggerRef.current;
  });
  // The click that picks a day, by mouse, Enter or Space: the close goes through the hand-off with
  // it, which waits after a key's click, so a held Enter's first repeat does not click the trigger
  // if it comes during the exit. A later repeat does, as on any button.
  const pickRef = useRef<Event>(undefined);
  const [internalDate, setInternalDate] = useState<Date | null>(defaultValue ?? null);
  const selectedDate = validDate(value !== undefined ? value : internalDate);

  const handleDateSelect = (date: Date | null) => {
    if (syncDisabled()) return;
    if (value === undefined) setInternalDate(date);
    onValueChange?.(date);
    const event = pickRef.current ?? new Event("base-ui");
    handleOpenChange(false, pickCloseDetails(event, triggerRef.current ?? undefined));
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

  const warnedRef = useRef(false);

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
      <BasePopover.Root open={isOpen} onOpenChange={handleOpenChange}>
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
            // Field.Control's resolved name (`fieldName ?? nameProp`) goes on the form input, not
            // the button, so form data matches Base UI Form's keys. `fieldRef` is the element
            // the field validates and focuses.
            const {
              name: formName,
              ref: fieldRef,
              ...buttonProps
            } = controlProps as typeof controlProps & { name?: string };
            // The field's name wins over the picker's without a sign, so warn once in development.
            // NODE_ENV is read bare, as Base UI does: a bundler replaces it, and a `typeof process`
            // guard would turn the check off in a browser that has no `process` global.
            if (
              process.env.NODE_ENV !== "production" &&
              !warnedRef.current &&
              name !== undefined &&
              formName !== name
            ) {
              warnedRef.current = true;
              console.warn(
                `chunks-ui: DatePicker has name "${name}", but its Field.Root has name "${formName}". ` +
                  `The field's name wins: the date is submitted and reported as "${formName}". ` +
                  "Drop one of the two names.",
              );
            }
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
                  data-placeholder={displayValue ? undefined : ""}
                  className={cn(
                    "flex h-ui-height w-full cursor-pointer items-center rounded-md border border-input bg-background px-3 text-start",
                    FIELD_TEXT_SIZE,
                    FOCUS_RING,
                    RING_TRANSITION,
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "data-placeholder:text-muted-foreground",
                    triggerClassName,
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
          {/* At least as wide as the trigger (#506); the calendar keeps its own width, centred */}
          <BasePopover.Positioner
            className="z-dropdowns min-w-[var(--anchor-width)]"
            sideOffset={8}
          >
            <BasePopover.Popup
              ref={focusOnCloseRef}
              onClickCapture={(event) => {
                pickRef.current = event.nativeEvent;
              }}
              // A dialog needs a name. As in the APG date picker, it names the task, not the month
              aria-label={names.dialog}
              // Open on the calendar's tab-stop day (selected, else today), as in the APG date picker.
              initialFocus={() =>
                popupRef.current?.querySelector<HTMLElement>('[role="grid"] [tabindex="0"]') ?? null
              }
              className={cn(
                "rounded-md border border-border bg-popover shadow-md",
                // The popup takes focus when `initialFocus` finds no day: the library ring, as
                // on Popover.Content
                FOCUS_RING,
                "origin-(--transform-origin)",
                "data-starting-style:scale-95 data-starting-style:opacity-0",
                "data-ending-style:scale-95 data-ending-style:opacity-0",
                // Only the fade and scale, not the ring
                "micro-interactions [transition-property:opacity,scale] duration-300",
              )}
            >
              <Calendar
                className="mx-auto"
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

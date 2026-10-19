"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import {
  type ComponentProps,
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cnState } from "../../lib/cn";
import { springs } from "../../lib/motion";
import {
  PortalContainerProvider,
  usePortalContainer,
  usePortalNode,
} from "../../lib/portal-container";
import { type CloseFocus, useCloseFocusRoot, useFocusOnClose } from "../../lib/use-focus-on-close";
import { useMergedRef } from "../../lib/use-merged-ref";
import { usePopupRender } from "../../lib/use-popup-render";
import { FIELD_TEXT_SIZE, FOCUS_RING, RING_TRANSITION } from "../shared";

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

// For the Popup's focus hand-off (#633); `null` under a Base UI Root
const SelectCloseFocusContext = createContext<CloseFocus | null>(null);

function SelectRoot<Value, Multiple extends boolean | undefined = false>({
  open,
  defaultOpen,
  onOpenChange,
  onValueChange,
  disabled,
  inputRef,
  actionsRef,
  ...props
}: BaseSelect.Root.Props<Value, Multiple>) {
  // A disabled trigger cannot be pressed, and `open` is not a press: as on DatePicker, a disabled
  // Select stays closed whatever `open` and `defaultOpen` say. `:disabled` is read from Base UI's
  // form input after every commit and at a pick, because only the browser knows a native fieldset
  // disabled it. A disabled uncontrolled Select forgets it was open, so enabling it later does not
  // pop the listbox open. The close skips the exit, for the Select's own `disabled` as for a Field
  // or fieldset: Base UI 1.9 cannot take back an open in the commit after it, so the popup would
  // stay mounted and closing.
  // ponytail: only the Select's own `disabled` counts in the render that sets it; the others count
  // from its next render, or from a pick. So a Select that mounts open in a disabled Field or
  // fieldset is open for its first commit, gone before it paints, and calls `onOpenChangeComplete`
  // with `false`. A Field that disables an open Select without rendering it leaves the listbox open
  // (Base UI refuses a pick in it). A `disabled` on the Trigger alone leaves the Select enabled, as
  // it leaves its value in the form. Accepted.
  // ponytail: when a disabled Select's listbox closes with focus in it, focus falls to <body>, as
  // the disabled trigger cannot take it. A native disabled control does the same. Accepted.
  const formInputRef = useRef<HTMLInputElement>(null);
  const mergedInputRef = useMergedRef(formInputRef, inputRef);
  const ownActionsRef = useRef<BaseSelect.Root.Actions>(null);
  const actions = actionsRef ?? ownActionsRef;
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const [formDisabled, setFormDisabled] = useState(false);
  const isOpen = !(disabled || formDisabled) && (open ?? internalOpen);
  const wasOpen = useRef(false);
  const syncDisabled = () => {
    const next = formInputRef.current?.matches(":disabled") ?? false;
    if (next !== formDisabled) setFormDisabled(next);
    if (next && internalOpen) setInternalOpen(false);
    // `wasOpen` covers the render after the close, when Base UI has already closed (the Select's own
    // `disabled`, or the render after a Field or fieldset disabled it): `unmount()` then removes the
    // popup at once. Repeating it is harmless. (Base UI 1.9 bug, mui/base-ui#6031; remove once it is
    // fixed, which brings back the exit)
    if (next && (isOpen || wasOpen.current)) actions.current?.unmount();
    return next;
  };
  const keepMounted = useRef(false);
  useLayoutEffect(() => {
    syncDisabled();
    // Base UI clears its own copy when `open` changes, not on a render that still sees `open`
    if (isOpen && !wasOpen.current) keepMounted.current = false;
    wasOpen.current = isOpen;
  });
  const [closeFocus, reportOpenChange] = useCloseFocusRoot(
    (next: boolean, eventDetails: BaseSelect.Root.OpenChangeEventDetails) => {
      if (!next) {
        // Remember the consumer's choice, to repeat it for a close dropped below
        keepMounted.current = false;
        const prevent = eventDetails.preventUnmountOnClose;
        eventDetails.preventUnmountOnClose = () => {
          keepMounted.current = true;
          prevent.call(eventDetails);
        };
      }
      onOpenChange?.(next, eventDetails);

      if (eventDetails.isCanceled) keepMounted.current = false;
      // Only an uncontrolled Select keeps the state: a controlled one shows `open`
      if (open === undefined && !eventDetails.isCanceled) setInternalOpen(next);
    },
  );
  // ponytail: Base UI 1.9's FloatingFocusManager closes a popup that is already closing, as
  // "focus-out", when focus leaves the trigger during or after the exit. Drop it before
  // `useCloseFocusRoot`, whose handler calls `onOpenChange`; remove once Base UI checks `open`.
  const handleOpenChange: typeof reportOpenChange = (next, eventDetails) => {
    if (!next && !isOpen) {
      if (keepMounted.current) eventDetails.preventUnmountOnClose();
      return;
    }
    reportOpenChange(next, eventDetails);
  };
  return (
    <SelectCloseFocusContext.Provider value={closeFocus}>
      <BaseSelect.Root<Value, Multiple>
        {...props}
        disabled={disabled}
        inputRef={mergedInputRef}
        actionsRef={actions}
        open={isOpen}
        onOpenChange={handleOpenChange}
        onValueChange={(value, eventDetails) => {
          if (syncDisabled()) eventDetails.cancel();
          else onValueChange?.(value, eventDetails);
        }}
      />
    </SelectCloseFocusContext.Provider>
  );
}

function SelectTrigger({ className, ...props }: SelectTriggerProps) {
  return (
    <BaseSelect.Trigger
      className={cnState(
        "flex h-ui-height w-full items-center justify-between rounded-md border border-input bg-background px-3",
        FIELD_TEXT_SIZE,
        // Within its container, however long the value: it shrinks in a flex row, and stops at the
        // container's width when sized by its value (`w-auto`)
        "min-w-0 max-w-full",
        FOCUS_RING,
        RING_TRANSITION,
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-placeholder:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

// One line: a value wider than the trigger ends in an ellipsis before the chevron (#518). Three
// classes, not `truncate`, so `whitespace-normal` in `className` brings back wrapping alone.
// `flex-1`: it takes only the free space, so an element beside it keeps its width (#546), and
// `text-start` keeps the text at the start of that space, which the trigger's <button> centres.
function SelectValue({ className, ...props }: SelectValueProps) {
  return (
    <BaseSelect.Value
      className={cnState(
        "flex-1 text-start overflow-hidden text-ellipsis whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

// Children replace the chevron, as on Combobox.Icon (#541). With `render` and no children, there
// is no chevron: the render element draws its own, and may be a void element like <img> (#581).
function SelectIcon({ className, children, ...props }: SelectIconProps) {
  return (
    <BaseSelect.Icon className={cnState("ms-auto", className)} {...props}>
      {children == null && !props.render ? (
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
      ) : (
        children
      )}
    </BaseSelect.Icon>
  );
}

// Focus moves to the trigger as the popup starts to close, not as it hides at the end of the exit:
// Base UI keeps a Select popup mounted once its trigger has had focus
function SelectPopup({ className, render: renderProp, ref, ...props }: SelectPopupProps) {
  // ponytail: inside is the popup alone. A popup portalled from in it is outside, so a close with
  // focus there keeps Base UI's return, as the popup hides at the end of the exit.
  const popupRef = useFocusOnClose(ref, useContext(SelectCloseFocusContext), {
    finalFocus: props.finalFocus,
  });
  const { useSpring, render } = usePopupRender(renderProp, {
    spring: springs.popup,
    from: { opacity: 0, scale: 0.95 },
    to: { opacity: 1, scale: 1 },
  });

  return (
    <BaseSelect.Popup
      ref={popupRef}
      render={render}
      className={cnState(
        "rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md",
        "origin-(--transform-origin)",
        !useSpring && "data-starting-style:scale-95 data-starting-style:opacity-0",
        !useSpring && "data-ending-style:scale-95 data-ending-style:opacity-0",
        // Aligned over its trigger (`data-side="none"`), it only fades, as in Base UI's own reference
        // styles: the popup lands with the selected item over the trigger's value, so a scale would
        // move it. If a Select falls back to below-the-trigger after mount, this path still scales
        // (its starting style is on when `data-side` flips) while Motion has already taken scale 1.
        !useSpring &&
          "data-[side=none]:data-starting-style:scale-100 data-[side=none]:data-ending-style:scale-100",
        // The fade and scale of the spring path, so both paths match
        !useSpring && "micro-interactions [transition-property:opacity,scale] duration-300",
        className,
      )}
      {...props}
    />
  );
}

function SelectItem({ className, ...props }: SelectItemProps) {
  return (
    <BaseSelect.Item
      className={cnState(
        "relative flex w-full cursor-default items-center rounded-sm py-1.5 ps-2 pe-8 outline-none",
        FIELD_TEXT_SIZE,
        "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        "cursor-pointer",
        className,
      )}
      {...props}
    />
  );
}

// The popup is as wide as the trigger: a word longer than that breaks. Only the text wraps, since
// overflow-wrap is inherited and would squeeze a badge or shortcut beside it.
function SelectItemText({ className, ...props }: SelectItemTextProps) {
  return (
    <BaseSelect.ItemText
      className={cnState("min-w-0 [overflow-wrap:anywhere]", className)}
      {...props}
    />
  );
}

// Children replace the check, as on Combobox.ItemIndicator (#564). With `render` and no children,
// there is no check: the render element draws its own, and may be a void element like <img> (#581).
function SelectItemIndicator({ className, children, ...props }: SelectItemIndicatorProps) {
  return (
    <BaseSelect.ItemIndicator
      className={cnState("absolute end-2 flex items-center", className)}
      {...props}
    >
      {children == null && !props.render ? (
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
      ) : (
        children
      )}
    </BaseSelect.ItemIndicator>
  );
}

// As wide as the trigger, aligned over it or below it (#506): Base UI sets --anchor-width in both
function SelectPositioner({ className, ...props }: SelectPositionerProps) {
  return (
    <BaseSelect.Positioner
      className={cnState("z-dropdowns w-[var(--anchor-width)]", className)}
      {...props}
    />
  );
}

function SelectGroupLabel({ className, ...props }: SelectGroupLabelProps) {
  return (
    <BaseSelect.GroupLabel
      className={cnState("cursor-default px-2 py-1 text-muted-foreground text-xs", className)}
      {...props}
    />
  );
}

function SelectPortal({ children, ref, ...props }: ComponentProps<typeof BaseSelect.Portal>) {
  const [portalRef, portalNode] = usePortalNode(ref);
  return (
    <BaseSelect.Portal ref={portalRef} container={usePortalContainer()} {...props}>
      {/* Popups opened inside portal in here, and the scrub cursor with them, as in Popover */}
      <PortalContainerProvider value={portalNode}>{children}</PortalContainerProvider>
    </BaseSelect.Portal>
  );
}

export const Select = {
  Group: BaseSelect.Group,
  GroupLabel: SelectGroupLabel,
  Icon: SelectIcon,
  Item: SelectItem,
  ItemIndicator: SelectItemIndicator,
  ItemText: SelectItemText,
  Popup: SelectPopup,
  Portal: SelectPortal,
  Positioner: SelectPositioner,
  Root: SelectRoot,
  Trigger: SelectTrigger,
  Value: SelectValue,
};

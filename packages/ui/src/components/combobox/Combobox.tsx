"use client";

import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import {
  type ComponentProps,
  createContext,
  type RefObject,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn, cnState } from "../../lib/cn";
import { mergeLabels } from "../../lib/labels";
import { springs } from "../../lib/motion";
import {
  PortalContainerProvider,
  usePortalContainer,
  usePortalNode,
} from "../../lib/portal-container";
import { useMergedRef } from "../../lib/use-merged-ref";
import { usePopupRender } from "../../lib/use-popup-render";
import { CloseIcon } from "../CloseIcon";
import { removeButtonName } from "../chip/Chip";
import { FIELD_TEXT_SIZE, FOCUS_RING, FOCUS_RING_WITHIN, RING_TRANSITION } from "../shared";
import { type ComboboxLabels, DEFAULT_COMBOBOX_LABELS } from "./Combobox.Labels";

const ComboboxLabelsContext = createContext(DEFAULT_COMBOBOX_LABELS);
// Whether Combobox.Root selects several, as Base UI reads `multiple`: any truthy value (#541)
const ComboboxMultipleContext = createContext(false);
// The id of the Combobox.Chip around a ChipRemove, which names the remove button
const ComboboxChipIdContext = createContext<string | undefined>(undefined);
// The trigger and the last close's event, for the Popup's focus hand-off (#627). `null` under a
// Base UI Root, so two such comboboxes never share them.
type CloseFocus = {
  trigger: RefObject<HTMLButtonElement | null>;
  closeEvent: RefObject<Event | undefined>;
};
const ComboboxCloseFocusContext = createContext<CloseFocus | null>(null);

// The defaults match ComponentProps<typeof BaseCombobox.Root>, the type before labels were added
export type ComboboxRootProps<
  Value = unknown,
  Multiple extends boolean | undefined = boolean | undefined,
  Item = Value,
> = BaseCombobox.Root.Props<Value, Multiple, Item> & {
  /**
   * Replaces the built-in English strings, e.g. to translate them. Keys you leave out keep the
   * default from `DEFAULT_COMBOBOX_LABELS`. An `aria-label` on a part takes precedence.
   */
  labels?: Partial<ComboboxLabels>;
};
export type ComboboxInputProps = ComponentProps<typeof BaseCombobox.Input>;
export type ComboboxTriggerProps = ComponentProps<typeof BaseCombobox.Trigger>;
export type ComboboxPopupProps = ComponentProps<typeof BaseCombobox.Popup>;
export type ComboboxItemProps = ComponentProps<typeof BaseCombobox.Item>;
export type ComboboxItemIndicatorProps = ComponentProps<typeof BaseCombobox.ItemIndicator>;
export type ComboboxEmptyProps = ComponentProps<typeof BaseCombobox.Empty>;
export type ComboboxClearProps = ComponentProps<typeof BaseCombobox.Clear>;
export type ComboboxGroupLabelProps = ComponentProps<typeof BaseCombobox.GroupLabel>;
export type ComboboxIconProps = ComponentProps<typeof BaseCombobox.Icon>;
// Named keys: a prop Base UI adds to Value later is rejected where passed, never a span attribute
export type ComboboxValueProps = Omit<ComponentProps<"span">, "children" | "placeholder"> &
  Pick<BaseCombobox.Value.Props, "children" | "placeholder">;
export type ComboboxPositionerProps = Omit<
  ComponentProps<typeof BaseCombobox.Positioner>,
  "sideOffset"
> & {
  /**
   * Distance from the anchor in pixels: the input, or the `Combobox.Control` around it.
   * @default 8
   */
  sideOffset?: ComponentProps<typeof BaseCombobox.Positioner>["sideOffset"];
};
export type ComboboxGroupProps = ComponentProps<typeof BaseCombobox.Group>;
export type ComboboxListProps = ComponentProps<typeof BaseCombobox.List>;
export type ComboboxChipsProps = ComponentProps<typeof BaseCombobox.Chips>;
export type ComboboxChipProps = ComponentProps<typeof BaseCombobox.Chip>;
export type ComboboxChipRemoveProps = ComponentProps<typeof BaseCombobox.ChipRemove>;
export type ComboboxControlProps = ComponentProps<typeof BaseCombobox.InputGroup>;

function ComboboxRoot<Value, Multiple extends boolean | undefined = false, Item = Value>({
  labels,
  onOpenChange,
  ...props
}: ComboboxRootProps<Value, Multiple, Item>) {
  const [closeFocus] = useState<CloseFocus>(() => ({
    trigger: { current: null },
    closeEvent: { current: undefined },
  }));
  return (
    <ComboboxLabelsContext.Provider value={mergeLabels(DEFAULT_COMBOBOX_LABELS, labels)}>
      <ComboboxMultipleContext.Provider value={Boolean(props.multiple)}>
        <ComboboxCloseFocusContext.Provider value={closeFocus}>
          <BaseCombobox.Root<Value, Multiple, Item>
            {...props}
            onOpenChange={(open, details) => {
              onOpenChange?.(open, details);
              if (open || details.isCanceled) return;
              // A controlled parent may ignore the close: clear the event after the task
              const { event } = details;
              closeFocus.closeEvent.current = event;
              setTimeout(() => {
                if (closeFocus.closeEvent.current === event)
                  closeFocus.closeEvent.current = undefined;
              });
            }}
          />
        </ComboboxCloseFocusContext.Provider>
      </ComboboxMultipleContext.Provider>
    </ComboboxLabelsContext.Provider>
  );
}

// Base UI's InputGroup, so the popup anchors to the whole Control (#478).
// Clear and Trigger sit over its end, 42px of it: pe-12 keeps its content out from under them,
// with room for a chip's focus ring (#484).
function ComboboxControl({ className, ...props }: ComboboxControlProps) {
  return (
    <BaseCombobox.InputGroup
      className={cnState(
        "relative flex flex-wrap items-center gap-1 rounded-md border border-input bg-background px-3 pe-12 py-1.5",
        FOCUS_RING_WITHIN,
        "[&_[role=combobox]:focus-visible]:outline-none",
        RING_TRANSITION,
        "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

// In a single-select, Clear and Trigger sit over its end, 42px of it: pe-12 keeps its text out
// from under them, as on the Control (#520). A px-* replaces it: inside the Control, the input's
// px-0 does.
function ComboboxInput({ className, ...props }: ComboboxInputProps) {
  return (
    <BaseCombobox.Input
      className={cnState(
        "flex h-ui-height w-full rounded-md border border-input bg-background px-3 pe-12",
        FIELD_TEXT_SIZE,
        "placeholder:text-muted-foreground",
        FOCUS_RING,
        RING_TRANSITION,
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

// With neither children nor `render`, the Trigger draws a chevron and is named "Show options"
// (`labels.trigger`). Children or a `render` element replace both: a trigger-style Combobox shows
// the selected value inside its Trigger, so that content names it (#581). A consumer's aria-label
// replaces the default; inside Field.Root, Base UI's aria-labelledby still takes precedence.
function ComboboxTrigger({ className, children, ref, ...props }: ComboboxTriggerProps) {
  const labels = useContext(ComboboxLabelsContext);
  const ownRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useMergedRef(useContext(ComboboxCloseFocusContext)?.trigger ?? ownRef, ref);
  const ownContent = children != null || props.render != null;
  return (
    <BaseCombobox.Trigger
      ref={triggerRef}
      aria-label={ownContent ? undefined : labels.trigger}
      className={cnState(
        "absolute inset-y-0 end-0 flex items-center pe-2",
        // Within its container around a one-line Combobox.Value, as Select.Trigger (#518)
        "min-w-0 max-w-full",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {ownContent ? (
        children
      ) : (
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

// Children replace the chevron; with `render` and no children, there is no chevron (#581)
function ComboboxIcon({ className, ...props }: ComboboxIconProps) {
  return (
    <BaseCombobox.Icon className={cnState("ms-auto", className)} {...props}>
      {props.children == null && !props.render ? (
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
        props.children
      )}
    </BaseCombobox.Icon>
  );
}

// As Select.Value (#518, #546): one line with an ellipsis. Base UI's Value renders no element, so
// nothing clipped it (#541). A function child in a multi-select gets no span, so it is not clipped
// or muted: it returns chips or the Chips, which must stay children of Combobox.Chips, so clip
// your own element there.
function ComboboxValue({ className, children, placeholder, ...props }: ComboboxValueProps) {
  const multiple = useContext(ComboboxMultipleContext);
  const value = <BaseCombobox.Value placeholder={placeholder}>{children}</BaseCombobox.Value>;
  if (multiple && typeof children === "function") return value;
  return (
    <span
      className={cn(
        "flex-1 text-start overflow-hidden text-ellipsis whitespace-nowrap",
        // Muted while nothing is selected, as on Select.Trigger. in-data-placeholder: matches any
        // ancestor with data-placeholder: the Trigger, and the Control. So all the span shows is
        // muted then, not the placeholder alone. Base UI marks every Trigger, the one beside an
        // input too, so muting the Trigger would also mute its children or render element (#564).
        "in-data-placeholder:text-muted-foreground",
        className,
      )}
      {...props}
    >
      {value}
    </span>
  );
}

// 8px clears the input's focus ring (2px of --ring, 2px outside the input), as on Popover.Content
// and Menu.Content
function ComboboxPositioner({ className, sideOffset = 8, ...props }: ComboboxPositionerProps) {
  return (
    <BaseCombobox.Positioner
      className={cnState("z-dropdowns w-[var(--anchor-width)]", className)}
      sideOffset={sideOffset}
      {...props}
    />
  );
}

// With the input inside, Base UI returns focus to the trigger only at the unmount, after the exit,
// so a Tab during it landed on <body> (#627): focus moves to the trigger as the popup closes.
function ComboboxPopup({ className, render: renderProp, ref, ...props }: ComboboxPopupProps) {
  const closeFocus = useContext(ComboboxCloseFocusContext);
  const [popup, setPopup] = useState<HTMLDivElement | null>(null);
  const popupRef = useMergedRef(setPopup, ref);
  const defaultFinalFocus = props.finalFocus === undefined || props.finalFocus === true;
  useLayoutEffect(() => {
    if (!popup || !closeFocus || !defaultFinalFocus) return;
    const doc = popup.ownerDocument;
    const root = popup.getRootNode() as Document | ShadowRoot;
    // In WebKit, Base UI blurs the input before `data-closed`: <body> then counts as inside
    let leftForNowhere = false;
    const onFocusOut = (event: FocusEvent) => {
      leftForNowhere = event.relatedTarget === null;
    };
    const onFocusIn = () => {
      leftForNowhere = false;
    };
    const focusInside = () =>
      popup.contains(root.activeElement) || (leftForNowhere && doc.activeElement === doc.body);
    const closing = () =>
      popup.hasAttribute("data-closed") && popup.getAttribute("role") === "dialog";
    const stopWaiting = () => {
      doc.removeEventListener("keypress", handOff, true);
      doc.removeEventListener("keyup", handOff, true);
    };
    // Checks again after a wait: the popup may have reopened
    const handOff = () => {
      stopWaiting();
      if (closing() && focusInside()) closeFocus.trigger.current?.focus({ preventScroll: true });
    };
    const observer = new MutationObserver(() => {
      if (!closing()) return;
      const event = closeFocus.closeEvent.current;
      closeFocus.closeEvent.current = undefined;
      // A mouse or pen press closes it before the browser moves focus to what was pressed: leave
      // focus to the browser, not through the trigger (its focus and blur handlers would fire)
      if (event?.type === "pointerdown" || event?.type === "mousedown") return;
      // Enter with nothing highlighted is not default-prevented: its keypress would click the
      // trigger and reopen the popup, so wait for that keypress (or the keyup)
      if (event?.type === "keydown" && !event.defaultPrevented) {
        doc.addEventListener("keypress", handOff, true);
        doc.addEventListener("keyup", handOff, true);
      } else {
        handOff();
      }
    });
    observer.observe(popup, { attributeFilter: ["data-closed"] });
    popup.addEventListener("focusout", onFocusOut);
    popup.addEventListener("focusin", onFocusIn);
    return () => {
      observer.disconnect();
      popup.removeEventListener("focusout", onFocusOut);
      popup.removeEventListener("focusin", onFocusIn);
      stopWaiting();
    };
  }, [popup, defaultFinalFocus, closeFocus]);

  const { useSpring, render } = usePopupRender(renderProp, {
    spring: springs.popup,
    from: { opacity: 0, scale: 0.95 },
    to: { opacity: 1, scale: 1 },
  });

  return (
    <BaseCombobox.Popup
      ref={popupRef}
      render={render}
      className={cnState(
        "rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md",
        "max-h-[var(--available-height)] overflow-y-auto overscroll-contain scroll-py-1",
        "origin-(--transform-origin)",
        !useSpring && "data-starting-style:scale-95 data-starting-style:opacity-0",
        !useSpring && "data-ending-style:scale-95 data-ending-style:opacity-0",
        // Only the fade and scale: `all` would also animate the max-height that
        // --available-height drives.
        !useSpring && "micro-interactions [transition-property:opacity,scale] duration-300",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxItem({ className, ...props }: ComboboxItemProps) {
  return (
    <BaseCombobox.Item
      className={cnState(
        "relative flex w-full cursor-default items-center rounded-sm py-1.5 ps-2 pe-8 text-sm outline-none",
        // The popup is as wide as its anchor: a word longer than that breaks
        "[overflow-wrap:anywhere]",
        "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

// Children replace the check; with `render` and no children, there is no check (#581)
function ComboboxItemIndicator({ className, ...props }: ComboboxItemIndicatorProps) {
  return (
    <BaseCombobox.ItemIndicator
      className={cnState("absolute end-2 flex items-center", className)}
      {...props}
    >
      {props.children == null && !props.render ? (
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
        props.children
      )}
    </BaseCombobox.ItemIndicator>
  );
}

function ComboboxEmpty({ className, ...props }: ComboboxEmptyProps) {
  return (
    <BaseCombobox.Empty
      // Base UI keeps it mounted, without children, as a live region while items match: no
      // padding then, or it leaves a gap under the items
      className={cnState(
        "px-2 py-4 text-center text-muted-foreground text-sm empty:p-0",
        className,
      )}
      {...props}
    />
  );
}

// An icon button: named "Clear selection" (`labels.clear`) whatever its content, and a consumer's
// aria-label replaces that. Children replace the X; with `render` and no children, there is no X
// (#581).
function ComboboxClear({ className, children, ...props }: ComboboxClearProps) {
  const labels = useContext(ComboboxLabelsContext);
  return (
    <BaseCombobox.Clear
      aria-label={labels.clear}
      className={cnState(
        "absolute inset-y-0 end-7 flex items-center text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:hover:text-muted-foreground",
        "micro-interactions",
        className,
      )}
      {...props}
    >
      {children == null && !props.render ? <CloseIcon className="size-3.5" /> : children}
    </BaseCombobox.Clear>
  );
}

function ComboboxGroupLabel({ className, ...props }: ComboboxGroupLabelProps) {
  return (
    <BaseCombobox.GroupLabel
      className={cnState("px-2 py-1.5 font-semibold text-muted-foreground text-xs", className)}
      {...props}
    />
  );
}

function ComboboxChips({ className, ...props }: ComboboxChipsProps) {
  return (
    <BaseCombobox.Chips
      className={cnState("flex flex-wrap items-center gap-1", className)}
      {...props}
    />
  );
}

function ComboboxChip({ className, id, ...props }: ComboboxChipProps) {
  const generatedId = useId();
  const chipId = id ?? generatedId;
  return (
    <ComboboxChipIdContext.Provider value={chipId}>
      <BaseCombobox.Chip
        id={chipId}
        // needs `relative` for `z-*`; lifts above the next flush chip
        className={cnState(
          "inline-flex items-center gap-1 rounded-sm border border-border bg-muted px-1.5 py-0.5 text-xs",
          FOCUS_RING,
          "focus-visible:relative focus-visible:z-[1]",
          RING_TRANSITION,
          className,
        )}
        {...props}
      />
    </ComboboxChipIdContext.Provider>
  );
}

function ComboboxChipRemove({ className, children, ...props }: ComboboxChipRemoveProps) {
  const labels = useContext(ComboboxLabelsContext);
  const chipId = useContext(ComboboxChipIdContext);
  const id = useId();
  // Inside a chip the name comes from `aria-labelledby` (the chip's text), not an aria-label.
  // The hidden name text sits beside the button, not inside, so a void `render` element can mount.
  const name = removeButtonName(labels.chipRemove, chipId ?? "", id);
  const namedByChip = chipId !== undefined && props["aria-label"] === undefined;
  return (
    <>
      {namedByChip && name.hiddenText}
      <BaseCombobox.ChipRemove
        {...(namedByChip
          ? { "aria-labelledby": name.labelledBy }
          : { "aria-label": name.withoutChip })}
        className={cnState(
          "micro-interactions inline-flex items-center text-muted-foreground hover:text-foreground data-disabled:cursor-not-allowed data-disabled:hover:text-muted-foreground",
          className,
        )}
        {...props}
      >
        {children == null && !props.render ? <CloseIcon className="size-3" /> : children}
      </BaseCombobox.ChipRemove>
    </>
  );
}

function ComboboxPortal({ children, ref, ...props }: ComponentProps<typeof BaseCombobox.Portal>) {
  const [portalRef, portalNode] = usePortalNode(ref);
  return (
    <BaseCombobox.Portal ref={portalRef} container={usePortalContainer()} {...props}>
      {/* The open popup aria-hides nodes outside its portal, so popups opened inside portal in here, and the scrub cursor with them */}
      <PortalContainerProvider value={portalNode}>{children}</PortalContainerProvider>
    </BaseCombobox.Portal>
  );
}

export const Combobox = {
  Root: ComboboxRoot,
  Control: ComboboxControl,
  Input: ComboboxInput,
  Trigger: ComboboxTrigger,
  Icon: ComboboxIcon,
  Portal: ComboboxPortal,
  Positioner: ComboboxPositioner,
  Popup: ComboboxPopup,
  List: BaseCombobox.List,
  Item: ComboboxItem,
  ItemIndicator: ComboboxItemIndicator,
  Empty: ComboboxEmpty,
  Clear: ComboboxClear,
  Group: BaseCombobox.Group,
  GroupLabel: ComboboxGroupLabel,
  Chips: ComboboxChips,
  Chip: ComboboxChip,
  ChipRemove: ComboboxChipRemove,
  Value: ComboboxValue,
  Status: BaseCombobox.Status,
};

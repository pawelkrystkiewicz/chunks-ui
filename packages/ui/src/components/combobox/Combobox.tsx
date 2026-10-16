"use client";

import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { type ComponentProps, createContext, type ReactNode, useContext, useId } from "react";
import { cnState } from "../../lib/cn";
import { mergeLabels } from "../../lib/labels";
import { springs } from "../../lib/motion";
import {
  PortalContainerProvider,
  usePortalContainer,
  usePortalNode,
} from "../../lib/portal-container";
import { usePopupRender } from "../../lib/use-popup-render";
import { CloseIcon } from "../CloseIcon";
import { removeButtonName } from "../chip/Chip";
import { FOCUS_RING, FOCUS_RING_WITHIN, RING_TRANSITION } from "../shared";
import { type ComboboxLabels, DEFAULT_COMBOBOX_LABELS } from "./Combobox.Labels";

const ComboboxLabelsContext = createContext(DEFAULT_COMBOBOX_LABELS);
// The id of the Combobox.Chip around a ChipRemove, which names the remove button
const ComboboxChipIdContext = createContext<string | undefined>(undefined);

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
  ...props
}: ComboboxRootProps<Value, Multiple, Item>) {
  return (
    <ComboboxLabelsContext.Provider value={mergeLabels(DEFAULT_COMBOBOX_LABELS, labels)}>
      <BaseCombobox.Root<Value, Multiple, Item> {...props} />
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

function ComboboxInput({ className, ...props }: ComboboxInputProps) {
  return (
    <BaseCombobox.Input
      className={cnState(
        "flex h-ui-height w-full rounded-md border border-input bg-background px-3 text-sm",
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

// Trigger, Clear and ChipRemove render an aria-hidden icon by default, so they name themselves
// with a default name from `labels`. Custom children or a `render` element own the content instead
// (a fixed label would hide their visible text), so neither the name nor the icon is applied then.
// A consumer's aria-label replaces the default; inside Field.Root, Base UI's aria-labelledby on
// the Trigger still takes precedence over any aria-label.
function ownContent(
  children: ReactNode,
  render: unknown,
  name: { "aria-label"?: string; "aria-labelledby"?: string },
  icon: ReactNode,
) {
  const hasOwnContent = children != null || render != null;
  return hasOwnContent ? { children } : { ...name, children: icon };
}

function ComboboxTrigger({ className, children, ...props }: ComboboxTriggerProps) {
  const labels = useContext(ComboboxLabelsContext);
  return (
    <BaseCombobox.Trigger
      {...ownContent(
        children,
        props.render,
        { "aria-label": labels.trigger },
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
        </svg>,
      )}
      className={cnState(
        "absolute inset-y-0 end-0 flex items-center pe-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxIcon({ className, ...props }: ComboboxIconProps) {
  return (
    <BaseCombobox.Icon className={cnState("ms-auto", className)} {...props}>
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

function ComboboxPopup({ className, render: renderProp, ...props }: ComboboxPopupProps) {
  const { useSpring, render } = usePopupRender(renderProp, {
    spring: springs.popup,
    from: { opacity: 0, scale: 0.95 },
    to: { opacity: 1, scale: 1 },
  });

  return (
    <BaseCombobox.Popup
      render={render}
      className={cnState(
        "rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md",
        "max-h-[var(--available-height)] overflow-y-auto overscroll-contain scroll-py-1",
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
        "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxItemIndicator({ className, ...props }: ComboboxItemIndicatorProps) {
  return (
    <BaseCombobox.ItemIndicator
      className={cnState("absolute end-2 flex items-center", className)}
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

function ComboboxClear({ className, children, ...props }: ComboboxClearProps) {
  const labels = useContext(ComboboxLabelsContext);
  return (
    <BaseCombobox.Clear
      {...ownContent(
        children,
        props.render,
        { "aria-label": labels.clear },
        <CloseIcon className="size-3.5" />,
      )}
      className={cnState(
        "absolute inset-y-0 end-7 flex items-center text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:hover:text-muted-foreground",
        "micro-interactions",
        className,
      )}
      {...props}
    />
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
  // Named by hidden text around the chip's text: "Remove Apple", or "Apple を削除". The button
  // sits inside the chip, so it has no aria-label: one would be read again as part of the chip's
  // text. Without a Combobox.Chip around it, there is no chip text to read, and `{chip}` is dropped.
  const name = removeButtonName(labels.chipRemove, chipId ?? "", id);
  const namedByChip = chipId !== undefined && props["aria-label"] === undefined;
  return (
    <BaseCombobox.ChipRemove
      {...ownContent(
        children,
        props.render,
        namedByChip ? { "aria-labelledby": name.labelledBy } : { "aria-label": name.withoutChip },
        <>
          {namedByChip && name.hiddenText}
          <CloseIcon className="size-3" />
        </>,
      )}
      className={cnState(
        "micro-interactions inline-flex items-center text-muted-foreground hover:text-foreground data-disabled:cursor-not-allowed data-disabled:hover:text-muted-foreground",
        className,
      )}
      {...props}
    />
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
  Value: BaseCombobox.Value,
  Status: BaseCombobox.Status,
};

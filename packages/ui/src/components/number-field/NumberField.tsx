"use client";

import { NumberField as BaseNumberField } from "@base-ui/react/number-field";
import { type ComponentProps, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { cnState } from "../../lib/cn";
import { mergeLabels } from "../../lib/labels";
import { usePortalContainer } from "../../lib/portal-container";
import { type PartRenderProp, useRenderPart } from "../../lib/use-render-part";
import { RING_TRANSITION } from "../shared";
import { DEFAULT_NUMBER_FIELD_LABELS, type NumberFieldLabels } from "./NumberField.Labels";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const NumberFieldLabelsContext = createContext(DEFAULT_NUMBER_FIELD_LABELS);

export type NumberFieldRootProps = ComponentProps<typeof BaseNumberField.Root> & {
  /**
   * Replaces the built-in English strings, e.g. to translate them. Keys you leave out keep the
   * default from `DEFAULT_NUMBER_FIELD_LABELS`. `aria-label` and `aria-roledescription` on a part
   * take precedence.
   */
  labels?: Partial<NumberFieldLabels>;
};
export type NumberFieldGroupProps = ComponentProps<typeof BaseNumberField.Group>;
export type NumberFieldInputProps = ComponentProps<typeof BaseNumberField.Input>;
export type NumberFieldIncrementProps = ComponentProps<typeof BaseNumberField.Increment>;
export type NumberFieldDecrementProps = ComponentProps<typeof BaseNumberField.Decrement>;
export type NumberFieldScrubAreaProps = ComponentProps<typeof BaseNumberField.ScrubArea>;
export type NumberFieldScrubAreaCursorProps = ComponentProps<
  typeof BaseNumberField.ScrubAreaCursor
>;

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function NumberFieldRoot({ className, labels, ...props }: NumberFieldRootProps) {
  return (
    <NumberFieldLabelsContext.Provider value={mergeLabels(DEFAULT_NUMBER_FIELD_LABELS, labels)}>
      <BaseNumberField.Root className={cnState("flex flex-col", className)} {...props} />
    </NumberFieldLabelsContext.Provider>
  );
}

function NumberFieldGroup({ className, ...props }: NumberFieldGroupProps) {
  return (
    <BaseNumberField.Group
      className={cnState(
        "flex items-center rounded-md border border-input bg-background",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
        RING_TRANSITION,
        "has-[input:disabled]:pointer-events-none has-[input:disabled]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function NumberFieldInput({ className, ...props }: NumberFieldInputProps) {
  const labels = useContext(NumberFieldLabelsContext);
  return (
    <BaseNumberField.Input
      aria-roledescription={labels.roleDescription}
      className={cnState(
        "h-ui-height w-full min-w-16 flex-1 bg-transparent px-3 text-center text-foreground text-sm tabular-nums",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none",
        "disabled:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}

function NumberFieldIncrement({ className, ...props }: NumberFieldIncrementProps) {
  const labels = useContext(NumberFieldLabelsContext);
  return (
    <BaseNumberField.Increment
      aria-label={labels.increment}
      className={cnState(
        "micro-interactions flex h-ui-height items-center justify-center px-2 text-muted-foreground hover:text-foreground",
        "border-input border-s",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    </BaseNumberField.Increment>
  );
}

function NumberFieldDecrement({ className, ...props }: NumberFieldDecrementProps) {
  const labels = useContext(NumberFieldLabelsContext);
  return (
    <BaseNumberField.Decrement
      aria-label={labels.decrement}
      className={cnState(
        "micro-interactions flex h-ui-height items-center justify-center px-2 text-muted-foreground hover:text-foreground",
        "border-input border-e",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 12h14" />
      </svg>
    </BaseNumberField.Decrement>
  );
}

function NumberFieldScrubArea({ className, ...props }: NumberFieldScrubAreaProps) {
  return (
    <BaseNumberField.ScrubArea
      className={cnState("cursor-ew-resize select-none text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

const SCRUB_CURSOR_ICON = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2 12h20M6 8l-4 4 4 4M18 8l4 4-4 4" />
  </svg>
);

/**
 * Base UI hides the system cursor with pointer lock while the user scrubs, and renders this part
 * (only while scrubbing) as the stand-in. With neither children nor `render` it shows a
 * left-right arrow; a `render` element draws its own cursor and may be a void element like <img>.
 * Inside a `PortalContainerProvider` it renders in the provider's element, like the popups, so a
 * theme scoped to that element reaches it. That element must not establish a containing block (no
 * `transform`, `filter`, `perspective`, `contain`, `will-change` or `container-type`): Base UI
 * positions the cursor with viewport coordinates (`position: fixed` and `translate3d`). Inside
 * Dialog, Drawer, Popover and Combobox content, which reset the provider, it renders in `<body>`.
 */
function NumberFieldScrubAreaCursor({
  className,
  children,
  render,
  ...props
}: NumberFieldScrubAreaCursorProps) {
  return (
    <BaseNumberField.ScrubAreaCursor
      className={cnState("z-cursor text-foreground drop-shadow-sm", className)}
      {...props}
      render={(renderProps, state) => (
        <ScrubAreaCursorElement {...renderProps} state={state} render={render} />
      )}
    >
      {children == null && !render ? SCRUB_CURSOR_ICON : children}
    </BaseNumberField.ScrubAreaCursor>
  );
}

// Base UI portals the cursor to <body> and exposes no `container` prop on ScrubAreaCursor (1.9.0),
// so a theme scoped to the PortalContainerProvider's element would not reach it. A second portal,
// inside Base UI's, puts the element in that container; Base UI's refs still reach it, so the
// cursor still follows the pointer. A `container` prop upstream would remove this wrapper. Without
// a provider, or while its element is still null, the cursor stays in <body>: it only exists
// during a scrub, and a hidden pointer with no stand-in would be worse than the root theme.
// Base UI sets the cursor's `position: fixed` and a viewport `translate3d`, so a container that
// establishes a containing block (transform, filter, perspective, contain, will-change,
// container-type) offsets the cursor from the pointer: the docs state this limit.
function ScrubAreaCursorElement({
  state,
  render,
  ref,
  ...props
}: ComponentProps<"span"> & {
  state: BaseNumberField.ScrubAreaCursor.State;
  render: PartRenderProp<BaseNumberField.ScrubAreaCursor.State>;
}) {
  const container = usePortalContainer();
  const element = useRenderPart(render, state, ref ?? null, props);
  return container ? createPortal(element, container) : element;
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const NumberField = {
  Root: NumberFieldRoot,
  Group: NumberFieldGroup,
  Input: NumberFieldInput,
  Increment: NumberFieldIncrement,
  Decrement: NumberFieldDecrement,
  ScrubArea: NumberFieldScrubArea,
  ScrubAreaCursor: NumberFieldScrubAreaCursor,
};

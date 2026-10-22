"use client";

import { NumberField as BaseNumberField } from "@base-ui/react/number-field";
import {
  cnState,
  DEFAULT_NUMBER_FIELD_LABELS,
  FIELD_TEXT_SIZE,
  FOCUS_RING_WITHIN,
  mergeLabels,
  type NumberFieldLabels,
  RING_TRANSITION,
} from "chunks-ui-core";
import { type ComponentProps, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { usePortalContainer } from "../../lib/portal-container";
import { type PartRenderProp, useRenderPart } from "../../lib/use-render-part";

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
        FOCUS_RING_WITHIN,
        RING_TRANSITION,
        "has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50",
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
        "h-ui-height w-full min-w-16 flex-1 bg-transparent px-3 text-center text-foreground tabular-nums",
        FIELD_TEXT_SIZE,
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none",
        "disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  );
}

// Children replace the plus, and the button keeps its aria-label whatever its content (#564).
// With `render` and no children, there is no plus: the render element draws its own (#581).
function NumberFieldIncrement({ className, children, ...props }: NumberFieldIncrementProps) {
  const labels = useContext(NumberFieldLabelsContext);
  return (
    <BaseNumberField.Increment
      aria-label={labels.increment}
      className={cnState(
        "micro-interactions flex h-ui-height items-center justify-center px-2 text-muted-foreground hover:text-foreground disabled:hover:text-muted-foreground",
        "border-input border-s",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children == null && !props.render ? (
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
      ) : (
        children
      )}
    </BaseNumberField.Increment>
  );
}

// Children replace the minus, and the button keeps its aria-label whatever its content (#564).
// With `render` and no children, there is no minus: the render element draws its own (#581).
function NumberFieldDecrement({ className, children, ...props }: NumberFieldDecrementProps) {
  const labels = useContext(NumberFieldLabelsContext);
  return (
    <BaseNumberField.Decrement
      aria-label={labels.decrement}
      className={cnState(
        "micro-interactions flex h-ui-height items-center justify-center px-2 text-muted-foreground hover:text-foreground disabled:hover:text-muted-foreground",
        "border-input border-e",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children == null && !props.render ? (
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
      ) : (
        children
      )}
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
 * It renders in the provider's element, like the popups: see `PortalContainerProvider`.
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

// Base UI has no `container` prop on ScrubAreaCursor (1.9.0), so a second portal inside its own
// puts the cursor in the PortalContainerProvider's element; Base UI's refs still reach it.
// Without a provider, or while its element is null, the cursor stays in <body>.
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

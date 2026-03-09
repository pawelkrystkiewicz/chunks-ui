"use client";

import { NumberField as BaseNumberField } from "@base-ui/react/number-field";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NumberFieldRootProps = ComponentProps<typeof BaseNumberField.Root>;
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

function NumberFieldRoot({ className, ...props }: NumberFieldRootProps) {
  return <BaseNumberField.Root className={cn("flex flex-col", className)} {...props} />;
}

function NumberFieldGroup({ className, ...props }: NumberFieldGroupProps) {
  return (
    <BaseNumberField.Group
      className={cn(
        "flex items-center rounded border border-input bg-background",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
        "has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function NumberFieldInput({ className, ...props }: NumberFieldInputProps) {
  return (
    <BaseNumberField.Input
      className={cn(
        "h-9 w-full min-w-16 flex-1 bg-transparent px-3 text-center text-foreground text-sm tabular-nums",
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
  return (
    <BaseNumberField.Increment
      className={cn(
        "micro-interactions flex h-9 items-center justify-center px-2 text-muted-foreground hover:text-foreground",
        "border-input border-l",
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
  return (
    <BaseNumberField.Decrement
      className={cn(
        "micro-interactions flex h-9 items-center justify-center px-2 text-muted-foreground hover:text-foreground",
        "border-input border-r",
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
      className={cn("cursor-ew-resize select-none text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function NumberFieldScrubAreaCursor({ className, ...props }: NumberFieldScrubAreaCursorProps) {
  return <BaseNumberField.ScrubAreaCursor className={cn("hidden", className)} {...props} />;
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

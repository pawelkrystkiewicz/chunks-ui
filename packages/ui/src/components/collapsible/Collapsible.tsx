"use client";

import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { cnState, FOCUS_RING, RING_TRANSITION } from "chunks-ui-core";
import type { ComponentProps } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CollapsibleRootProps = ComponentProps<typeof BaseCollapsible.Root>;
export type CollapsibleTriggerProps = ComponentProps<typeof BaseCollapsible.Trigger>;
export type CollapsiblePanelProps = ComponentProps<typeof BaseCollapsible.Panel>;

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function CollapsibleRoot({ className, ...props }: CollapsibleRootProps) {
  return <BaseCollapsible.Root className={className} {...props} />;
}

function CollapsibleTrigger({ className, ...props }: CollapsibleTriggerProps) {
  return (
    <BaseCollapsible.Trigger
      className={cnState(
        "flex w-full cursor-pointer items-center justify-between font-medium text-sm",
        "hover:text-foreground/80",
        FOCUS_RING,
        RING_TRANSITION,
        // Base UI (1.9+) gives a disabled <button> trigger the disabled attribute, and a trigger
        // rendered as another element (nativeButton={false}) aria-disabled
        "disabled:pointer-events-none disabled:opacity-50",
        "aria-disabled:pointer-events-none aria-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function CollapsiblePanel({ className, ...props }: CollapsiblePanelProps) {
  return (
    <BaseCollapsible.Panel
      className={cnState(
        "overflow-hidden text-sm",
        "micro-interactions h-(--collapsible-panel-height)",
        "data-ending-style:h-0 data-starting-style:h-0",
        className,
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const Collapsible = {
  Root: CollapsibleRoot,
  Trigger: CollapsibleTrigger,
  Panel: CollapsiblePanel,
};

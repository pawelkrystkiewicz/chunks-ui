"use client";

import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

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
      className={cn(
        "flex w-full cursor-pointer items-center justify-between font-medium text-sm",
        "hover:text-foreground/80",
        "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function CollapsiblePanel({ className, ...props }: CollapsiblePanelProps) {
  return (
    <BaseCollapsible.Panel
      className={cn(
        "overflow-hidden text-sm",
        "h-[var(--collapsible-panel-height)] transition-[height] duration-200 ease-out",
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

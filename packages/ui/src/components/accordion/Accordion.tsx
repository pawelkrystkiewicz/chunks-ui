"use client";

import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import type { ComponentProps } from "react";
import { cnState } from "../../lib/cn";
import { FOCUS_RING, RING_TRANSITION } from "../shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AccordionRootProps = ComponentProps<typeof BaseAccordion.Root>;
export type AccordionItemProps = ComponentProps<typeof BaseAccordion.Item>;
export type AccordionHeaderProps = ComponentProps<typeof BaseAccordion.Header>;
export type AccordionTriggerProps = ComponentProps<typeof BaseAccordion.Trigger>;
export type AccordionPanelProps = ComponentProps<typeof BaseAccordion.Panel>;

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function AccordionRoot({ className, ...props }: AccordionRootProps) {
  return (
    <BaseAccordion.Root
      className={cnState("w-full divide-y divide-border", className)}
      {...props}
    />
  );
}

const AccordionItem = BaseAccordion.Item;

function AccordionHeader({ className, ...props }: AccordionHeaderProps) {
  return <BaseAccordion.Header className={cnState("flex", className)} {...props} />;
}

function AccordionTrigger({ className, children, ...props }: AccordionTriggerProps) {
  return (
    <BaseAccordion.Trigger
      className={cnState(
        // The trigger, not the item, gets data-panel-open, so the chevron rotates off it
        "group/trigger flex flex-1 cursor-pointer items-center justify-between py-4 text-left font-medium text-sm",
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
    >
      {children}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="shrink-0 transition-transform duration-200 motion-reduce:transition-none group-data-[panel-open]/trigger:rotate-180"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </BaseAccordion.Trigger>
  );
}

function AccordionPanel({ className, ...props }: AccordionPanelProps) {
  return (
    <BaseAccordion.Panel
      className={cnState(
        "overflow-hidden text-muted-foreground text-sm",
        "h-[var(--accordion-panel-height)] transition-[height] duration-200 ease-out motion-reduce:transition-none",
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

export const Accordion = {
  Root: AccordionRoot,
  Item: AccordionItem,
  Header: AccordionHeader,
  Trigger: AccordionTrigger,
  Panel: AccordionPanel,
};

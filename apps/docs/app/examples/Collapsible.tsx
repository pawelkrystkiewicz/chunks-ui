"use client";

import { Collapsible } from "chunks-ui";
import { ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { Container } from "@/components";

export function CollapsibleBasicExample() {
  return (
    <Container centered={false}>
      <Collapsible.Root className="w-full max-w-md">
        <Collapsible.Trigger className="py-2">Toggle details</Collapsible.Trigger>
        <Collapsible.Panel>
          <div className="pb-4 text-muted-foreground">
            This content is hidden by default and revealed when the trigger is clicked.
          </div>
        </Collapsible.Panel>
      </Collapsible.Root>
    </Container>
  );
}

export function CollapsibleDefaultOpenExample() {
  return (
    <Container centered={false}>
      <Collapsible.Root defaultOpen className="group w-full max-w-md">
        <Collapsible.Trigger className="flex items-center gap-1.5 py-2">
          <ChevronRightIcon className="size-4 transition-transform duration-200 group-data-[panel-open]:rotate-90" />
          Shipping information
        </Collapsible.Trigger>
        <Collapsible.Panel>
          <div className="pb-4 pl-5.5 text-muted-foreground">
            Free shipping on orders over $50. Standard delivery takes 3-5 business days.
          </div>
        </Collapsible.Panel>
      </Collapsible.Root>
    </Container>
  );
}

export function CollapsibleControlledExample() {
  const [open, setOpen] = useState(false);

  return (
    <Container centered={false}>
      <div className="flex w-full max-w-md flex-col gap-2">
        <p className="text-muted-foreground text-sm">Panel is {open ? "open" : "closed"}</p>
        <Collapsible.Root open={open} onOpenChange={setOpen}>
          <Collapsible.Trigger className="py-2">Advanced settings</Collapsible.Trigger>
          <Collapsible.Panel>
            <div className="pb-4 text-muted-foreground">
              Controlled mode lets you manage the open state externally.
            </div>
          </Collapsible.Panel>
        </Collapsible.Root>
      </div>
    </Container>
  );
}

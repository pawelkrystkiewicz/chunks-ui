"use client";

import { Field, Switch } from "chunks-ui";
import { useState } from "react";
import { PreviewCard, PreviewCardHeading } from "./PreviewCard";

const ITEMS = [
  { id: "deployments", title: "Deployments", desc: "When a build finishes or fails" },
  { id: "mentions", title: "Mentions", desc: "When someone tags you" },
  { id: "digest", title: "Weekly digest", desc: "A summary every Monday" },
];

export function NotificationsCard() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    deployments: true,
    mentions: true,
    digest: false,
  });

  return (
    <PreviewCard>
      <PreviewCardHeading title="Notifications" description="Choose what you hear about." />
      <div className="flex flex-col">
        {ITEMS.map((item, i) => (
          <Field.Root
            key={item.id}
            className={`flex-row items-center justify-between gap-4 py-3 ${i > 0 ? "border-border border-t" : ""}`}
          >
            <div className="flex flex-col gap-0.5">
              <Field.Label className="leading-normal">{item.title}</Field.Label>
              <Field.Description>{item.desc}</Field.Description>
            </div>
            <Switch.Root
              aria-label={item.title}
              checked={enabled[item.id]}
              onCheckedChange={(checked) => setEnabled((prev) => ({ ...prev, [item.id]: checked }))}
            >
              <Switch.Thumb />
            </Switch.Root>
          </Field.Root>
        ))}
      </div>
    </PreviewCard>
  );
}

"use client";

import { Radio } from "chunks-ui";
import { useState } from "react";
import { PaymentDialog } from "./overlays/PaymentDialog";
import { PreviewCard, PreviewCardHeading } from "./PreviewCard";

const PLANS = [
  { id: "hobby", name: "Hobby", price: "$0", desc: "Personal projects" },
  { id: "pro", name: "Pro", price: "$20", desc: "Unlimited projects, 10 seats" },
  { id: "team", name: "Team", price: "$49", desc: "SSO, audit logs, priority support" },
];

export function PlanCard() {
  const [plan, setPlan] = useState("pro");
  const selected = PLANS.find((p) => p.id === plan) ?? (PLANS[1] as (typeof PLANS)[number]);

  return (
    <PreviewCard>
      <PreviewCardHeading title="Choose a plan" description="Billed monthly. Cancel any time." />
      <Radio.Group value={plan} onValueChange={(v) => setPlan(String(v))}>
        {PLANS.map((p) => (
          // biome-ignore lint/a11y/noLabelWithoutControl: wraps Base UI Radio (button-based control)
          <label
            key={p.id}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 micro-interactions ${
              p.id === plan
                ? "border-primary bg-[color-mix(in_oklch,var(--primary)_6%,transparent)]"
                : "border-border"
            }`}
          >
            <Radio.Root value={p.id} className="mt-0.5">
              <Radio.Indicator />
            </Radio.Root>
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="font-semibold text-sm">{p.name}</span>
              <span className="text-muted-foreground text-xs">{p.desc}</span>
            </span>
            <span className="font-semibold text-sm">{p.price}</span>
          </label>
        ))}
      </Radio.Group>
      <PaymentDialog plan={selected} />
    </PreviewCard>
  );
}

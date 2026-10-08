"use client";

import { Button, Dialog, Field, Input } from "chunks-ui";
import { useRef } from "react";
import { focusOnOpen, OverlayHeader } from "./parts";

type Plan = { name: string; price: string; desc: string };

/** A demo checkout: no `<form>`, no network, nothing stored. Pay only closes it. */
export function PaymentDialog({ plan }: { plan: Plan }) {
  const cardNumber = useRef<HTMLInputElement>(null);

  return (
    <Dialog.Root>
      <Dialog.Trigger render={<Button className="w-full" />}>
        Continue with {plan.name}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup
          initialFocus={focusOnOpen(cardNumber)}
          className="flex w-[calc(100%-32px)] flex-col gap-5"
        >
          <OverlayHeader
            title="Payment details"
            description="A demo checkout. Nothing is charged, sent or stored."
          />
          <div className="flex items-center justify-between gap-3 rounded-lg bg-muted px-4 py-3">
            <span className="flex flex-col gap-0.5">
              <span className="font-semibold text-sm">{plan.name} plan</span>
              <span className="text-muted-foreground text-xs">{plan.desc}</span>
            </span>
            <span className="whitespace-nowrap font-semibold text-sm">
              {plan.price}
              <span className="font-normal text-muted-foreground text-xs"> / month</span>
            </span>
          </div>
          <div className="flex flex-col gap-4">
            <Field.Root className="gap-2">
              <Field.Label>Card number</Field.Label>
              <Input
                ref={cardNumber}
                inputMode="numeric"
                autoComplete="off"
                placeholder="4242 4242 4242 4242"
              />
            </Field.Root>
            <div className="grid grid-cols-2 gap-3">
              <Field.Root className="gap-2">
                <Field.Label>Expiry</Field.Label>
                <Input inputMode="numeric" autoComplete="off" placeholder="MM / YY" />
              </Field.Root>
              <Field.Root className="gap-2">
                <Field.Label>CVC</Field.Label>
                <Input inputMode="numeric" autoComplete="off" placeholder="123" />
              </Field.Root>
            </div>
            <Field.Root className="gap-2">
              <Field.Label>Name on card</Field.Label>
              <Input autoComplete="off" placeholder="Alice Martin" />
            </Field.Root>
          </div>
          <div className="flex justify-end gap-2">
            <Dialog.Close render={<Button variant="outlined" color="secondary" />}>
              Cancel
            </Dialog.Close>
            <Dialog.Close render={<Button />}>Pay {plan.price}</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

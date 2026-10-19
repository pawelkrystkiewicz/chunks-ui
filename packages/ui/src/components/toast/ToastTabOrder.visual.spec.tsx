import { render, screen } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { Toast } from "./index";
import { AddToasts } from "./Toast.TestUtils";

/*
 * Base UI 1.9 aria-hides a high-priority toast until keyboard focus enters the viewport, and a
 * toast's close button while the toasts are collapsed, but leaves both in the tab order
 * (mui/base-ui#5659). Toast.Root, Toast.Close and Toast.Action take themselves out of it for that
 * time (#685). ToastTabOrder.webkit.visual.spec.tsx runs these rows in WebKit too.
 */

/**
 * The nodes axe's aria-hidden-focus rule fails in `context`, and those it can't decide: with a
 * toast of the default priority (a role="dialog") on screen, axe takes it for an open modal and
 * lists a focusable aria-hidden node under `incomplete`. A rule that threw lands there with no
 * nodes, so it shows as its id.
 */
async function ariaHiddenFocus(context: Element) {
  const { violations, incomplete } = await axe.run(context, { runOnly: ["aria-hidden-focus"] });
  return [...violations, ...incomplete].flatMap((rule) =>
    rule.nodes.length > 0 ? rule.nodes.map((node) => node.html) : [rule.id],
  );
}

/** Presses Tab `count` times and returns the element that has focus after each press */
async function tabThrough(count: number) {
  const reached: (Element | null)[] = [];
  for (let i = 0; i < count; i++) {
    await userEvent.keyboard("{Tab}");
    reached.push(document.activeElement);
  }
  return reached;
}

/** A high-priority toast with a title, a description, an action and a close button, between two fields */
async function renderUrgentToast() {
  const manager = Toast.createToastManager();
  const result = render(
    <Toast.Provider toastManager={manager}>
      <input aria-label="Before" />
      <Toast.Viewport />
      <input aria-label="After" />
    </Toast.Provider>,
  );
  manager.add({
    title: "Connection lost",
    description: "Reconnecting automatically.",
    priority: "high",
    actionProps: { children: "Retry now" },
    dismissible: true,
    timeout: 0,
  });
  // aria-hidden, so only a query with `hidden` finds it
  const toast = await screen.findByRole("alertdialog", { hidden: true });
  return { ...result, toast };
}

describe("Toast tab order while Base UI hides a toast from assistive tech", () => {
  it("keeps a high-priority toast, its action and its close button out of it before focus", async () => {
    const { container, toast } = await renderUrgentToast();
    expect(toast).toHaveAttribute("aria-hidden", "true");
    expect(await ariaHiddenFocus(container)).toEqual([]);
  });

  it("passes over a hidden high-priority toast on Tab, and F6 then Tab reaches it and its buttons", async () => {
    const { toast } = await renderUrgentToast();
    screen.getByRole("textbox", { name: "Before" }).focus();
    expect(await tabThrough(1)).toEqual([screen.getByRole("textbox", { name: "After" })]);

    // F6 focuses the viewport, and Tab hands focus from there to the newest toast
    await userEvent.keyboard("{F6}");
    expect(toast).not.toHaveAttribute("aria-hidden");
    expect(await tabThrough(3)).toEqual([
      toast,
      screen.getByRole("button", { name: "Retry now" }),
      screen.getByRole("button", { name: "Close" }),
    ]);
  });

  // A pointer over the viewport expands the toasts, but a high-priority toast stays aria-hidden
  // until keyboard focus enters it: its Action and Close must not get their tab stops back
  it("keeps the action and the close button of a hidden high-priority toast out of it under the pointer", async () => {
    const { container, toast } = await renderUrgentToast();
    await userEvent.hover(toast);
    // The pointer expanded the toasts: without this, the checks below would pass for any hover
    await expect.poll(() => toast.hasAttribute("data-expanded")).toBe(true);
    expect(toast).toHaveAttribute("aria-hidden", "true");
    expect(await ariaHiddenFocus(container)).toEqual([]);
  });

  it("keeps the close buttons of a collapsed stack out of it", async () => {
    const { container } = render(
      <Toast.Provider>
        <AddToasts count={3} />
        <Toast.Viewport />
      </Toast.Provider>,
    );
    await screen.findByText("Toast 3");
    // aria-hidden until the stack expands, so found by their label
    const closes = screen.getAllByLabelText("Close", { selector: "button" });
    expect(closes.map((close) => close.getAttribute("aria-hidden"))).toEqual([
      "true",
      "true",
      "true",
    ]);
    expect(await ariaHiddenFocus(container)).toEqual([]);
  });

  // Keyboard focus on a toast expands the stack, which brings the close buttons back
  it("reaches every toast and close button of a stack that Tab expands", async () => {
    render(
      <Toast.Provider>
        <input aria-label="Before" />
        <AddToasts count={3} />
        <Toast.Viewport />
        <input aria-label="After" />
      </Toast.Provider>,
    );
    await screen.findByText("Toast 3");
    screen.getByRole("textbox", { name: "Before" }).focus();
    const toastOf = (title: string) => screen.getByText(title).closest(".Toast");
    const closeOf = (title: string) =>
      toastOf(title)?.querySelector(`button[aria-label="Close"]`) ?? null;
    // The newest toast comes first
    expect(await tabThrough(7)).toEqual([
      toastOf("Toast 3"),
      closeOf("Toast 3"),
      toastOf("Toast 2"),
      closeOf("Toast 2"),
      toastOf("Toast 1"),
      closeOf("Toast 1"),
      screen.getByRole("textbox", { name: "After" }),
    ]);
  });
});

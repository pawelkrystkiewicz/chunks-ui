import { render } from "@testing-library/react";
import { useState } from "react";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { emulateReducedMotion, exited, settled } from "../../VisualTest.utils";
import { DatePicker } from "./index";

// The pickers below hand focus to the trigger as the popup starts to close, as an uncontrolled
// picker opened by its trigger does (DatePicker.visual.spec.tsx). Only a real browser runs the 0.3s
// exit, before Base UI's own return at the unmount. The CSS path only: with reduced motion the
// exit is a frame. No screenshots.

/**
 * Resolves with the focused element as `popup` starts to close. Made after the popup mounted, this
 * observer runs after the hand-off's, so it sees where a hand-off that does not wait moved focus.
 */
const focusAtClose = (popup: HTMLElement) =>
  new Promise<Element | null>((resolve) => {
    const observer = new MutationObserver(() => {
      if (!popup.hasAttribute("data-closed")) return;
      observer.disconnect();
      resolve(document.activeElement);
    });
    observer.observe(popup, { attributeFilter: ["data-closed"] });
  });

describe("DatePicker focus as a controlled popup closes", () => {
  beforeEach(() => emulateReducedMotion(false));
  afterAll(() => emulateReducedMotion(true));

  /**
   * Opens a picker from its trigger. The consumer keeps the open state and passes each change on,
   * a close `closeAfter` ms later when it is set: after the task of the close's event.
   */
  const open = async (closeAfter?: number) => {
    const onOpenChange = vi.fn();
    const onValueChange = vi.fn();
    function Controlled() {
      const [isOpen, setOpen] = useState(false);
      return (
        <DatePicker
          defaultValue={new Date(2026, 2, 15)}
          onValueChange={onValueChange}
          open={isOpen}
          onOpenChange={(next, eventDetails) => {
            onOpenChange(next, eventDetails.reason);
            if (next || closeAfter === undefined) setOpen(next);
            else setTimeout(() => setOpen(false), closeAfter);
          }}
        />
      );
    }
    const view = render(
      <div className="flex w-72 flex-col items-start gap-2" style={{ padding: 40 }}>
        <Controlled />
      </div>,
    );
    const trigger = view.getByRole("button", { name: "March 15, 2026" });
    await userEvent.click(trigger);
    expect(onOpenChange).toHaveBeenLastCalledWith(true, "trigger-press");
    const day = await view.findByRole("button", { name: "Sunday, March 15, 2026" });
    await expect.poll(() => document.activeElement).toBe(day);
    // Open at rest: closed during its entry, the popup can leave at once
    const popup = view.getByRole("dialog");
    await settled(popup);
    return { trigger, popup, onOpenChange, onValueChange };
  };

  it("moves focus to the trigger on Escape", async () => {
    const { popup, trigger, onOpenChange } = await open();
    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "escape-key");
    expect(document.activeElement).toBe(trigger);
    await exited(popup);
    expect(document.activeElement).toBe(trigger);
  });

  // The pick's close carries the key's click, so the hand-off waits for the repeat's keypress
  // before it moves focus: the repeat does not reach the trigger and open the calendar again, and
  // the trigger shows its ring, as after a close by a key
  it("keeps the calendar closed and the trigger focused, and picks once, when the picking Enter repeats once during the exit", async () => {
    const { popup, trigger, onOpenChange, onValueChange } = await open();
    onOpenChange.mockClear();
    await userEvent.keyboard("{ArrowDown}{Enter>2}{/Enter}");
    // Once: Chromium used to pick the day again on the repeat's keypress
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(new Date(2026, 2, 22));
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(trigger);
    expect(trigger.matches(":focus-visible"), "the trigger shows its ring").toBe(true);
    await exited(popup);
    expect(onOpenChange).toHaveBeenCalledWith(false, "close-press");
    expect(onOpenChange).not.toHaveBeenCalledWith(true, expect.anything());
    expect(document.activeElement).toBe(trigger);
  });

  // The pick's event is gone by the time the consumer closes, so the close counts as one by the
  // prop: focus still inside goes to the trigger at once
  it("moves focus to the trigger when the consumer passes a pick's close on later", async () => {
    const { popup, trigger, onOpenChange } = await open(200);
    const atClose = focusAtClose(popup);
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "close-press");
    expect(await atClose).toBe(trigger);
    await exited(popup);
    expect(document.activeElement).toBe(trigger);
  });

  // An open the trigger did not start carries no trigger: the picker hands focus to its one trigger
  // all the same, where Base UI would return it only at the unmount, and after an open by another
  // control to that control
  it("moves focus to the trigger on Escape, when another control opened it", async () => {
    function OpenFromButton() {
      const [isOpen, setOpen] = useState(false);
      return (
        <div className="flex w-72 flex-col items-start gap-2" style={{ padding: 40 }}>
          <button type="button" onClick={() => setOpen(true)}>
            Set due date
          </button>
          <DatePicker defaultValue={new Date(2026, 2, 15)} open={isOpen} onOpenChange={setOpen} />
        </div>
      );
    }
    const view = render(<OpenFromButton />);
    const trigger = view.getByRole("button", { name: "March 15, 2026" });
    await userEvent.click(view.getByRole("button", { name: "Set due date" }));
    const day = await view.findByRole("button", { name: "Sunday, March 15, 2026" });
    await expect.poll(() => document.activeElement).toBe(day);
    const popup = view.getByRole("dialog");
    await settled(popup);
    await userEvent.keyboard("{Escape}");
    expect(document.activeElement).toBe(trigger);
    await exited(popup);
    expect(document.activeElement).toBe(trigger);
  });
});

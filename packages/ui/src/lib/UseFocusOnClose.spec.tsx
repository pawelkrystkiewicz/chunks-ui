import { act, cleanup, render } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type CloseFocus, useCloseFocusRoot, useFocusOnClose } from "./use-focus-on-close";

afterEach(cleanup);

type Details = { event: Event; reason: string; trigger?: Element; isCanceled: boolean };

let state: CloseFocus;
let openChange: (open: boolean, details: Details) => void;

/**
 * A trigger and a popup with a field in it; the test closes it by setting `data-closed`.
 * `detached` takes the hand-off away and keeps the DOM.
 */
function Popup({ finalFocus, detached = false }: { finalFocus?: unknown; detached?: boolean }) {
  const [closeFocus, handleOpenChange] = useCloseFocusRoot<Details>(undefined);
  state = closeFocus;
  openChange = handleOpenChange;
  const ref = useFocusOnClose<HTMLDivElement>(undefined, detached ? null : closeFocus, {
    finalFocus,
  });
  return (
    <>
      <button type="button">Trigger</button>
      <div data-testid="popup" data-open="" ref={ref}>
        <input aria-label="Inside" />
      </div>
      <input aria-label="Outside" />
    </>
  );
}

const details = (reason: string, event: Event, trigger?: Element): Details => ({
  reason,
  event,
  trigger,
  isCanceled: false,
});

/**
 * Opens from the trigger, focuses the field inside, closes with `close`, and lets the observer
 * run. `focus` counts the trigger's focus() calls from the close on. With no `close`, it closes as
 * a consumer that sets `open` to false does: Base UI reports nothing.
 */
async function openThenClose(
  close: Details | undefined,
  { strict = false, finalFocus }: { strict?: boolean; finalFocus?: unknown } = {},
) {
  const ui = <Popup finalFocus={finalFocus} />;
  const view = render(strict ? <StrictMode>{ui}</StrictMode> : ui);
  const trigger = view.getByRole("button", { name: "Trigger" });
  const popup = view.getByTestId("popup");
  openChange(true, details("trigger-press", new MouseEvent("click"), trigger));
  view.getByRole("textbox", { name: "Inside" }).focus();
  const focus = vi.spyOn(trigger, "focus");
  if (close) openChange(false, close);
  popup.removeAttribute("data-open");
  // A microtask: the observer's callback
  await act(async () => popup.setAttribute("data-closed", ""));
  return { ...view, trigger, popup, focus };
}

describe("useCloseFocusRoot", () => {
  // The consumer's handler sees the state before the call notes anything
  it("calls the consumer's handler first, notes the open's trigger, and keeps a close's event until the end of its task, none of a cancelled one", () => {
    vi.useFakeTimers();
    try {
      const calls: string[] = [];
      function Root() {
        const [closeFocus, handleOpenChange] = useCloseFocusRoot<Details>((open) => {
          const noted = open ? closeFocus.trigger.current?.id : closeFocus.close.current?.reason;
          calls.push(`${open ? "open" : "close"}: ${noted ?? "nothing noted"}`);
        });
        state = closeFocus;
        openChange = handleOpenChange;
        return <button type="button" id="trigger" />;
      }
      const { getByRole } = render(<Root />);
      openChange(true, details("trigger-press", new MouseEvent("click"), getByRole("button")));
      expect(state.trigger.current).toBe(getByRole("button"));
      const event = new KeyboardEvent("keydown");
      openChange(false, { ...details("escape-key", event), isCanceled: true });
      expect(state.close.current).toBeUndefined();
      openChange(false, details("escape-key", event));
      expect(calls).toEqual([
        "open: nothing noted",
        "close: nothing noted",
        "close: nothing noted",
      ]);
      expect(state.close.current).toEqual({ event, reason: "escape-key" });
      vi.runAllTimers();
      expect(state.close.current).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("useFocusOnClose", () => {
  it("moves focus from inside the closing popup to the trigger", async () => {
    const { trigger } = await openThenClose(
      details("item-press", new MouseEvent("click", { detail: 1 })),
    );
    expect(document.activeElement).toBe(trigger);
  });

  it("moves it once in StrictMode, with its effects run twice", async () => {
    const { trigger, focus } = await openThenClose(
      details("item-press", new MouseEvent("click", { detail: 1 })),
      { strict: true },
    );
    expect(document.activeElement).toBe(trigger);
    expect(focus).toHaveBeenCalledTimes(1);
  });

  it("leaves focus that is already outside the popup", async () => {
    const view = render(<Popup />);
    const popup = view.getByTestId("popup");
    openChange(true, details("trigger-press", new MouseEvent("click"), view.getByRole("button")));
    const outside = view.getByRole("textbox", { name: "Outside" });
    outside.focus();
    await act(async () => popup.setAttribute("data-closed", ""));
    expect(document.activeElement).toBe(outside);
  });

  it.each([
    { close: "a mouse press outside", event: new MouseEvent("mousedown"), reason: "outside-press" },
    // A tap or a scroll: a focus() may scroll the page where `preventScroll` is unsupported
    { close: "a touch outside", event: new Event("touchend"), reason: "outside-press" },
    // Combobox closes on the tap's click (touch: "intentional")
    {
      close: "a touch tap outside, on its click",
      event: new PointerEvent("click", { pointerType: "touch", bubbles: true, detail: 1 }),
      reason: "outside-press",
    },
    { close: "a hover", event: new MouseEvent("mouseleave"), reason: "trigger-hover" },
  ])("leaves focus to the browser after $close", async ({ event, reason }) => {
    const { getByRole } = await openThenClose(details(reason, event));
    expect(document.activeElement).toBe(getByRole("textbox", { name: "Inside" }));
  });

  it("does nothing with an element as finalFocus", async () => {
    const { getByRole } = await openThenClose(
      details("item-press", new MouseEvent("click", { detail: 1 })),
      { finalFocus: { current: null } },
    );
    expect(document.activeElement).toBe(getByRole("textbox", { name: "Inside" }));
  });

  // A click from Enter or Space has no click count (detail 0). Its keyup may be to come (a Base UI
  // item clicks on the keydown), or gone (a native button's Space clicks on the keyup).
  const keyCloses = [
    { close: "a keydown that is not default-prevented", event: new KeyboardEvent("keydown") },
    { close: "a click made by a key", event: new MouseEvent("click", { detail: 0 }) },
  ];

  it.each(keyCloses)("waits after $close, and hands over at the keyup", async ({ event }) => {
    const { trigger, getByRole } = await openThenClose(details("item-press", event));
    expect(document.activeElement).toBe(getByRole("textbox", { name: "Inside" }));
    document.dispatchEvent(new KeyboardEvent("keyup"));
    expect(document.activeElement).toBe(trigger);
  });

  // Before the key's own handlers and its default: a Tab then leaves from the trigger
  it.each(keyCloses)("hands over at the next key's keydown after $close", async ({ event }) => {
    const { trigger } = await openThenClose(details("item-press", event));
    let focusedAtTab: Element | null = null;
    document.addEventListener(
      "keydown",
      () => {
        focusedAtTab = document.activeElement;
      },
      { once: true },
    );
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    expect(focusedAtTab).toBe(trigger);
  });

  it("does not hand over at a held key's repeated keydown", async () => {
    const { trigger, getByRole } = await openThenClose(
      details("item-press", new MouseEvent("click", { detail: 0 })),
    );
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", repeat: true }));
    expect(document.activeElement).toBe(getByRole("textbox", { name: "Inside" }));
    document.dispatchEvent(new KeyboardEvent("keyup"));
    expect(document.activeElement).toBe(trigger);
  });

  it("hands over at a keypress, and leaves it alone", async () => {
    const { trigger, getByRole } = await openThenClose(
      details("item-press", new MouseEvent("click", { detail: 0 })),
    );
    const keypress = new KeyboardEvent("keypress", { key: "Enter", cancelable: true });
    getByRole("textbox", { name: "Inside" }).dispatchEvent(keypress);
    expect(document.activeElement).toBe(trigger);
    expect(keypress.defaultPrevented).toBe(false);
  });

  const repeat = (key: string) =>
    new KeyboardEvent("keydown", { key, repeat: true, bubbles: true, cancelable: true });

  // A Base UI item acts on each Enter or Space keydown, and Chromium's button on each keypress,
  // which a cancelled keydown does not send
  it.each(["Enter", " "])(
    "cancels the repeated keydown of a held %j inside the closing popup, and goes on waiting",
    async (key) => {
      const { trigger, getByRole } = await openThenClose(
        details("item-press", new MouseEvent("click", { detail: 0 })),
      );
      const inside = getByRole("textbox", { name: "Inside" });
      const keydown = repeat(key);
      inside.dispatchEvent(keydown);
      expect(keydown.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(inside);
      document.dispatchEvent(new KeyboardEvent("keyup"));
      expect(document.activeElement).toBe(trigger);
    },
  );

  // Hands over at once: the trigger, focused, would open the popup again
  const expectCancelledUntilKeyup = (trigger: Element) => {
    expect(document.activeElement).toBe(trigger);
    const first = repeat("Enter");
    trigger.dispatchEvent(first);
    expect(first.defaultPrevented).toBe(true);
    document.dispatchEvent(new KeyboardEvent("keyup"));
    const afterKeyUp = repeat("Enter");
    trigger.dispatchEvent(afterKeyUp);
    expect(afterKeyUp.defaultPrevented).toBe(false);
  };

  it("cancels a held Enter's repeats at the trigger after a close Base UI does not report, until the keyup", async () => {
    const { trigger } = await openThenClose(undefined);
    expectCancelledUntilKeyup(trigger);
  });

  // Base UI's Combobox closes on an Enter with nothing highlighted without preventing it: the
  // keypress follows, and the repeats of the held key come after it
  it("goes on cancelling a held Enter's repeats at the trigger after the closing keydown's keypress, until the keyup", async () => {
    const { trigger, getByRole } = await openThenClose(
      details("none", new KeyboardEvent("keydown", { key: "Enter", cancelable: true })),
    );
    getByRole("textbox", { name: "Inside" }).dispatchEvent(
      new KeyboardEvent("keypress", { key: "Enter", bubbles: true, cancelable: true }),
    );
    expectCancelledUntilKeyup(trigger);
  });

  // Select keeps its popup mounted: a close that hands over at once left its listeners behind
  it("drops the last close's key listeners when the popup reopens", async () => {
    const { trigger, popup, getByRole } = await openThenClose(
      details("item-press", new MouseEvent("click", { detail: 1 })),
    );
    openChange(true, details("trigger-press", new MouseEvent("click", { detail: 1 }), trigger));
    await act(async () => {
      popup.removeAttribute("data-closed");
      popup.setAttribute("data-open", "");
    });
    const inside = getByRole("textbox", { name: "Inside" });
    inside.focus();
    openChange(false, details("outside-press", new PointerEvent("pointerdown")));
    popup.removeAttribute("data-open");
    await act(async () => popup.setAttribute("data-closed", ""));
    expect(document.activeElement).toBe(inside);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    expect(document.activeElement).toBe(inside);
  });

  // A held Shift+Tab out of a Select or Menu closes it and goes on from the trigger; focus the
  // consumer moved out of the popup keeps the key's own action
  it("leaves alone the repeats of other keys, and repeats aimed elsewhere", async () => {
    const { trigger, getByRole } = await openThenClose(
      details("item-press", new MouseEvent("click", { detail: 1 })),
    );
    const tab = repeat("Tab");
    trigger.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(false);
    const outside = getByRole("textbox", { name: "Outside" });
    outside.focus();
    const enter = repeat("Enter");
    outside.dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(outside);
  });

  // The DOM stays, with focus inside: only the cleanup keeps the keyup from moving it
  it("stops waiting when its effect cleans up", async () => {
    const { getByRole, rerender, focus } = await openThenClose(
      details("escape-key", new KeyboardEvent("keydown")),
    );
    rerender(<Popup detached />);
    document.dispatchEvent(new KeyboardEvent("keyup"));
    expect(focus).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(getByRole("textbox", { name: "Inside" }));
  });
});

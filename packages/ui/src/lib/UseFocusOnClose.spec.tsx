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
 * run. `focus` counts the trigger's focus() calls from the close on.
 */
async function openThenClose(
  close: Details,
  { strict = false, finalFocus }: { strict?: boolean; finalFocus?: unknown } = {},
) {
  const ui = <Popup finalFocus={finalFocus} />;
  const view = render(strict ? <StrictMode>{ui}</StrictMode> : ui);
  const trigger = view.getByRole("button", { name: "Trigger" });
  const popup = view.getByTestId("popup");
  openChange(true, details("trigger-press", new MouseEvent("click"), trigger));
  view.getByRole("textbox", { name: "Inside" }).focus();
  const focus = vi.spyOn(trigger, "focus");
  openChange(false, close);
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

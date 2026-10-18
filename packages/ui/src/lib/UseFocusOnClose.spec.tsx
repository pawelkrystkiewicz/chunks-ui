import { act, cleanup, render } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type CloseFocus, useCloseFocusRoot, useFocusOnClose } from "./use-focus-on-close";

afterEach(cleanup);

type Details = { event: Event; reason: string; trigger?: Element; isCanceled: boolean };

let state: CloseFocus;
let openChange: (open: boolean, details: Details) => void;

/** A trigger and a popup with a field in it; the test closes it by setting `data-closed` */
function Popup({ finalFocus }: { finalFocus?: unknown }) {
  const [closeFocus, handleOpenChange] = useCloseFocusRoot<Details>(undefined);
  state = closeFocus;
  openChange = handleOpenChange;
  const ref = useFocusOnClose<HTMLDivElement>(undefined, closeFocus, { finalFocus });
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

/** Opens from the trigger, focuses the field inside, closes with `close`, and lets the observer run */
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
  openChange(false, close);
  popup.removeAttribute("data-open");
  // A microtask: the observer's callback
  await act(async () => popup.setAttribute("data-closed", ""));
  return { ...view, trigger, popup };
}

describe("useCloseFocusRoot", () => {
  it("calls the consumer's handler first, then notes the open's trigger", () => {
    const calls: string[] = [];
    function Root() {
      const [closeFocus, handleOpenChange] = useCloseFocusRoot<Details>(() => {
        calls.push(`handler, trigger ${closeFocus.trigger.current?.id ?? "unset"}`);
      });
      state = closeFocus;
      openChange = handleOpenChange;
      return <button type="button" id="trigger" />;
    }
    const { getByRole } = render(<Root />);
    openChange(true, details("trigger-press", new MouseEvent("click"), getByRole("button")));
    expect(calls).toEqual(["handler, trigger unset"]);
    expect(state.trigger.current).toBe(getByRole("button"));
  });

  it("keeps a close's event until the end of its task, and none of a cancelled close", () => {
    vi.useFakeTimers();
    try {
      render(<Popup />);
      const event = new KeyboardEvent("keydown");
      openChange(false, { ...details("escape-key", event), isCanceled: true });
      expect(state.close.current).toBeUndefined();
      openChange(false, details("escape-key", event));
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
    const { trigger } = await openThenClose(details("item-press", new MouseEvent("click")));
    expect(document.activeElement).toBe(trigger);
  });

  it("moves it once in StrictMode, with its effects run twice", async () => {
    const { trigger } = await openThenClose(details("item-press", new MouseEvent("click")), {
      strict: true,
    });
    expect(document.activeElement).toBe(trigger);
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
    { close: "a hover", event: new MouseEvent("mouseleave"), reason: "trigger-hover" },
  ])("leaves focus to the browser after $close", async ({ event, reason }) => {
    const { getByRole } = await openThenClose(details(reason, event));
    expect(document.activeElement).toBe(getByRole("textbox", { name: "Inside" }));
  });

  it("does nothing with an element as finalFocus", async () => {
    const { getByRole } = await openThenClose(details("item-press", new MouseEvent("click")), {
      finalFocus: { current: null },
    });
    expect(document.activeElement).toBe(getByRole("textbox", { name: "Inside" }));
  });

  it("waits for the keyup of a keydown that is not default-prevented", async () => {
    const { trigger, getByRole } = await openThenClose(
      details("escape-key", new KeyboardEvent("keydown")),
    );
    expect(document.activeElement).toBe(getByRole("textbox", { name: "Inside" }));
    document.dispatchEvent(new KeyboardEvent("keyup"));
    expect(document.activeElement).toBe(trigger);
  });

  // Unmounted mid-exit: the wait goes with it
  it("stops waiting when the popup unmounts", async () => {
    const { trigger, unmount } = await openThenClose(
      details("escape-key", new KeyboardEvent("keydown")),
    );
    const focus = vi.spyOn(trigger, "focus");
    unmount();
    document.dispatchEvent(new KeyboardEvent("keyup"));
    expect(focus).not.toHaveBeenCalled();
  });
});

import { render } from "@testing-library/react";
import { createRef, type ReactNode, useEffect, useState } from "react";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { commands, page, userEvent } from "vitest/browser";
import {
  describeExitPaths,
  emulateReducedMotion,
  enterMotionPath,
  exited,
  isShown,
  recordTabDuringExit,
  renderFixture,
  renderPage,
  settled,
  tookFocus,
} from "../../VisualTest.utils";
import { Button } from "../button";
import { Popover } from "./index";

describe("Popover", () => {
  it("open", async () => {
    const body = await renderPage(
      <div style={{ padding: 40 }}>
        <Popover.Root defaultOpen>
          <Popover.Trigger render={<Button variant="outlined" />}>Trigger</Popover.Trigger>
          <Popover.Content>
            <Popover.Arrow />
            <Popover.Title>Popover Title</Popover.Title>
            <Popover.Description>Popover description content goes here.</Popover.Description>
          </Popover.Content>
        </Popover.Root>
      </div>,
    );
    await expect(body).toMatchScreenshot();
  });

  // One side: PopupArrow.visual.spec.tsx checks the arrow's geometry on every side
  it("arrow, side bottom", async () => {
    const body = await renderPage(
      <div style={{ padding: 120, display: "flex", justifyContent: "center" }}>
        <Popover.Root>
          <Popover.Trigger render={<Button variant="outlined" />}>Trigger</Popover.Trigger>
          <Popover.Content side="bottom">
            <Popover.Arrow />
            <Popover.Title>Title</Popover.Title>
          </Popover.Content>
        </Popover.Root>
      </div>,
    );
    // Opened with the mouse, so the focused popup shows no focus ring; the next spec has one
    await userEvent.click(page.getByRole("button", { name: "Trigger" }));
    await commands.parkPointer();
    await expect(body).toMatchScreenshot();
  });

  it("arrow, side bottom, opened from the keyboard", async () => {
    const body = await renderPage(
      <div style={{ padding: 120, display: "flex", justifyContent: "center" }}>
        <Popover.Root>
          <Popover.Trigger render={<Button variant="outlined" />}>Trigger</Popover.Trigger>
          <Popover.Content side="bottom">
            <Popover.Arrow />
            <Popover.Title>Title</Popover.Title>
          </Popover.Content>
        </Popover.Root>
      </div>,
    );
    page.getByRole("button", { name: "Trigger" }).element().focus();
    await userEvent.keyboard("{Enter}");
    // The popup holds nothing to focus, so it takes focus itself and shows its ring, which must
    // cross the arrow's base, not run under it
    const popup = page.getByRole("dialog");
    await expect.poll(() => popup.element().matches(":focus-visible")).toBe(true);
    await expect(body).toMatchScreenshot();
  });

  it("trigger", async () => {
    const { fixture } = await renderFixture(
      <Popover.Root>
        <Popover.Trigger render={<Button variant="outlined" />}>Open Popover</Popover.Trigger>
      </Popover.Root>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  // #706
  it("modal: closes on a press on a sticky header, which the press does not reach", async () => {
    const onClick = vi.fn();
    const { getByRole, getByTestId } = render(
      <>
        <header className="sticky top-0 z-10">
          <button type="button" onClick={onClick}>
            Header
          </button>
        </header>
        <div style={{ padding: 40 }}>
          <Popover.Root modal>
            <Popover.Trigger>Settings</Popover.Trigger>
            <Popover.Content data-testid="popup">
              <Popover.Description>Content</Popover.Description>
            </Popover.Content>
          </Popover.Root>
        </div>
      </>,
    );
    // Found before the popup opens, as a modal popover hides the page from the accessibility tree
    const header = page.elementLocator(getByRole("button", { name: "Header" }));
    await userEvent.click(getByRole("button", { name: "Settings" }));
    const popup = getByTestId("popup");
    await settled(popup);
    // Forced: Playwright would otherwise wait for the button to be the element under the pointer
    await header.click({ force: true });
    expect(onClick).not.toHaveBeenCalled();
    await exited(popup, { stillClosing: isShown });
  });
});

// Base UI returns focus to the trigger only at the unmount, after the exit: a Tab during it went
// to a focus guard in the closing popup, then <body> (#633)
describeExitPaths("Popover focus as the popup closes", (reduce) => {
  // Enter and Tab go in one call: with reduced motion the popup leaves a frame after the close
  it("moves a Tab pressed during the exit past the trigger, after Popover.Close by Enter", async () => {
    const { popup, after } = await openPopover();
    await userEvent.keyboard("{Tab}");
    const checkTab = recordTabDuringExit(popup, { reduce });
    await userEvent.keyboard("{Enter}{Tab}");
    checkTab();
    expect(document.activeElement).toBe(after);
    await exited(popup);
    expect(document.activeElement).toBe(after);
  });

  // A native button's Space clicks on the keyup: no key is left to wait for but the Tab
  it("moves a Tab pressed during the exit past the trigger, after Popover.Close by Space", async () => {
    const { popup, after } = await openPopover();
    await userEvent.keyboard("{Tab}");
    const checkTab = recordTabDuringExit(popup, { reduce });
    await userEvent.keyboard(" {Tab}");
    checkTab();
    expect(document.activeElement).toBe(after);
    await exited(popup);
    expect(document.activeElement).toBe(after);
  });

  // Chromium used to click Done again on the repeat's keypress, after focus had moved to the
  // trigger. Counted on the popup: Done's clicks bubble to it, the trigger's reopen click does not.
  it("clicks Popover.Close once when the closing Enter repeats during the exit", async () => {
    const { popup } = await openPopover();
    const onClick = vi.fn();
    popup.addEventListener("click", onClick);
    await userEvent.keyboard("{Tab}{Enter>2}{/Enter}");
    expect(onClick).toHaveBeenCalledOnce();
  });

  // A button that sets `open` to false: Base UI reports no close, so the hand-off moved focus at
  // once, and each repeat clicked the trigger, which opened the popover again, then closed it.
  // Skipped with reduced motion: see Select.visual.spec.tsx.
  it.skipIf(reduce)(
    "keeps a controlled popover closed when Enter on a button that closes it repeats during the exit",
    async () => {
      const onSave = vi.fn();
      function Controlled() {
        const [open, setOpen] = useState(false);
        return (
          <div style={{ padding: 40 }}>
            <Popover.Root open={open} onOpenChange={setOpen}>
              <Popover.Trigger>Settings</Popover.Trigger>
              <Popover.Content data-testid="popup">
                <button
                  type="button"
                  onClick={() => {
                    onSave();
                    setOpen(false);
                  }}
                >
                  Save
                </button>
              </Popover.Content>
            </Popover.Root>
          </div>
        );
      }
      const view = render(<Controlled />);
      const trigger = view.getByRole("button", { name: "Settings" });
      await userEvent.click(trigger);
      const save = await view.findByRole("button", { name: "Save" });
      await expect.poll(() => document.activeElement).toBe(save);
      const popup = view.getByTestId("popup");
      await settled(popup);
      const onTriggerClick = vi.fn();
      trigger.addEventListener("click", onTriggerClick);
      await userEvent.keyboard("{Enter>3}{/Enter}");
      expect(onSave).toHaveBeenCalledOnce();
      expect(onTriggerClick, "the trigger was clicked").not.toHaveBeenCalled();
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(document.activeElement).toBe(trigger);
      await exited(popup);
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    },
  );

  // The same close, made from a keydown that is not prevented: the hook cannot tell a key made it,
  // so it handed over at once and the keypress clicked the trigger.
  it("keeps a controlled popover closed when a keydown handler closes it on Enter", async () => {
    const { trigger, popup } = await openControlled((setOpen) => (
      <input
        aria-label="Name"
        onKeyDown={(event) => {
          if (event.key === "Enter") setOpen(false);
        }}
      />
    ));
    const onTriggerClick = vi.fn();
    trigger.addEventListener("click", onTriggerClick);
    await userEvent.keyboard("{Enter}");
    expect(onTriggerClick, "the trigger was clicked").not.toHaveBeenCalled();
    expect(document.activeElement).toBe(trigger);
    await exited(popup);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  // Base UI's `useButton` clicks a non-native button on any Space keyup that reaches it. The
  // hand-off at Space's keypress moved focus to the trigger before that keyup, and it clicked the
  // trigger: the popover opened again.
  it("keeps a controlled popover closed when a keydown handler closes it on Space and the trigger is not a native button", async () => {
    const { trigger, popup } = await openControlled(
      (setOpen) => (
        <input
          aria-label="Name"
          onKeyDown={(event) => {
            if (event.key === " ") setOpen(false);
          }}
        />
      ),
      { nativeTrigger: false },
    );
    const onTriggerClick = vi.fn();
    trigger.addEventListener("click", onTriggerClick);
    await userEvent.keyboard("{ }");
    expect(onTriggerClick, "the trigger was clicked").not.toHaveBeenCalled();
    expect(document.activeElement).toBe(trigger);
    await exited(popup);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  // The keydown is prevented, so the hand-off went at once, and Space's keyup then clicked the
  // trigger
  it("keeps a controlled popover closed when a prevented keydown closes it on Space and the trigger is not a native button", async () => {
    const { trigger, popup } = await openControlled(
      (setOpen) => (
        <input
          aria-label="Name"
          onKeyDown={(event) => {
            if (event.key !== " ") return;
            event.preventDefault();
            setOpen(false);
          }}
        />
      ),
      { nativeTrigger: false },
    );
    const onTriggerClick = vi.fn();
    trigger.addEventListener("click", onTriggerClick);
    await userEvent.keyboard("{ }");
    expect(onTriggerClick, "the trigger was clicked").not.toHaveBeenCalled();
    await exited(popup);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  // Key rollover: another key goes down before Space comes up, and that keyup must still be cancelled
  it("keeps a controlled popover closed when another key goes down between the closing Space's keydown and keyup", async () => {
    const { trigger, popup } = await openControlled(
      (setOpen) => (
        <input
          aria-label="Name"
          onKeyDown={(event) => {
            if (event.key === " ") setOpen(false);
          }}
        />
      ),
      { nativeTrigger: false },
    );
    const onTriggerClick = vi.fn();
    trigger.addEventListener("click", onTriggerClick);
    await userEvent.keyboard("{ >}{Shift>}");
    await exited(popup);
    await userEvent.keyboard("{/ }{/Shift}");
    expect(onTriggerClick, "the trigger was clicked").not.toHaveBeenCalled();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  // With reduced motion the popup has unmounted, and Base UI has returned focus to the trigger,
  // when a real tap's keyup comes some 100 ms after its keydown
  it.runIf(reduce)(
    "keeps a controlled popover closed when Space is held across the exit and the trigger is not a native button",
    async () => {
      const { trigger, popup } = await openControlled(
        (setOpen) => (
          <input
            aria-label="Name"
            onKeyDown={(event) => {
              if (event.key === " ") setOpen(false);
            }}
          />
        ),
        { nativeTrigger: false },
      );
      const onTriggerClick = vi.fn();
      trigger.addEventListener("click", onTriggerClick);
      await userEvent.keyboard("{ >}");
      await exited(popup);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await userEvent.keyboard("{/ }");
      expect(onTriggerClick, "the trigger was clicked").not.toHaveBeenCalled();
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    },
  );

  // A native button clicks on Space's keyup: the keydown is over by then, so nothing is left to
  // wait for and focus goes to the trigger at once, as in 0.3.0
  it("hands focus to the trigger at once when a button that closes a controlled popover is pressed with Space", async () => {
    const { trigger, popup } = await openControlled((setOpen) => (
      <button type="button" onClick={() => setOpen(false)}>
        Save
      </button>
    ));
    await userEvent.keyboard(" ");
    expect(document.activeElement, "focus waited for the exit").toBe(trigger);
    await exited(popup);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  // A click and a key press are two calls, too far apart for the one frame of reduced motion
  it.skipIf(reduce)(
    "moves a Tab pressed during the exit past the trigger, after Popover.Close by click",
    async () => {
      const { popup, after } = await openPopover();
      const checkTab = recordTabDuringExit(popup, { reduce });
      await userEvent.click(page.getByRole("button", { name: "Done" }));
      await userEvent.keyboard("{Tab}");
      checkTab();
      expect(document.activeElement).toBe(after);
      await exited(popup);
      expect(document.activeElement).toBe(after);
    },
  );

  // Opened by mouse: the ring after Escape comes from the keyboard close, as in Base UI's return.
  // Motion and CSS only: reduced motion's one-frame exit adds nothing here.
  it.skipIf(reduce)("moves focus to the trigger on Escape", async () => {
    const { popup, trigger } = await openPopover();
    await userEvent.keyboard("{Escape}");
    expect(document.activeElement).toBe(trigger);
    expect(trigger.matches(":focus-visible"), "the trigger shows its ring").toBe(true);
    await exited(popup);
    expect(document.activeElement).toBe(trigger);
  });

  // Focus must not come back to the trigger, nor pass through it on the way
  it("leaves focus where an outside click put it", async () => {
    const { popup, trigger, before } = await openPopover();
    const triggerFocused = tookFocus(trigger);
    await userEvent.click(before);
    expect(triggerFocused(), "the trigger took focus on the way").toBe(false);
    expect(document.activeElement).toBe(before);
    await exited(popup);
    expect(document.activeElement).toBe(before);
  });

  // The press takes focus to <body>; Base UI's return at the unmount gives it to the trigger, and
  // the popup does so as it starts to close: the same end, sooner
  it("ends with focus on the trigger after a click on a blank area outside", async () => {
    const { popup, trigger } = await openPopover();
    await userEvent.click(page.getByTestId("blank"));
    await exited(popup);
    expect(document.activeElement).toBe(trigger);
  });

  // An element as `finalFocus` keeps Base UI's timing: focus moves there at the unmount
  it("moves focus only at the unmount, to an element passed as finalFocus", async () => {
    const { popup, trigger, before } = await openPopover({ finalFocusBefore: true });
    const triggerFocused = tookFocus(trigger);
    await userEvent.keyboard("{Escape}");
    // Not as the exit starts. Reduced motion's exit of a frame may be over by now.
    if (!reduce) {
      expect(popup.isConnected, "the popup is still closing").toBe(true);
      expect(document.activeElement).not.toBe(before);
    }
    await exited(popup);
    expect(triggerFocused(), "the trigger took focus").toBe(false);
    expect(document.activeElement).toBe(before);
  });
});

// Closes that move focus away themselves: the popup hands nothing to the trigger
describe("Popover focus as the popup closes, focus moved away", () => {
  beforeAll(() => enterMotionPath(true));
  beforeEach(() => emulateReducedMotion(false));
  afterAll(() => emulateReducedMotion(true));

  // Out of the last field, a Tab goes to the field after the trigger and closes the popover
  it("leaves a Tab out of the popup where it went", async () => {
    const { popup, trigger, after } = await openPopover();
    await userEvent.keyboard("{Tab}");
    const triggerFocused = tookFocus(trigger);
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(after);
    await exited(popup);
    expect(triggerFocused(), "the trigger took focus").toBe(false);
    expect(document.activeElement).toBe(after);
  });

  it("leaves focus outside the popup on a hover close", async () => {
    const view = render(popoverFixture({ openOnHover: true }));
    const before = view.getByRole("textbox", { name: "Before" });
    await userEvent.click(before);
    const trigger = view.getByRole("button", { name: "Settings" });
    const triggerFocused = tookFocus(trigger);
    await userEvent.hover(trigger);
    const popup = await view.findByTestId("popup");
    await userEvent.hover(before);
    await exited(popup);
    expect(triggerFocused(), "the trigger took focus").toBe(false);
    expect(document.activeElement).toBe(before);
  });
});

// Base UI 1.9 reports a close a second time, as "focus-out", when focus leaves the trigger during
// the exit
describe("Popover onOpenChange as the popup closes", () => {
  beforeEach(() => emulateReducedMotion(false));
  afterAll(() => emulateReducedMotion(true));

  it("reports a close by Escape once, though a Tab moves focus on from the trigger during the exit", async () => {
    const onOpenChange = vi.fn();
    const { popup, after } = await openPopover({ onOpenChange });
    onOpenChange.mockClear();
    const checkTab = recordTabDuringExit(popup, { reduce: false });
    await userEvent.keyboard("{Escape}{Tab}");
    await exited(popup);
    checkTab();
    expect(document.activeElement).toBe(after);
    expect(onOpenChange.mock.calls).toEqual([[false, "escape-key"]]);
  });

  // A controlled parent keeps `open`; the popup opened by the user, then closed by a prop alone
  function Controlled({ onOpenChange }: { onOpenChange: (open: boolean, reason: string) => void }) {
    const [open, setOpen] = useState(false);
    // The parent's own shortcut: a key is not an outside press
    useEffect(() => {
      const onKeyDown = (event: KeyboardEvent) => event.key === "F2" && setOpen(false);
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }, []);
    return (
      <div style={{ padding: 40 }}>
        <Popover.Root
          open={open}
          onOpenChange={(next, details) => {
            onOpenChange(next, details.reason);
            setOpen(next);
          }}
        >
          <Popover.Trigger>Settings</Popover.Trigger>
          <Popover.Content data-testid="popup">
            <input aria-label="Name" />
          </Popover.Content>
        </Popover.Root>
        <input aria-label="After" />
      </div>
    );
  }

  const openControlledPopover = async () => {
    const onOpenChange = vi.fn();
    const view = render(<Controlled onOpenChange={onOpenChange} />);
    await userEvent.click(view.getByRole("button", { name: "Settings" }));
    const popup = await view.findByTestId("popup");
    await settled(popup);
    return { view, popup, onOpenChange, after: view.getByRole("textbox", { name: "After" }) };
  };

  it("reports a controlled close by Escape once, though a Tab moves focus on from the trigger during the exit", async () => {
    const { popup, onOpenChange, after } = await openControlledPopover();
    onOpenChange.mockClear();
    const checkTab = recordTabDuringExit(popup, { reduce: false });
    await userEvent.keyboard("{Escape}{Tab}");
    await exited(popup);
    checkTab();
    expect(document.activeElement).toBe(after);
    expect(onOpenChange.mock.calls).toEqual([[false, "escape-key"]]);
  });

  it("reports no close when the parent closes a controlled popover by its prop and a Tab leaves the trigger during the exit", async () => {
    const { popup, onOpenChange, after } = await openControlledPopover();
    onOpenChange.mockClear();
    const checkTab = recordTabDuringExit(popup, { reduce: false });
    await userEvent.keyboard("{F2}{Tab}");
    await exited(popup);
    checkTab();
    expect(document.activeElement).toBe(after);
    expect(onOpenChange.mock.calls).toEqual([]);
  });

  it("reports a close that follows a reopen", async () => {
    const onOpenChange = vi.fn();
    const { popup, trigger } = await openPopover({ onOpenChange });
    await userEvent.keyboard("{Escape}");
    await exited(popup);
    await userEvent.click(trigger);
    const reopened = await vi.waitFor(() => {
      const found = document.querySelector<HTMLElement>("[data-testid=popup]");
      if (!found) throw new Error("not open");
      return found;
    });
    await settled(reopened);
    await userEvent.keyboard("{Escape}");
    await exited(reopened);
    expect(onOpenChange.mock.calls.map(([open]) => open)).toEqual([true, false, true, false]);
  });
});

// Text fields around the trigger, as WebKit's Tab and click skip buttons
function popoverFixture({
  finalFocusBefore = false,
  openOnHover = false,
  onOpenChange,
}: {
  finalFocusBefore?: boolean;
  openOnHover?: boolean;
  onOpenChange?: (open: boolean, reason: string) => void;
} = {}) {
  const beforeRef = createRef<HTMLInputElement>();
  return (
    <div className="flex w-60 flex-col items-start gap-2" style={{ padding: 40 }}>
      <input ref={beforeRef} aria-label="Before" />
      <div data-testid="blank" className="h-6 w-full" />
      <Popover.Root onOpenChange={(open, details) => onOpenChange?.(open, details.reason)}>
        <Popover.Trigger openOnHover={openOnHover} delay={0} closeDelay={0}>
          Settings
        </Popover.Trigger>
        <Popover.Content data-testid="popup" finalFocus={finalFocusBefore ? beforeRef : undefined}>
          <input aria-label="Name" />
          <Popover.Close>Done</Popover.Close>
        </Popover.Content>
      </Popover.Root>
      <input aria-label="After" />
    </div>
  );
}

/** A controlled popover whose content is `content`, opened by click with its first control focused and the popup at rest */
async function openControlled(
  content: (setOpen: (open: boolean) => void) => ReactNode,
  { nativeTrigger = true } = {},
) {
  function Controlled() {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ padding: 40 }}>
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger {...(!nativeTrigger && { nativeButton: false, render: <span /> })}>
            Settings
          </Popover.Trigger>
          <Popover.Content data-testid="popup">{content(setOpen)}</Popover.Content>
        </Popover.Root>
      </div>
    );
  }
  const view = render(<Controlled />);
  const trigger = view.getByRole("button", { name: "Settings" });
  await userEvent.click(trigger);
  const popup = await view.findByTestId("popup");
  await expect.poll(() => popup.contains(document.activeElement)).toBe(true);
  await settled(popup);
  return { trigger, popup };
}

/** Renders the fixture and opens it by click: the first field inside takes focus */
async function openPopover(props?: Parameters<typeof popoverFixture>[0]) {
  const view = render(popoverFixture(props));
  const trigger = view.getByRole("button", { name: "Settings" });
  await userEvent.click(trigger);
  const name = await view.findByRole("textbox", { name: "Name" });
  await expect.poll(() => document.activeElement).toBe(name);
  // Open at rest: closed during its entry, the CSS path's popup can leave at once
  const popup = view.getByTestId("popup");
  await settled(popup);
  return {
    trigger,
    popup,
    before: view.getByRole("textbox", { name: "Before" }),
    after: view.getByRole("textbox", { name: "After" }),
  };
}

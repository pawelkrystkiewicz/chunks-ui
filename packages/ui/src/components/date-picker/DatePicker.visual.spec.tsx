import { Form } from "@base-ui/react/form";
import { render } from "@testing-library/react";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import {
  emulateReducedMotion,
  exited,
  expectNotAllowed,
  recordTabDuringExit,
  renderFixture,
  settled,
} from "../../VisualTest.utils";
import { Field } from "../field";
import { DatePicker } from "./index";

describe("DatePicker", () => {
  it("with value", async () => {
    const { fixture } = await renderFixture(
      <div style={{ width: 220 }}>
        <DatePicker value={new Date(2026, 2, 15)} />
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("empty", async () => {
    const { fixture } = await renderFixture(
      <div style={{ width: 220 }}>
        <DatePicker />
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  // A colour in triggerClassName must not reach the placeholder: it has its own data-placeholder
  // class, which only a `data-placeholder:` class of the consumer replaces
  it("colours the picked date and the placeholder apart through triggerClassName", async () => {
    const colour = (el: Element) => getComputedStyle(el).color;
    const { getByRole, rerender } = render(<DatePicker />);
    const muted = colour(getByRole("button", { name: "Pick a date" }));
    rerender(<DatePicker triggerClassName="text-red-600" />);
    expect(colour(getByRole("button", { name: "Pick a date" }))).toBe(muted);
    rerender(<DatePicker triggerClassName="text-red-600" value={new Date(2026, 2, 15)} />);
    const picked = colour(getByRole("button", { name: "March 15, 2026" }));
    expect(picked).not.toBe(muted);
    rerender(<DatePicker triggerClassName="text-red-600 data-placeholder:text-blue-600" />);
    expect(colour(getByRole("button", { name: "Pick a date" }))).not.toBe(muted);
  });

  it("shows a not-allowed cursor on a disabled trigger", () => {
    const { getByRole } = render(<DatePicker disabled />);
    expectNotAllowed(getByRole("button", { name: "Pick a date" }));
  });

  // Base UI publishes `--transform-origin` on the Positioner once it has placed the popup: the
  // point on the trigger's side, so the popup grows out of its trigger
  it("scales the popup from its Positioner's --transform-origin", async () => {
    render(<DatePicker />);
    await page.getByRole("button", { name: "Pick a date" }).click();
    await expect.element(page.getByRole("dialog")).toBeInTheDocument();
    const popup = page.getByRole("dialog").element() as HTMLElement;
    const positioner = popup.parentElement as HTMLElement;
    const origin = () => positioner.style.getPropertyValue("--transform-origin");
    await expect.poll(origin).not.toBe("");

    const computed = getComputedStyle(popup).transformOrigin;
    // The Positioner's value set on the popup, so its percentages resolve against the same box
    popup.style.transformOrigin = origin();
    const fromPositioner = getComputedStyle(popup).transformOrigin;
    popup.style.removeProperty("transform-origin");
    expect(computed).toBe(fromPositioner);
  });
});

// Lives in the browser suite, not jsdom: only a real browser runs the popup's exit transition,
// which keeps it mounted, with focus on the day, for ~300ms after Escape. A check made at a fixed
// delay races that transition, so every wait below polls. No screenshots are taken.
describe("DatePicker keyboard", () => {
  it("opens on the selected day, and Escape closes and refocuses the trigger every time", async () => {
    render(<DatePicker defaultValue={new Date(2026, 2, 15)} />);
    const trigger = page.getByRole("button", { name: "March 15, 2026", exact: true });
    for (let cycle = 0; cycle < 4; cycle++) {
      if (cycle % 2 === 0) await trigger.click();
      else await userEvent.keyboard("{Enter}");
      await expect
        .element(page.getByRole("button", { name: "Sunday, March 15, 2026" }))
        .toHaveFocus();
      await userEvent.keyboard("{ArrowDown}");
      await expect
        .element(page.getByRole("button", { name: "Sunday, March 22, 2026" }))
        .toHaveFocus();
      // Let the open transition finish so Escape takes the full exit-transition path.
      await expect.poll(() => document.getAnimations().length).toBe(0);
      await userEvent.keyboard("{Escape}");
      // The close itself is synchronous; only the unmount waits for the exit transition.
      expect(trigger.element()).toHaveAttribute("aria-expanded", "false");
      await expect.element(trigger).toHaveFocus();
      await expect.element(page.getByRole("grid")).not.toBeInTheDocument();
    }
  });
});

// Only a real browser validates a form on submit and tracks :focus-visible. No screenshots.
describe("DatePicker in a form", () => {
  it("shows the trigger's focus ring when a mouse submit finds it required and empty", async () => {
    render(
      <form aria-label="Task" onSubmit={(event) => event.preventDefault()}>
        <DatePicker aria-label="Due date" name="due" required />
        <button type="submit">Save</button>
      </form>,
    );
    await page.getByRole("button", { name: "Save" }).click();
    const trigger = page.getByRole("button", { name: "Due date Pick a date" });
    await expect.element(trigger).toHaveFocus();
    expect(trigger.element().matches(":focus-visible")).toBe(true);
  });

  // Base UI's Form focuses the invalid field's input, then calls select() on it
  it("keeps focus on the trigger when a Base UI Form finds it required and empty", async () => {
    render(
      <Form aria-label="Task">
        <Field.Root>
          <Field.Label>Due date</Field.Label>
          <DatePicker name="due" required />
          <Field.Error match="valueMissing">Pick a due date</Field.Error>
        </Field.Root>
        <button type="submit">Save</button>
      </Form>,
    );
    await page.getByRole("button", { name: "Save" }).click();
    const trigger = page.getByRole("button", { name: "Due date Pick a date" });
    await expect.element(trigger).toHaveFocus();
    expect(trigger.element().matches(":focus-visible")).toBe(true);
  });
});

// Base UI returns focus to the trigger only at the unmount, after the 0.3s exit (a frame with
// reduced motion): a Tab during it went to a focus guard in the closing popup, then <body> (#633)
describe.each([
  { path: "CSS", reduce: false },
  { path: "reduced motion", reduce: true },
])("DatePicker focus as the popup closes, $path", ({ reduce }) => {
  beforeEach(() => emulateReducedMotion(reduce));
  afterAll(() => emulateReducedMotion(true));

  // Text fields around the trigger, as WebKit's Tab and click skip buttons
  const open = async (onValueChange?: (date: Date | null) => void) => {
    const view = render(
      <div className="flex w-72 flex-col items-start gap-2" style={{ padding: 40 }}>
        <input aria-label="Before" />
        <DatePicker defaultValue={new Date(2026, 2, 15)} onValueChange={onValueChange} />
        <input aria-label="After" />
      </div>,
    );
    const trigger = view.getByRole("button", { name: "March 15, 2026" });
    await userEvent.click(trigger);
    const day = await view.findByRole("button", { name: "Sunday, March 15, 2026" });
    await expect.poll(() => document.activeElement).toBe(day);
    // Open at rest: closed during its entry, the popup can leave at once
    const popup = view.getByRole("dialog");
    await settled(popup);
    return {
      trigger,
      popup,
      before: view.getByRole("textbox", { name: "Before" }),
      after: view.getByRole("textbox", { name: "After" }),
    };
  };

  // Enter and Tab go in one call: with reduced motion the popup leaves a frame after the pick
  it("moves a Tab pressed during the exit past the trigger, after a pick by Enter", async () => {
    const { popup, after } = await open();
    await userEvent.keyboard("{ArrowDown}");
    const checkTab = recordTabDuringExit(popup, { reduce });
    await userEvent.keyboard("{Enter}{Tab}");
    checkTab();
    expect(document.activeElement).toBe(after);
    await exited(popup);
    expect(document.activeElement).toBe(after);
  });

  // The picking Enter repeats its keydown and keypress once, inside the exit. Without the
  // hand-off's wait the repeat would land on the trigger, which has focus by then, and open the
  // calendar again. The CSS path only (#652): with reduced motion the popup unmounts a frame after
  // the pick and Base UI focuses the trigger, so this repeat lands on either side by load.
  it.skipIf(reduce)(
    "keeps the calendar closed and the trigger focused, and picks once, when the picking Enter repeats once during the exit",
    async () => {
      const onValueChange = vi.fn();
      const { popup, trigger } = await open(onValueChange);
      await userEvent.keyboard("{ArrowDown}{Enter>2}{/Enter}");
      // Once: Chromium used to pick the day again on the repeat's keypress
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith(new Date(2026, 2, 22));
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(document.activeElement).toBe(trigger);
      expect(trigger.matches(":focus-visible"), "the trigger shows its ring").toBe(true);
      await exited(popup);
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(document.activeElement).toBe(trigger);
    },
  );

  // A click and a key press are two calls, too far apart for the one frame of reduced motion
  it.skipIf(reduce)(
    "moves a Tab pressed during the exit past the trigger, after a pick by click",
    async () => {
      const { popup, after } = await open();
      const checkTab = recordTabDuringExit(popup, { reduce });
      await userEvent.click(page.getByRole("button", { name: "Friday, March 20, 2026" }));
      await userEvent.keyboard("{Tab}");
      checkTab();
      expect(document.activeElement).toBe(after);
      await exited(popup);
      expect(document.activeElement).toBe(after);
    },
  );

  // The CSS path only: reduced motion's one-frame exit adds nothing here
  it.skipIf(reduce)("moves focus to the trigger on Escape", async () => {
    const { popup, trigger } = await open();
    await userEvent.keyboard("{Escape}");
    expect(document.activeElement).toBe(trigger);
    await exited(popup);
    expect(document.activeElement).toBe(trigger);
  });
});

import { render } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { commands, page } from "vitest/browser";
import {
  enterMotionPath,
  expectNotAllowed,
  focusVisible,
  renderFixture,
  renderPage,
} from "../../VisualTest.utils";
import { Select } from "./index";

const fruits = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "date", label: "Date" },
];

const closedSelect = (open?: boolean) => (
  <div style={{ width: 200 }}>
    <Select.Root defaultValue="apple" open={open}>
      <Select.Trigger aria-label="Fruit">
        <Select.Value />
        <Select.Icon />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner>
          <Select.Popup data-testid="popup">
            {fruits.map((f) => (
              <Select.Item key={f.value} value={f.value}>
                <Select.ItemIndicator />
                <Select.ItemText>{f.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  </div>
);

/** The properties `el` is transitioning, sorted */
const transitioning = (el: Element) =>
  el
    .getAnimations()
    .map((animation) => (animation as CSSTransition).transitionProperty)
    .sort();

describe("Select", () => {
  it("closed", async () => {
    const { fixture } = await renderFixture(closedSelect());
    await expect(fixture).toMatchScreenshot();
  });

  // Keyboard focus shows the ring: 2px of --ring, 2px outside the trigger. A focused trigger
  // makes Base UI mount the popup in a portal, hidden and 0 × 0, a moment later: wait for it, so
  // the page is settled, and screenshot by test id, as the fixture's CSS path is ambiguous then.
  it("trigger focus-visible", async () => {
    const { getByRole } = await renderFixture(closedSelect());
    const trigger = getByRole("combobox");
    focusVisible(trigger);
    await expect.poll(() => document.querySelectorAll("[data-base-ui-portal]").length).toBe(1);
    await expect(page.getByTestId("fixture")).toMatchScreenshot();
  });

  it("open", async () => {
    const body = await renderPage(
      <div style={{ padding: 40 }}>
        <Select.Root defaultValue="banana" defaultOpen>
          <Select.Trigger>
            <Select.Value />
            <Select.Icon />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                {fruits.map((f) => (
                  <Select.Item key={f.value} value={f.value}>
                    <Select.ItemIndicator />
                    <Select.ItemText>{f.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </div>,
    );
    await expect(body).toMatchScreenshot();
  });

  it("shows a not-allowed cursor on a disabled trigger", () => {
    const { getByRole } = render(
      <Select.Root defaultValue="apple" disabled>
        <Select.Trigger aria-label="Fruit">
          <Select.Value />
          <Select.Icon />
        </Select.Trigger>
      </Select.Root>,
    );
    expectNotAllowed(getByRole("combobox"));
  });
});

// Motion never arrives and reduced motion is off: the CSS transition. It scales and fades, as
// the spring does (W190)
describe("Select.Popup on the CSS path", () => {
  beforeAll(() => enterMotionPath(false));
  beforeEach(async () => {
    await commands.emulateMedia({ reducedMotion: "no-preference" });
    await expect.poll(() => matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(false);
  });
  afterAll(async () => {
    await commands.emulateMedia({ reducedMotion: "reduce" });
    await enterMotionPath(true);
  });

  // The start is read in the task that opens it: Base UI clears `data-starting-style` on the
  // next frame. The list is read after that: Base UI holds the transition off (an inline
  // `transition: none`) until it has positioned the popup.
  it("enters from scale-95 and opacity-0, and transitions opacity and scale", async () => {
    const { rerender, getByTestId } = render(closedSelect(false));
    rerender(closedSelect(true));
    const popup = getByTestId("popup");
    expect(popup).toHaveAttribute("data-starting-style");
    const { scale, opacity } = getComputedStyle(popup);
    expect({ scale, opacity }).toEqual({ scale: "0.95", opacity: "0" });

    await expect.poll(() => popup.hasAttribute("data-starting-style")).toBe(false);
    const { transitionProperty, transitionDuration } = getComputedStyle(popup);
    expect({ transitionProperty, transitionDuration }).toEqual({
      transitionProperty: "opacity, scale",
      transitionDuration: "0.3s",
    });
    expect(transitioning(popup)).toEqual(["opacity", "scale"]);
  });

  it("leaves to scale-95 and opacity-0", async () => {
    const { rerender, getByTestId } = render(closedSelect(false));
    rerender(closedSelect(true));
    const popup = getByTestId("popup");
    await expect.poll(() => popup.hasAttribute("data-starting-style")).toBe(false);
    await expect.poll(() => transitioning(popup)).toEqual([]);
    rerender(closedSelect(false));
    expect(popup).toHaveAttribute("data-ending-style");
    expect(transitioning(popup)).toEqual(["opacity", "scale"]);
  });
});

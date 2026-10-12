import { DirectionProvider } from "@base-ui/react/direction-provider";
import { render, screen, within } from "@testing-library/react";
import { type ReactNode, useEffect, useRef } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { Combobox } from "./components/combobox";
import { Input } from "./components/input";
import { Menu } from "./components/menu";
import { NumberField } from "./components/number-field";
import { Select } from "./components/select";
import { Switch } from "./components/switch";
import { Toast } from "./components/toast";
import { reloadMotion } from "./lib/use-motion";
import {
  contentSpan,
  type Dir,
  eachPaintedFrame,
  inlineSpan,
  insetsWithin,
  px,
  waitForStable,
} from "./VisualTest.utils";

/*
 * Parts that sit at the start or the end of a line must swap sides right to left. Most cases run
 * in both directions, and state their expectations along the inline axis, so the same assertion
 * holds in LTR and mirrors in RTL.
 */

const DIRS: Dir[] = ["ltr", "rtl"];

/** Renders `ui` the way an app sets a direction: `dir` on <html>, which portalled popups inherit */
function renderIn(dir: Dir, ui: ReactNode) {
  document.documentElement.dir = dir;
  // Base UI needs the direction too, for keyboard navigation and logical alignment
  return render(
    <DirectionProvider direction={dir}>
      <div style={{ padding: 40 }}>{ui}</div>
    </DirectionProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
});

/** Distances from `outer`'s inline-start and inline-end edges to the same edges of `inner` */
function inlineInsets(outer: Element, inner: Element, dir: Dir) {
  const { left, right } = insetsWithin(outer, inner);
  return dir === "ltr" ? { start: left, end: right } : { start: right, end: left };
}

/** Whole-pixel tolerance for edges that should line up: Chromium lays out in 1/64px units */
const near = (value: number) => expect.closeTo(value, 1);

describe("Switch in both directions", () => {
  const PATHS = [
    { path: "Motion spring", reducedMotion: false },
    // The same render ships when Motion is not installed
    { path: "CSS fallback", reducedMotion: true },
  ] as const;

  type State = "unchecked" | "checked";

  /** Renders a switch in `dir`, in a section of that direction when the page's differs */
  function renderSwitch(dir: Dir, defaultChecked: boolean, page: Dir = dir) {
    const ui = (
      <Switch.Root aria-label="Wi-Fi" defaultChecked={defaultChecked}>
        <Switch.Thumb data-testid="thumb" />
      </Switch.Root>
    );
    const { getByRole, getByTestId } = renderIn(
      page,
      page === dir ? ui : <div dir={dir}>{ui}</div>,
    );
    const track = getByRole("switch");
    const thumb = () => getByTestId("thumb");
    const isCssThumb = () => thumb().classList.contains("micro-interactions");
    // Off, the thumb rests one padding away from the inline start; on, from the inline end
    const expectRestsAt = async (state: State, currentDir: Dir = dir) => {
      expect(track.getAttribute("aria-checked")).toBe(String(state === "checked"));
      const gap = px(getComputedStyle(track).paddingInlineStart);
      const insets = await waitForStable(() => inlineInsets(track, thumb(), currentDir));
      expect(insets).toEqual({
        start: state === "unchecked" ? near(gap) : expect.any(Number),
        end: state === "checked" ? near(gap) : expect.any(Number),
      });
    };
    return { track, thumb, isCssThumb, expectRestsAt };
  }

  describe.each(PATHS)("$path", ({ reducedMotion }) => {
    beforeAll(() =>
      commands.emulateMedia({ reducedMotion: reducedMotion ? "reduce" : "no-preference" }),
    );
    afterAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));

    const LAYOUTS = [
      { layout: "ltr", dir: "ltr", page: "ltr" },
      { layout: "rtl", dir: "rtl", page: "rtl" },
      // An `rtl:` variant would also match here, inside the RTL page
      { layout: "ltr section on an rtl page", dir: "ltr", page: "rtl" },
    ] as const;

    it.each(
      LAYOUTS.flatMap((layout) => [
        { ...layout, start: "unchecked" as const },
        { ...layout, start: "checked" as const },
      ]),
    )(
      "rests off at the inline start and on at the inline end, $layout, starting $start",
      async ({ dir, page, start }) => {
        const { track, isCssThumb, expectRestsAt } = renderSwitch(dir, start === "checked", page);
        await expect.poll(isCssThumb, { timeout: 5000 }).toBe(reducedMotion);
        const other: State = start === "checked" ? "unchecked" : "checked";

        await expectRestsAt(start);
        await userEvent.click(track);
        await expectRestsAt(other);
        await userEvent.click(track);
        await expectRestsAt(start);
      },
    );

    it("moves toward the new inline end after the direction changes", async () => {
      const { track, isCssThumb, expectRestsAt } = renderSwitch("ltr", false);
      await expect.poll(isCssThumb, { timeout: 5000 }).toBe(reducedMotion);
      await expectRestsAt("unchecked");

      document.documentElement.dir = "rtl";
      await userEvent.click(track);
      await expectRestsAt("checked", "rtl");
    });
  });

  describe("Motion spring, from the first frame", () => {
    beforeAll(() => commands.emulateMedia({ reducedMotion: "no-preference" }));
    afterAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));

    // Mounted after Motion loaded, Motion drives the thumb from its first render. It must jump
    // to its place there, not spring there from the LTR side.
    it.each(DIRS)("shows a checked thumb at the inline end on every frame, %s", async (dir) => {
      await reloadMotion();
      const { thumb, track, isCssThumb } = renderSwitch(dir, true);
      expect(isCssThumb()).toBe(false);
      const gap = px(getComputedStyle(track).paddingInlineStart);
      const frames = await eachPaintedFrame(() => inlineInsets(track, thumb(), dir).end, 5);
      expect(frames).toEqual(frames.map(() => near(gap)));
    });

    // A switch on the page before Motion loads renders the CSS fallback, then Motion takes over
    // where the thumb rests
    it("keeps a checked thumb at the inline end when Motion arrives after mount, rtl", async () => {
      let arrive: (value?: unknown) => void = () => {};
      const loaded = reloadMotion(
        new Promise((resolve) => {
          arrive = resolve;
        }),
      );
      const { track, isCssThumb, expectRestsAt } = renderSwitch("rtl", true);
      expect(isCssThumb()).toBe(true);
      await expectRestsAt("checked");

      arrive();
      await loaded;
      await expect.poll(isCssThumb, { timeout: 5000 }).toBe(false);
      await expectRestsAt("checked");
      await userEvent.click(track);
      await expectRestsAt("unchecked");
      await userEvent.click(track);
      await expectRestsAt("checked");
    });
  });
});

describe.each(DIRS)("in %s", (dir) => {
  it("puts Input's start adornment before the text and the end adornment after it", () => {
    renderIn(
      dir,
      <Input
        aria-label="Amount"
        startAdornment={<span data-testid="start" className="size-4" />}
        endAdornment={<span data-testid="end" className="size-4" />}
      />,
    );
    const input = screen.getByRole("textbox", { name: "Amount" });
    const field = inlineSpan(input, dir);
    const text = contentSpan(input, dir);
    const start = inlineSpan(screen.getByTestId("start"), dir);
    const end = inlineSpan(screen.getByTestId("end"), dir);

    // Each adornment sits in the padding on its own side, so typed text never runs under it
    expect(start.start).toBeGreaterThan(field.start);
    expect(start.end).toBeLessThanOrEqual(text.start);
    expect(text.end).toBeLessThanOrEqual(end.start);
    expect(end.end).toBeLessThan(field.end);
  });

  it("puts Input's clear button after the text", async () => {
    renderIn(dir, <Input aria-label="Search" defaultValue="query" onClear={() => {}} />);
    const input = screen.getByRole("textbox", { name: "Search" });
    const clear = inlineSpan(await screen.findByRole("button"), dir);
    expect(contentSpan(input, dir).end).toBeLessThanOrEqual(clear.start);
    expect(clear.end).toBeLessThan(inlineSpan(input, dir).end);
  });

  it("draws NumberField's separators between the input and each button", () => {
    renderIn(
      dir,
      <NumberField.Root defaultValue={1}>
        <NumberField.Group>
          <NumberField.Decrement />
          <NumberField.Input aria-label="Quantity" />
          <NumberField.Increment />
        </NumberField.Group>
      </NumberField.Root>,
    );
    const input = screen.getByRole("textbox", { name: "Quantity" });
    const borders = (el: Element) => {
      const { borderLeftWidth, borderRightWidth } = getComputedStyle(el);
      return { left: borderLeftWidth, right: borderRightWidth };
    };
    // Only the button's edge that faces the input carries a border, the outer edge has none
    const facingInput = (button: Element) =>
      button.getBoundingClientRect().right <= input.getBoundingClientRect().left + 0.5
        ? { left: "0px", right: "1px" }
        : { left: "1px", right: "0px" };

    for (const name of ["Decrease", "Increase"]) {
      const button = screen.getByRole("button", { name });
      expect(borders(button)).toEqual(facingInput(button));
    }
  });

  it("puts Select's icon at the trigger's end and an item's check mark after its text", async () => {
    renderIn(
      dir,
      <Select.Root defaultValue="banana" defaultOpen>
        <Select.Trigger data-testid="trigger">
          <Select.Value data-testid="value" />
          <Select.Icon data-testid="icon" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              {["Apple", "Banana"].map((label) => (
                <Select.Item key={label} value={label.toLowerCase()}>
                  <Select.ItemIndicator data-testid="indicator" />
                  <Select.ItemText>{label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );
    const trigger = screen.getByTestId("trigger");
    const icon = inlineSpan(screen.getByTestId("icon"), dir);
    expect(inlineSpan(screen.getByTestId("value"), dir).end).toBeLessThanOrEqual(icon.start);
    expect(icon.end).toEqual(near(contentSpan(trigger, dir).end));

    await expectCheckAfterText("Banana", dir);
  });

  it("puts Combobox's buttons at the input's end and an item's check mark after its text", async () => {
    renderIn(
      dir,
      <Combobox.Root defaultValue="vue" defaultOpen>
        <div className="relative" data-testid="control">
          <Combobox.Input aria-label="Framework" />
          <Combobox.Clear data-testid="clear" />
          <Combobox.Trigger data-testid="trigger" />
        </div>
        <div className="flex" data-testid="icon-row">
          <span>Pick</span>
          <Combobox.Icon data-testid="icon" />
        </div>
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                {["React", "Vue"].map((label) => (
                  <Combobox.Item key={label} value={label.toLowerCase()}>
                    <span>{label}</span>
                    <Combobox.ItemIndicator data-testid="indicator" />
                  </Combobox.Item>
                ))}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );
    const control = inlineSpan(screen.getByTestId("control"), dir);
    const clear = inlineSpan(screen.getByTestId("clear"), dir);
    const trigger = inlineSpan(screen.getByTestId("trigger"), dir);
    // The trigger closes the input's end, the clear button sits just before it
    expect(trigger.end).toEqual(near(control.end));
    expect(clear.end).toBeLessThanOrEqual(trigger.start);
    expect(clear.start).toBeGreaterThan((control.start + control.end) / 2);
    // A standalone icon in a row goes to the row's end
    expect(inlineSpan(screen.getByTestId("icon"), dir).end).toEqual(
      near(inlineSpan(screen.getByTestId("icon-row"), dir).end),
    );

    await expectCheckAfterText("Vue", dir);
  });

  it("puts Menu's checkbox and radio indicators before their item's text", async () => {
    renderIn(
      dir,
      <Menu.Root defaultOpen>
        <Menu.Trigger>View</Menu.Trigger>
        <Menu.Content>
          <Menu.CheckboxItem defaultChecked>
            <Menu.CheckboxItemIndicator data-testid="indicator">✓</Menu.CheckboxItemIndicator>
            <span>Show grid</span>
          </Menu.CheckboxItem>
          <Menu.RadioGroup defaultValue="dark">
            <Menu.RadioItem value="dark">
              <Menu.RadioItemIndicator data-testid="indicator">•</Menu.RadioItemIndicator>
              <span>Dark</span>
            </Menu.RadioItem>
          </Menu.RadioGroup>
        </Menu.Content>
      </Menu.Root>,
    );
    const items = [
      await screen.findByRole("menuitemcheckbox", { name: /Show grid/ }),
      await screen.findByRole("menuitemradio", { name: /Dark/ }),
    ];
    await waitForStable(() => items.map((item) => item.getBoundingClientRect().toJSON()));
    for (const item of items) {
      const box = inlineSpan(item, dir);
      const indicator = inlineSpan(within(item).getByTestId("indicator"), dir);
      const text = inlineSpan(item.querySelector("span:last-child") as Element, dir);
      // The indicator sits in the item's start padding, ahead of the text
      expect(indicator.start).toBeGreaterThan(box.start);
      expect(indicator.end).toBeLessThanOrEqual(text.start);
      expect(contentSpan(item, dir).start).toBeGreaterThanOrEqual(indicator.end);
    }
  });

  it("puts Toast's close button at the end of the toast, after its content", async () => {
    function AddToast() {
      const manager = Toast.useToast();
      const added = useRef(false);
      useEffect(() => {
        if (added.current) return;
        added.current = true;
        manager.add({
          title: "File saved",
          description: "Your changes were saved.",
          dismissible: true,
        });
      }, [manager]);
      return null;
    }
    renderIn(
      dir,
      <Toast.Provider>
        <AddToast />
        <Toast.Viewport />
      </Toast.Provider>,
    );
    const title = await screen.findByText("File saved");
    const toast = title.closest(".Toast") as HTMLElement;
    await waitForStable(() => toast.getBoundingClientRect().toJSON());
    // Base UI marks the close button aria-hidden here, so find it by its label
    const close = inlineSpan(within(toast).getByLabelText("Close"), dir);
    const content = inlineSpan(toast.querySelector(".ToastContent") as Element, dir);
    // The content stops short of the close button, which sits in the toast's end padding
    expect(content.end).toBeLessThanOrEqual(close.start);
    expect(close.end).toBeLessThan(inlineSpan(toast, dir).end);
    expect(close.start).toBeGreaterThanOrEqual(contentSpan(toast, dir).end);
  });
});

/**
 * The open option `name` shows its check mark in its end padding, after the text: the Select and
 * Combobox layout
 */
async function expectCheckAfterText(name: string, dir: Dir) {
  const item = await screen.findByRole("option", { name });
  await waitForStable(() => item.getBoundingClientRect().toJSON());
  const check = inlineSpan(within(item).getByTestId("indicator"), dir);
  expect(inlineSpan(within(item).getByText(name), dir).end).toBeLessThanOrEqual(check.start);
  expect(check.start).toBeGreaterThanOrEqual(contentSpan(item, dir).end);
  expect(check.end).toBeLessThan(inlineSpan(item, dir).end);
}

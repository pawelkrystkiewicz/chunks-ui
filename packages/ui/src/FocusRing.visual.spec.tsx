import { render, screen } from "@testing-library/react";
import { type ReactNode, useEffect, useRef } from "react";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { Accordion } from "./components/accordion";
import { Breadcrumb } from "./components/breadcrumb";
import { Button } from "./components/button";
import { Calendar, DEFAULT_CALENDAR_LABELS } from "./components/calendar";
import { Checkbox } from "./components/checkbox";
import { ClearButton } from "./components/clear-button";
import { Collapsible } from "./components/collapsible";
import { Combobox } from "./components/combobox";
import { DatePicker, DEFAULT_DATE_PICKER_LABELS } from "./components/date-picker";
import { Dialog } from "./components/dialog";
import { Drawer } from "./components/drawer";
import { Input } from "./components/input";
import { Menu } from "./components/menu";
import { NumberField } from "./components/number-field";
import { Pagination } from "./components/pagination";
import { Popover } from "./components/popover";
import { Radio } from "./components/radio";
import { Select } from "./components/select";
import { Slider } from "./components/slider";
import { Switch } from "./components/switch";
import { Tabs } from "./components/tabs";
import { Textarea } from "./components/textarea";
import { ThemeToggle } from "./components/theme-toggle";
import { DEFAULT_TOAST_LABELS, Toast } from "./components/toast";
import { ToggleGroup } from "./components/toggle-group";
import { Tooltip } from "./components/tooltip";
import { enterMotionPath, outlineTransitions, ringColor } from "./VisualTest.utils";

/*
 * With motion on, a keyboard focus ring shows in the ring colour, width and offset in the same
 * task the part takes focus. `.micro-interactions` used to transition `all`, and Tailwind's
 * `transition-colors` lists `outline-color`, so rings faded in from the text colour
 * (#362). Button and IconButton have the same check in their own specs, and the Drawer popup too,
 * for each of its paths.
 *
 * NumberField's increment and decrement and Combobox's clear and chip remove buttons are out of
 * the tab order (Base UI), so they never show a keyboard ring. Of the popups, Popover, Menu,
 * Dialog, Drawer and DatePicker take focus themselves; Tooltip, Select and Combobox popups do not
 * (Base UI).
 */

beforeEach(async () => {
  await commands.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(() => matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(false);
});
afterAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));

/** Each property `el` transitions, with its duration (the durations repeat over the list) */
function durationsOf(el: Element) {
  const style = getComputedStyle(el);
  const durations = style.transitionDuration.split(", ");
  return Object.fromEntries(
    style.transitionProperty
      .split(", ")
      .map((property, i) => [property, durations[i % durations.length]]),
  );
}

function AddToast({ action }: { action?: string }) {
  const manager = Toast.useToast();
  const added = useRef(false);
  useEffect(() => {
    if (added.current) return;
    added.current = true;
    manager.add({
      title: "Saved",
      dismissible: true,
      timeout: 0,
      actionProps: { children: "Undo", className: action },
    });
  }, [manager, action]);
  return null;
}

const toast = (action?: string) => (
  <Toast.Provider>
    <AddToast action={action} />
    <Toast.Viewport />
  </Toast.Provider>
);

const tabs = ({ tab, panel }: { tab?: string; panel?: string }) => (
  <Tabs.Root defaultValue="a">
    <Tabs.List>
      <Tabs.Tab value="a">First</Tabs.Tab>
      <Tabs.Tab value="b" className={tab}>
        Target
      </Tabs.Tab>
    </Tabs.List>
    <Tabs.Panel value="a" className={panel}>
      Panel
    </Tabs.Panel>
  </Tabs.Root>
);

// A fixed month, so the grid is the same whatever the date
const calendar = () => <Calendar defaultValue={new Date(2026, 2, 15)} />;

// Nothing tabbable inside, so Base UI focuses the popup
const drawerPopup = (className?: string) => (
  <Drawer.Root defaultOpen>
    <Drawer.Portal>
      <Drawer.Popup data-testid="target" className={className}>
        <Drawer.Title>Title</Drawer.Title>
      </Drawer.Popup>
    </Drawer.Portal>
  </Drawer.Root>
);

type RingCase = {
  part: string;
  /** Renders the part, with `className` on it */
  ui: (className?: string) => ReactNode;
  /** The element that takes keyboard focus */
  target: () => Promise<HTMLElement>;
  /** The element that draws the ring, when that is not the target */
  ring?: () => Element;
  /** The pseudo-element of the ring element that draws the ring */
  pseudo?: "::after";
  /** The part takes no `className` of its own: a utility goes on its element */
  internal?: true;
  /**
   * The part is in a popup open from the start, which makes the button before it inert or (a
   * menu) closes on a tab, so the keyboard modality comes from a key press that moves no focus
   */
  inPopup?: true;
  /** Opens the popup the part is in from the keyboard, with the focus on the "Before" button */
  open?: () => Promise<void>;
};

const byTestId = (id: string) => () => screen.getByTestId(id);

const INPUT: RingCase = {
  part: "Input",
  ui: (className) => <Input aria-label="Target" className={className} />,
  target: () => screen.findByRole("textbox", { name: "Target" }),
};

const RING_CASES: RingCase[] = [
  {
    part: "Tabs.Tab",
    ui: (tab) => tabs({ tab }),
    target: () => screen.findByRole("tab", { name: "Target" }),
  },
  {
    part: "Tabs.Panel",
    ui: (panel) => tabs({ panel }),
    target: () => screen.findByRole("tabpanel"),
  },
  {
    part: "ToggleGroup.Item",
    ui: (className) => (
      <ToggleGroup.Root>
        <ToggleGroup.Item value="a" className={className}>
          Target
        </ToggleGroup.Item>
      </ToggleGroup.Root>
    ),
    target: () => screen.findByRole("button", { name: "Target" }),
  },
  {
    part: "Checkbox.Root",
    ui: (className) => <Checkbox.Root aria-label="Target" className={className} />,
    target: () => screen.findByRole("checkbox", { name: "Target" }),
  },
  {
    part: "Radio.Root",
    ui: (className) => (
      <Radio.Group>
        <Radio.Root value="a" aria-label="Target" className={className} />
      </Radio.Group>
    ),
    target: () => screen.findByRole("radio", { name: "Target" }),
  },
  {
    part: "Switch.Root",
    ui: (className) => (
      <Switch.Root aria-label="Target" className={className}>
        <Switch.Thumb />
      </Switch.Root>
    ),
    target: () => screen.findByRole("switch", { name: "Target" }),
  },
  {
    part: "ThemeToggle",
    ui: (className) => <ThemeToggle theme="light" aria-label="Target" className={className} />,
    target: () => screen.findByRole("button", { name: "Target" }),
  },
  {
    part: "Tabs.Content",
    ui: (className) => (
      <Tabs.Root defaultValue="a">
        <Tabs.List>
          <Tabs.Tab value="a">First</Tabs.Tab>
        </Tabs.List>
        <Tabs.Contents>
          <Tabs.Content value="a" className={className}>
            Panel
          </Tabs.Content>
        </Tabs.Contents>
      </Tabs.Root>
    ),
    target: () => screen.findByRole("tabpanel"),
  },
  {
    part: "Dialog body",
    ui: (className) => (
      <Dialog.Root defaultOpen>
        <Dialog.Portal>
          <Dialog.Popup>
            <Dialog.Title>Terms</Dialog.Title>
            <Dialog.Body className={className}>Text</Dialog.Body>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    ),
    target: () => screen.findByRole("region", { name: "Terms" }),
    inPopup: true,
  },
  {
    part: "Combobox.Control",
    // The wrapper draws the ring while the input inside has the focus
    ui: (className) => (
      <Combobox.Root items={["Apple"]}>
        <Combobox.Control data-testid="ring" className={className}>
          <Combobox.Input aria-label="Target" />
        </Combobox.Control>
      </Combobox.Root>
    ),
    target: () => screen.findByRole("combobox", { name: "Target" }),
    ring: byTestId("ring"),
  },
  {
    part: "Calendar previous month",
    ui: calendar,
    target: () => screen.findByRole("button", { name: DEFAULT_CALENDAR_LABELS.previousMonth }),
    internal: true,
  },
  {
    part: "Calendar next month",
    ui: calendar,
    target: () => screen.findByRole("button", { name: DEFAULT_CALENDAR_LABELS.nextMonth }),
    internal: true,
  },
  {
    part: "Calendar day",
    ui: calendar,
    target: () => screen.findByRole("button", { name: "Sunday, March 15, 2026" }),
    internal: true,
  },
  {
    part: "Toast.Action",
    ui: toast,
    target: () => screen.findByRole("button", { name: "Undo" }),
  },
  {
    part: "Toast.Close",
    ui: () => toast(),
    // Base UI hides the close button from assistive tech, so it has no accessible role
    target: () => screen.findByLabelText(DEFAULT_TOAST_LABELS.close),
    internal: true,
  },
  {
    part: "NumberField.Group",
    ui: (className) => (
      <NumberField.Root defaultValue={1}>
        <NumberField.Group data-testid="ring" className={className}>
          <NumberField.Decrement />
          <NumberField.Input aria-label="Target" />
          <NumberField.Increment />
        </NumberField.Group>
      </NumberField.Root>
    ),
    target: () => screen.findByRole("textbox", { name: "Target" }),
    ring: byTestId("ring"),
  },
  {
    part: "Combobox.Input",
    ui: (className) => (
      <Combobox.Root items={["Apple"]}>
        <Combobox.Input aria-label="Target" className={className} />
      </Combobox.Root>
    ),
    target: () => screen.findByRole("combobox", { name: "Target" }),
  },
  {
    part: "Textarea",
    ui: (className) => <Textarea aria-label="Target" className={className} />,
    target: () => screen.findByRole("textbox", { name: "Target" }),
  },
  INPUT,
  {
    part: "Select.Trigger",
    ui: (className) => (
      <Select.Root>
        <Select.Trigger aria-label="Target" className={className}>
          <Select.Value />
        </Select.Trigger>
      </Select.Root>
    ),
    target: () => screen.findByRole("combobox", { name: "Target" }),
  },
  {
    part: "Slider.Thumb",
    ui: (className) => (
      <Slider.Root defaultValue={[40]} aria-label="Target">
        <Slider.Control>
          <Slider.Track>
            <Slider.Thumb index={0} data-testid="ring" className={className} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    ),
    // Keyboard focus lands on the range input inside the thumb, which draws the ring
    target: () => screen.findByRole("slider"),
    ring: byTestId("ring"),
  },
  {
    part: "Accordion.Trigger",
    ui: (className) => (
      <Accordion.Root>
        <Accordion.Item value="a">
          <Accordion.Header>
            <Accordion.Trigger className={className}>Target</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Content</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    ),
    target: () => screen.findByRole("button", { name: "Target" }),
  },
  {
    part: "Collapsible.Trigger",
    ui: (className) => (
      <Collapsible.Root>
        <Collapsible.Trigger className={className}>Target</Collapsible.Trigger>
        <Collapsible.Panel>Content</Collapsible.Panel>
      </Collapsible.Root>
    ),
    target: () => screen.findByRole("button", { name: "Target" }),
  },
  {
    part: "DatePicker trigger",
    // `className` goes on the wrapper
    ui: () => <DatePicker />,
    target: () => screen.findByRole("button", { name: DEFAULT_DATE_PICKER_LABELS.placeholder }),
    internal: true,
  },
  {
    part: "Pagination.Link",
    ui: (className) => (
      <Pagination.Root>
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Link href="#" className={className}>
              Target
            </Pagination.Link>
          </Pagination.Item>
        </Pagination.Content>
      </Pagination.Root>
    ),
    target: () => screen.findByRole("link", { name: "Target" }),
  },
  {
    part: "ClearButton",
    ui: (className) => <ClearButton aria-label="Target" className={className} />,
    target: () => screen.findByRole("button", { name: "Target" }),
  },
  {
    part: "Popover.Content",
    ui: (className) => (
      <Popover.Root defaultOpen>
        <Popover.Trigger>Trigger</Popover.Trigger>
        <Popover.Content className={className}>Content</Popover.Content>
      </Popover.Root>
    ),
    target: () => screen.findByRole("dialog"),
    inPopup: true,
  },
  {
    // The overlay that draws the ring above the arrow
    part: "Popover.Content with an arrow",
    ui: (className) => (
      <Popover.Root defaultOpen>
        <Popover.Trigger>Trigger</Popover.Trigger>
        <Popover.Content className={className}>
          <Popover.Arrow />
          Content
        </Popover.Content>
      </Popover.Root>
    ),
    target: () => screen.findByRole("dialog"),
    pseudo: "::after",
    inPopup: true,
  },
  {
    part: "Menu.Content",
    ui: (className) => (
      <Menu.Root defaultOpen>
        <Menu.Trigger>Trigger</Menu.Trigger>
        <Menu.Content className={className}>
          <Menu.Item>Item</Menu.Item>
        </Menu.Content>
      </Menu.Root>
    ),
    target: () => screen.findByRole("menu"),
    inPopup: true,
  },
  {
    part: "Dialog.Popup",
    ui: (className) => (
      <Dialog.Root defaultOpen>
        <Dialog.Portal>
          <Dialog.Popup className={className}>
            <Dialog.Title>Title</Dialog.Title>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    ),
    target: () => screen.findByRole("dialog"),
    inPopup: true,
  },
  {
    part: "Drawer.Popup",
    ui: drawerPopup,
    target: () => screen.findByRole("dialog"),
    inPopup: true,
  },
  {
    // Takes focus when `initialFocus` finds no day; the spec moves the focus to it from the day
    part: "DatePicker popup",
    ui: () => <DatePicker />,
    target: () => screen.findByRole("dialog"),
    internal: true,
    open: async () => {
      await userEvent.tab();
      await userEvent.keyboard("{Enter}");
    },
  },
  {
    part: "Breadcrumb.Link",
    ui: (className) => (
      <Breadcrumb.Root>
        <Breadcrumb.List>
          <Breadcrumb.Item>
            <Breadcrumb.Link href="#" className={className}>
              Target
            </Breadcrumb.Link>
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>
    ),
    target: () => screen.findByRole("link", { name: "Target" }),
  },
];

/**
 * Renders `ui` after a button, tabs to the button (in a popup, presses Shift instead), opens the
 * popup if the case opens one, then moves focus to the target
 */
async function focusRing(
  { ui, target, ring, internal, inPopup, open }: RingCase,
  utility?: string,
) {
  render(
    <>
      <button type="button">Before</button>
      {ui(utility)}
    </>,
  );
  if (inPopup) await userEvent.keyboard("{Shift}");
  else {
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Before" }));
  }
  await open?.();
  const focused = await target();
  const drawn = ring?.() ?? focused;
  if (utility) {
    // Added after render, so this checks the CSS order of the utility, not the `cn` merge
    if (internal) drawn.classList.add(utility);
    expect(drawn).toHaveClass(utility);
  }
  // A popup focuses the target as it opens: the page computes its style without the focus
  // first, so the focus below starts any transition on the ring
  if (document.activeElement === focused) {
    focused.blur();
    getComputedStyle(focused).outlineStyle;
  }
  // Focus moves on from a keyboard-focused element, so the target matches :focus-visible.
  // Moved in the page, so the style below is read in the same task: a transition would
  // still be at its start.
  focused.focus();
  expect(focused.matches(":focus-visible")).toBe(true);
  return drawn;
}

function expectInstantRing(drawn: Element, pseudo?: string) {
  const { outlineStyle, outlineColor } = getComputedStyle(drawn, pseudo);
  expect({ outlineStyle, outlineColor }).toEqual({
    outlineStyle: "solid",
    outlineColor: ringColor(),
  });
  // Nor do its width or offset grow in. The `::after` overlay cannot transition: it exists only
  // while the ring shows (`has-[.PopupArrow]:focus-visible`), so it has no earlier style.
  if (!pseudo) expect(outlineTransitions(drawn)).toEqual([]);
}

// Timing a consumer may put in `className`: none of it fades or delays the ring
const UTILITIES = ["duration-500", "delay-200", "transition-all"];

describe("focus ring with no reduced-motion preference", () => {
  // Popups open with Motion; the lists of their CSS fallback are checked below
  beforeAll(() => enterMotionPath(true));

  it.each(RING_CASES)("$part shows the ring from the moment it takes keyboard focus", async (c) => {
    expectInstantRing(await focusRing(c), c.pseudo);
  });

  describe.each(UTILITIES)("with %s in className", (utility) => {
    it.each(RING_CASES)(
      "$part shows the ring from the moment it takes keyboard focus",
      async (c) => {
        expectInstantRing(await focusRing(c, utility), c.pseudo);
      },
    );
  });

  // Guards against a list that drops a property the part changes with its state
  it.each([
    { part: "Switch.Root", property: "background-color" },
    { part: "Calendar day", property: "box-shadow" },
    { part: "ToggleGroup.Item", property: "box-shadow" },
    { part: "Checkbox.Root", property: "border-color" },
  ])("lists $property in the transitions of $part", async ({ part, property }) => {
    const c = RING_CASES.find((r) => r.part === part);
    if (!c) throw new Error(`No ring case for ${part}`);
    const drawn = await focusRing(c);
    expect(getComputedStyle(drawn).transitionProperty).toContain(property);
  });

  // Motion writes these on the popups, so a CSS transition on them would lag the spring
  it.each(["Popover.Content", "Menu.Content", "Dialog.Popup", "Drawer.Popup"])(
    "%s leaves the properties Motion writes out of its transitions",
    async (part) => {
      const c = RING_CASES.find((r) => r.part === part);
      if (!c) throw new Error(`No ring case for ${part}`);
      const properties = getComputedStyle(await focusRing(c)).transitionProperty;
      for (const written of ["all", "opacity", "transform", "translate", "scale", "rotate"])
        expect(properties.split(", ")).not.toContain(written);
    },
  );

  // The ring is left out, not the rest: a colour change, as on hover or press, still fades
  it("fades the colours of a Textarea", () => {
    render(<Textarea aria-label="Target" />);
    const part = screen.getByRole("textbox", { name: "Target" });
    part.style.color = "rgb(255, 0, 0)";
    part.style.backgroundColor = "rgb(0, 0, 255)";
    const faded = part.getAnimations().map((a) => (a as CSSTransition).transitionProperty);
    expect(faded.sort()).toEqual(["background-color", "color"]);
  });

  // With the consumer's timing, while the part has keyboard focus
  it.each([
    { utility: "duration-500", duration: 500, delay: 0 },
    { utility: "delay-200", duration: 300, delay: 200 },
    // The part's own list and 300ms come after the utility in the CSS
    { utility: "transition-colors", duration: 300, delay: 0 },
    { utility: "transition", duration: 300, delay: 0 },
  ])("fades the colours of a focused Input with $utility", async ({ utility, ...timing }) => {
    const input = (await focusRing(INPUT, utility)) as HTMLElement;
    input.style.color = "rgb(255, 0, 0)";
    input.style.backgroundColor = "rgb(0, 0, 255)";
    const faded = input.getAnimations().map((a) => {
      const { duration, delay } = a.effect?.getTiming() ?? {};
      return { property: (a as CSSTransition).transitionProperty, duration, delay };
    });
    expect(faded.sort((a, z) => a.property.localeCompare(z.property))).toEqual([
      { property: "background-color", ...timing },
      { property: "color", ...timing },
    ]);
  });
});

const comboboxPopup = () => (
  <Combobox.Root items={["Apple"]} defaultOpen>
    <Combobox.Input aria-label="Fruit" />
    <Combobox.Portal>
      <Combobox.Positioner>
        <Combobox.Popup data-testid="target">
          <Combobox.List>
            <Combobox.Item value="Apple">Apple</Combobox.Item>
          </Combobox.List>
        </Combobox.Popup>
      </Combobox.Positioner>
    </Combobox.Portal>
  </Combobox.Root>
);

/*
 * A part that sets its own `[transition-property:…]` list keeps one duration for all of it: the
 * class's list of durations would repeat over the part's list, and give some of its properties
 * the ring's 0s. A consumer list on a popup (theme.mdx) keeps that duration too.
 */
describe("own transition lists with no reduced-motion preference", () => {
  // The popups' CSS fallback: Motion never arrives
  beforeAll(() => enterMotionPath(false));
  afterAll(() => enterMotionPath(true));

  it.each([
    {
      part: "Button",
      ui: <Button data-testid="target">Target</Button>,
      properties: ["color", "background-color", "border-color", "opacity", "scale"],
    },
    {
      part: "Popover.Content",
      ui: (
        <Popover.Root defaultOpen>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Content data-testid="target">Content</Popover.Content>
        </Popover.Root>
      ),
      properties: ["opacity", "scale"],
    },
    {
      part: "Menu.Content",
      ui: (
        <Menu.Root defaultOpen>
          <Menu.Trigger>Trigger</Menu.Trigger>
          <Menu.Content data-testid="target">
            <Menu.Item>Item</Menu.Item>
          </Menu.Content>
        </Menu.Root>
      ),
      properties: ["opacity", "scale"],
    },
    {
      part: "Tooltip.Popup",
      ui: (
        <Tooltip.Provider>
          <Tooltip.Root defaultOpen>
            <Tooltip.Trigger>Trigger</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="target">Content</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      ),
      properties: ["opacity", "scale"],
    },
    {
      part: "Combobox.Popup",
      ui: comboboxPopup(),
      properties: ["opacity"],
    },
    {
      part: "Dialog.Popup",
      ui: (
        <Dialog.Root defaultOpen>
          <Dialog.Portal>
            <Dialog.Popup data-testid="target">
              <Dialog.Title>Title</Dialog.Title>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ),
      properties: ["opacity", "scale"],
    },
    {
      part: "DatePicker popup",
      ui: <DatePicker />,
      // No `className` reaches the popup: opened with the mouse, as no ring is read here
      target: async () => {
        await userEvent.click(
          screen.getByRole("button", { name: DEFAULT_DATE_PICKER_LABELS.placeholder }),
        );
        return screen.findByRole("dialog");
      },
      properties: ["opacity", "scale"],
    },
    {
      part: "Drawer.Popup",
      ui: drawerPopup(),
      properties: ["translate"],
    },
    {
      part: "Drawer.Popup with a consumer list of two",
      ui: drawerPopup("[transition-property:translate,opacity]"),
      properties: ["translate", "opacity"],
    },
  ])("fades every property $part lists for the same time", async ({ ui, target, properties }) => {
    render(ui);
    const part = await (target?.() ?? screen.findByTestId("target"));
    expect(part).toHaveClass("micro-interactions");
    const durations = durationsOf(part);
    expect(Object.keys(durations)).toEqual(properties);
    expect(new Set(Object.values(durations))).toEqual(new Set(["0.3s"]));
    // One duration of its own, not the class's three: a one-item list hides the repeat above
    expect(getComputedStyle(part).transitionDuration).toBe("0.3s");
  });
});

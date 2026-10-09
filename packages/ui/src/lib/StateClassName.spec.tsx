import { Toast as BaseToast } from "@base-ui/react/toast";
import { cleanup, render, screen } from "@testing-library/react";
import { type ReactNode, useEffect } from "react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { Accordion } from "../components/accordion";
import { Button } from "../components/button";
import { Checkbox } from "../components/checkbox";
import { Collapsible } from "../components/collapsible";
import { Combobox } from "../components/combobox";
import { Dialog } from "../components/dialog";
import { Drawer } from "../components/drawer";
import { Field } from "../components/field";
import { IconButton } from "../components/icon-button";
import { Input } from "../components/input";
import { Menu } from "../components/menu";
import { NumberField } from "../components/number-field";
import { Popover } from "../components/popover";
import { Progress } from "../components/progress";
import { Radio } from "../components/radio";
import { ScrollArea } from "../components/scroll-area";
import { Select } from "../components/select";
import { Separator } from "../components/separator";
import { Slider } from "../components/slider";
import { Switch } from "../components/switch";
import { Tabs } from "../components/tabs";
import { Toast } from "../components/toast";
import { ToggleGroup } from "../components/toggle-group";
import { Tooltip } from "../components/tooltip";
import { reloadMotion } from "./use-motion";

// Base UI accepts `className` as a function of the part's state. This one turns each boolean
// and string field into a class (`state-open-true`, `state-orientation-vertical`...) and adds
// `fn-called`, which tailwind-merge leaves alone (`from-*` would read as a gradient class).
const fromState = <State extends object>(state: State) =>
  [
    "fn-called",
    ...Object.entries(state)
      .filter(([, value]) => typeof value === "boolean" || (typeof value === "string" && value))
      .map(([key, value]) => `state-${key}-${value}`),
  ].join(" ");

type ClassNameProp = typeof fromState | string | undefined;
type Part = (name: string) => { className: ClassNameProp; "data-testid": string };

const items = ["apple", "banana"];

// Each fixture renders a component in a state that shows on every part through `fromState`.
// `parts` maps each part to the class its state must produce, or `null` when its Base UI state is
// an empty object and only the marker shows. NumberField.ScrubAreaCursor (only while scrubbing)
// and ScrollArea.Corner (only when both scrollbars overflow) got the same one-word fix but do not
// render in jsdom.
const fixtures: Record<
  string,
  { parts: Record<string, string | null>; ui: (part: Part) => ReactNode }
> = {
  Accordion: {
    parts: {
      Root: "state-disabled-true",
      Item: "state-open-true",
      Header: "state-open-true",
      Trigger: "state-open-true",
      Panel: "state-open-true",
    },
    ui: (p) => (
      <Accordion.Root defaultValue={["a"]} disabled {...p("Root")}>
        <Accordion.Item value="a" {...p("Item")}>
          <Accordion.Header {...p("Header")}>
            <Accordion.Trigger {...p("Trigger")}>A</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel {...p("Panel")}>Body</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    ),
  },
  Button: { parts: { Root: "state-disabled-true" }, ui: (p) => <Button disabled {...p("Root")} /> },
  IconButton: {
    parts: { Root: "state-disabled-true" },
    ui: (p) => <IconButton aria-label="Icon" disabled {...p("Root")} />,
  },
  Checkbox: {
    parts: { Root: "state-checked-true", Indicator: "state-checked-true" },
    ui: (p) => (
      <Checkbox.Root aria-label="Check" defaultChecked {...p("Root")}>
        <Checkbox.Indicator {...p("Indicator")} />
      </Checkbox.Root>
    ),
  },
  Collapsible: {
    parts: { Trigger: "state-open-true", Panel: "state-open-true" },
    ui: (p) => (
      <Collapsible.Root defaultOpen>
        <Collapsible.Trigger {...p("Trigger")}>Toggle</Collapsible.Trigger>
        <Collapsible.Panel {...p("Panel")}>Body</Collapsible.Panel>
      </Collapsible.Root>
    ),
  },
  Combobox: {
    parts: {
      Input: "state-open-true",
      Trigger: "state-open-true",
      Icon: null,
      Clear: "state-visible-true",
      Positioner: "state-open-true",
      Popup: "state-open-true",
      GroupLabel: null,
      Item: "state-selected-true",
      ItemIndicator: "state-selected-true",
    },
    ui: (p) => (
      <Combobox.Root open items={items} defaultValue="apple">
        <Combobox.Input aria-label="Fruit" {...p("Input")} />
        <Combobox.Trigger {...p("Trigger")} />
        <Combobox.Icon {...p("Icon")} />
        <Combobox.Clear {...p("Clear")} />
        <Combobox.Portal>
          <Combobox.Positioner {...p("Positioner")}>
            <Combobox.Popup {...p("Popup")}>
              <Combobox.Group>
                <Combobox.GroupLabel {...p("GroupLabel")}>Fruit</Combobox.GroupLabel>
                <Combobox.List>
                  {(item: string) => (
                    <Combobox.Item key={item} value={item} {...(item === "apple" ? p("Item") : {})}>
                      <Combobox.ItemIndicator {...(item === "apple" ? p("ItemIndicator") : {})} />
                      {item}
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Group>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    ),
  },
  "Combobox (empty)": {
    parts: { Empty: null },
    ui: (p) => (
      <Combobox.Root open items={[]}>
        <Combobox.Input aria-label="Fruit" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.Empty {...p("Empty")}>No fruit</Combobox.Empty>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    ),
  },
  "Combobox (chips)": {
    parts: { Chip: "state-disabled-true", ChipRemove: "state-disabled-true" },
    ui: (p) => (
      <Combobox.Root multiple items={items} defaultValue={["apple"]} disabled>
        <Combobox.Chips>
          <Combobox.Value>
            {(value: string[]) =>
              value.map((item) => (
                <Combobox.Chip key={item} {...p("Chip")}>
                  {item}
                  <Combobox.ChipRemove aria-label="Remove" {...p("ChipRemove")} />
                </Combobox.Chip>
              ))
            }
          </Combobox.Value>
          <Combobox.Input aria-label="Fruit" />
        </Combobox.Chips>
      </Combobox.Root>
    ),
  },
  Dialog: {
    parts: {
      Portal: null,
      Backdrop: "state-open-true",
      Popup: "state-open-true",
      Title: null,
      Description: null,
    },
    ui: (p) => (
      <Dialog.Root open>
        <Dialog.Portal {...p("Portal")}>
          <Dialog.Backdrop {...p("Backdrop")} />
          <Dialog.Popup {...p("Popup")}>
            <Dialog.Title {...p("Title")}>Title</Dialog.Title>
            <Dialog.Description {...p("Description")}>Text</Dialog.Description>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    ),
  },
  Drawer: {
    parts: {
      Portal: null,
      Backdrop: "state-open-true",
      Popup: "state-open-true",
      Title: null,
      Description: null,
    },
    ui: (p) => (
      <Drawer.Root open>
        <Drawer.Portal {...p("Portal")}>
          <Drawer.Backdrop {...p("Backdrop")} />
          <Drawer.Popup {...p("Popup")}>
            <Drawer.Title {...p("Title")}>Title</Drawer.Title>
            <Drawer.Description {...p("Description")}>Text</Drawer.Description>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>
    ),
  },
  Field: {
    parts: {
      Root: "state-disabled-true",
      Label: "state-disabled-true",
      Description: "state-disabled-true",
      Error: "state-disabled-true",
    },
    ui: (p) => (
      <Field.Root disabled {...p("Root")}>
        <Field.Label {...p("Label")}>Name</Field.Label>
        <Input />
        <Field.Description {...p("Description")}>Help</Field.Description>
        <Field.Error match {...p("Error")}>
          Wrong
        </Field.Error>
      </Field.Root>
    ),
  },
  Input: {
    parts: { Root: "state-disabled-true" },
    ui: (p) => <Input aria-label="Name" disabled {...p("Root")} />,
  },
  Menu: {
    parts: {
      Content: "state-open-true",
      Arrow: "state-open-true",
      GroupLabel: null,
      Item: "state-disabled-true",
      Separator: "state-orientation-horizontal",
      RadioItem: "state-checked-true",
      RadioItemIndicator: "state-checked-true",
      CheckboxItem: "state-checked-true",
      CheckboxItemIndicator: "state-checked-true",
    },
    ui: (p) => (
      <Menu.Root open>
        <Menu.Trigger>Menu</Menu.Trigger>
        <Menu.Content {...p("Content")}>
          <Menu.Arrow {...p("Arrow")} />
          <Menu.Group>
            <Menu.GroupLabel {...p("GroupLabel")}>Group</Menu.GroupLabel>
            <Menu.Item disabled {...p("Item")}>
              Item
            </Menu.Item>
          </Menu.Group>
          <Menu.Separator {...p("Separator")} />
          <Menu.RadioGroup defaultValue="a">
            <Menu.RadioItem value="a" {...p("RadioItem")}>
              <Menu.RadioItemIndicator {...p("RadioItemIndicator")} />A
            </Menu.RadioItem>
          </Menu.RadioGroup>
          <Menu.CheckboxItem defaultChecked {...p("CheckboxItem")}>
            <Menu.CheckboxItemIndicator {...p("CheckboxItemIndicator")} />B
          </Menu.CheckboxItem>
        </Menu.Content>
      </Menu.Root>
    ),
  },
  NumberField: {
    parts: {
      Root: "state-disabled-true",
      ScrubArea: "state-disabled-true",
      Group: "state-disabled-true",
      Decrement: "state-disabled-true",
      Input: "state-disabled-true",
      Increment: "state-disabled-true",
    },
    ui: (p) => (
      <NumberField.Root defaultValue={1} disabled {...p("Root")}>
        <NumberField.ScrubArea {...p("ScrubArea")}>
          <span>Amount</span>
        </NumberField.ScrubArea>
        <NumberField.Group {...p("Group")}>
          <NumberField.Decrement aria-label="Decrement" {...p("Decrement")} />
          <NumberField.Input aria-label="Amount" {...p("Input")} />
          <NumberField.Increment aria-label="Increment" {...p("Increment")} />
        </NumberField.Group>
      </NumberField.Root>
    ),
  },
  Popover: {
    parts: { Content: "state-open-true", Arrow: "state-open-true", Title: null, Description: null },
    ui: (p) => (
      <Popover.Root open>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content {...p("Content")}>
          <Popover.Arrow {...p("Arrow")} />
          <Popover.Title {...p("Title")}>Title</Popover.Title>
          <Popover.Description {...p("Description")}>Text</Popover.Description>
        </Popover.Content>
      </Popover.Root>
    ),
  },
  Progress: {
    parts: {
      Root: "state-status-complete",
      Track: "state-status-complete",
      Indicator: "state-status-complete",
    },
    ui: (p) => (
      <Progress.Root value={100} aria-label="Done" {...p("Root")}>
        <Progress.Track {...p("Track")}>
          <Progress.Indicator {...p("Indicator")} />
        </Progress.Track>
      </Progress.Root>
    ),
  },
  Radio: {
    parts: {
      Group: "state-disabled-true",
      Root: "state-checked-true",
      Indicator: "state-checked-true",
    },
    ui: (p) => (
      <Radio.Group defaultValue="a" disabled aria-label="Choice" {...p("Group")}>
        <Radio.Root value="a" aria-label="A" {...p("Root")}>
          <Radio.Indicator {...p("Indicator")} />
        </Radio.Root>
      </Radio.Group>
    ),
  },
  ScrollArea: {
    parts: {
      Root: "state-scrolling-false",
      Viewport: "state-scrolling-false",
      Content: "state-scrolling-false",
      Scrollbar: "state-orientation-vertical",
      Thumb: "state-orientation-vertical",
    },
    ui: (p) => (
      <ScrollArea.Root {...p("Root")}>
        <ScrollArea.Viewport {...p("Viewport")}>
          <ScrollArea.Content {...p("Content")}>Body</ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical" keepMounted {...p("Scrollbar")}>
          <ScrollArea.Thumb {...p("Thumb")} />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    ),
  },
  Select: {
    parts: {
      Trigger: "state-value-apple",
      Icon: "state-open-true",
      Positioner: "state-open-true",
      Popup: "state-open-true",
      GroupLabel: null,
      Item: "state-selected-true",
      ItemIndicator: "state-selected-true",
    },
    ui: (p) => (
      <Select.Root open defaultValue="apple">
        <Select.Trigger aria-label="Fruit" {...p("Trigger")}>
          <Select.Value />
          <Select.Icon {...p("Icon")} />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner {...p("Positioner")}>
            <Select.Popup {...p("Popup")}>
              <Select.Group>
                <Select.GroupLabel {...p("GroupLabel")}>Fruit</Select.GroupLabel>
                <Select.Item value="apple" {...p("Item")}>
                  <Select.ItemText>Apple</Select.ItemText>
                  <Select.ItemIndicator {...p("ItemIndicator")} />
                </Select.Item>
              </Select.Group>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    ),
  },
  Separator: {
    parts: { Root: "state-orientation-vertical" },
    ui: (p) => <Separator orientation="vertical" {...p("Root")} />,
  },
  Slider: {
    parts: {
      Root: "state-disabled-true",
      Value: "state-disabled-true",
      Control: "state-disabled-true",
      Track: "state-disabled-true",
      Indicator: "state-disabled-true",
      Thumb: "state-disabled-true",
    },
    ui: (p) => (
      <Slider.Root defaultValue={50} disabled {...p("Root")}>
        <Slider.Value {...p("Value")} />
        <Slider.Control {...p("Control")}>
          <Slider.Track {...p("Track")}>
            <Slider.Indicator {...p("Indicator")} />
            <Slider.Thumb aria-label="Volume" {...p("Thumb")} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    ),
  },
  Switch: {
    parts: { Root: "state-checked-true", Thumb: "state-checked-true" },
    ui: (p) => (
      <Switch.Root aria-label="On" defaultChecked {...p("Root")}>
        <Switch.Thumb {...p("Thumb")} />
      </Switch.Root>
    ),
  },
  Tabs: {
    parts: {
      Root: "state-orientation-horizontal",
      List: "state-orientation-horizontal",
      Tab: "state-active-true",
      Indicator: "state-orientation-horizontal",
      Panel: "state-hidden-false",
    },
    ui: (p) => (
      <Tabs.Root defaultValue="a" {...p("Root")}>
        <Tabs.List {...p("List")}>
          <Tabs.Tab value="a" {...p("Tab")}>
            A
          </Tabs.Tab>
          <Tabs.Indicator {...p("Indicator")} />
        </Tabs.List>
        <Tabs.Panel value="a" {...p("Panel")}>
          Body
        </Tabs.Panel>
      </Tabs.Root>
    ),
  },
  "Toast (viewport)": {
    parts: { Viewport: "state-expanded-false" },
    ui: (p) => (
      <Toast.Provider>
        <ToastAdder />
        <Toast.Viewport {...p("Viewport")} />
      </Toast.Provider>
    ),
  },
  Toast: {
    parts: {
      Root: "state-type-success",
      Title: "state-type-success",
      Description: "state-type-success",
      Action: "state-type-success",
      Close: "state-type-success",
    },
    ui: (p) => (
      <Toast.Provider>
        <ToastAdder />
        <BaseToast.Viewport>
          <ToastList>
            {(toast) => (
              <Toast.Root key={toast.id} toast={toast} {...p("Root")}>
                <Toast.Title {...p("Title")}>Saved</Toast.Title>
                <Toast.Description {...p("Description")}>All good</Toast.Description>
                <Toast.Action {...p("Action")}>Undo</Toast.Action>
                <Toast.Close {...p("Close")} />
              </Toast.Root>
            )}
          </ToastList>
        </BaseToast.Viewport>
      </Toast.Provider>
    ),
  },
  ToggleGroup: {
    parts: { Root: "state-disabled-true", Item: "state-pressed-true" },
    ui: (p) => (
      <ToggleGroup.Root defaultValue={["a"]} disabled {...p("Root")}>
        <ToggleGroup.Item value="a" {...p("Item")}>
          A
        </ToggleGroup.Item>
      </ToggleGroup.Root>
    ),
  },
  Tooltip: {
    parts: { Positioner: "state-open-true", Popup: "state-open-true", Arrow: "state-open-true" },
    ui: (p) => (
      <Tooltip.Root open>
        <Tooltip.Trigger>Hint</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner {...p("Positioner")}>
            <Tooltip.Popup {...p("Popup")}>
              Tip
              <Tooltip.Arrow {...p("Arrow")} />
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ),
  },
};

function ToastAdder() {
  const { add } = Toast.useToast();
  useEffect(() => {
    add({ title: "Saved", type: "success" });
  }, [add]);
  return null;
}

type ToastObject = ReturnType<typeof Toast.useToast>["toasts"][number];

function ToastList({ children }: { children: (toast: ToastObject) => ReactNode }) {
  return <>{Toast.useToast().toasts.map(children)}</>;
}

// Renders a fixture with `className` set on every part, and returns each part's classes
async function classesOf(name: string, className: (part: string) => ClassNameProp) {
  const fixture = fixtures[name];
  if (!fixture) throw new Error(`No fixture ${name}`);
  render(fixture.ui((part) => ({ className: className(part), "data-testid": part })));
  const classes = new Map<string, string[]>();
  for (const part of Object.keys(fixture.parts)) {
    const element = await screen.findByTestId(part);
    classes.set(part, [...element.classList]);
  }
  cleanup();
  return classes;
}

beforeAll(async () => {
  // jsdom lacks both: ToggleGroup measures its items, and ScrollArea.Viewport reads its
  // animations from a timer that can fire during a later test
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.getAnimations ??= () => [];
  // The same Motion or CSS path for every render, so the base classes match between them
  await reloadMotion();
});

afterEach(cleanup);

const rows = Object.entries(fixtures).flatMap(([name, { parts }]) =>
  Object.entries(parts).map(([part, stateClass]) => [name, part, stateClass] as const),
);

describe("className on Base UI parts", () => {
  it.each(rows)(
    "%s.%s calls a className function with its state",
    async (name, part, stateClass) => {
      const base = (await classesOf(name, () => undefined)).get(part) ?? [];
      const classes = (await classesOf(name, () => fromState)).get(part) ?? [];
      expect(classes).toContain("fn-called");
      if (stateClass) expect(classes).toContain(stateClass);
      expect(classes).toEqual(expect.arrayContaining(base));
    },
  );

  it.each(rows)("%s.%s still takes a string className", async (name, part) => {
    const base = (await classesOf(name, () => undefined)).get(part) ?? [];
    const classes = (await classesOf(name, (p) => `custom-${p}`)).get(part) ?? [];
    expect(classes).toContain(`custom-${part}`);
    expect(classes).toEqual(expect.arrayContaining(base));
  });
});

// Wrappers whose className can land on a plain element, which has no Base UI state
describe("className on composite wrappers", () => {
  it("passes an Input's className function to the input when adornments wrap it", () => {
    render(<Input aria-label="Search" disabled startAdornment="@" className={fromState} />);
    const input = screen.getByRole("textbox", { name: "Search" });
    expect(input).toHaveClass("fn-called", "state-disabled-true", "pl-9");
    expect(input.parentElement).not.toHaveClass("fn-called");
  });

  it("keeps an Input's string className on the wrapper when adornments wrap it", () => {
    render(<Input aria-label="Search" startAdornment="@" className="w-64" />);
    const input = screen.getByRole("textbox", { name: "Search" });
    expect(input.parentElement).toHaveClass("relative", "w-64");
    expect(input).not.toHaveClass("w-64");
  });

  it("puts a Radio.Item's string className on its label", () => {
    render(
      <Radio.Group aria-label="Size" defaultValue="s">
        <Radio.Item value="s" className="gap-4">
          Small
        </Radio.Item>
      </Radio.Group>,
    );
    expect(screen.getByText("Small").closest("label")).toHaveClass("cursor-pointer", "gap-4");
  });
});

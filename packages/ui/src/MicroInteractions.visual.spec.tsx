import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { Accordion } from "./components/accordion";
import { Button } from "./components/button";
import { Progress } from "./components/progress";
import { ScrollArea } from "./components/scroll-area";
import { Slider } from "./components/slider";
import { Table } from "./components/table";
import { Textarea } from "./components/textarea";
import { ThemeToggle } from "./components/theme-toggle";

/*
 * `.micro-interactions` (theme.css) gives components their default transition. Timing
 * utilities from the consumer, such as `duration-150` or `ease-linear`, must win over it, the
 * same as any other utility does over a component's own styles. With reduced motion nothing
 * turns the transition back on, not even a `transition-*` utility.
 *
 * The parts that set their own transition or animation outside the class turn it off with
 * reduced motion as well: the Accordion panel and chevron, the Progress indicator (width and
 * the indeterminate pulse) and the ScrollArea scrollbar. A consumer's `animate-*` class on the
 * Progress indicator replaces the pulse.
 */

type Transition = { property: string; duration: string; timingFunction: string };

function transitionOf(element: Element): Transition {
  const style = getComputedStyle(element);
  return {
    property: style.transitionProperty,
    duration: style.transitionDuration,
    timingFunction: style.transitionTimingFunction,
  };
}

function renderTarget(ui: ReactNode) {
  return render(ui).getByTestId("target");
}

const plain = (className?: string) => (
  <span data-testid="target" className={["micro-interactions", className].join(" ")}>
    Target
  </span>
);

// These set `transition-colors` next to the class, so they fade colours only
const COLOR_FADES = [
  {
    component: "Slider.Thumb",
    ui: (className?: string) => (
      <Slider.Root defaultValue={[40]}>
        <Slider.Control>
          <Slider.Track>
            <Slider.Thumb index={0} data-testid="target" className={className} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    ),
  },
  {
    component: "Textarea",
    ui: (className?: string) => (
      <Textarea aria-label="Notes" data-testid="target" className={className} />
    ),
  },
  {
    component: "Table.Row",
    ui: (className?: string) => (
      <Table.Root>
        <Table.Body>
          <Table.Row data-testid="target" className={className}>
            <Table.Cell>Cell</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
    ),
  },
] as const;

const accordion = (
  <Accordion.Root defaultValue={["a"]}>
    <Accordion.Item value="a">
      <Accordion.Header>
        <Accordion.Trigger>Section</Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel data-testid="target">Content</Accordion.Panel>
    </Accordion.Item>
  </Accordion.Root>
);

const progress = (value: number | null, className?: string) => (
  <Progress.Root value={value}>
    <Progress.Track>
      <Progress.Indicator data-testid="target" className={className} />
    </Progress.Track>
  </Progress.Root>
);

// Transitions these parts set themselves, without `.micro-interactions`
const OWN_TRANSITIONS = [
  { part: "Accordion.Panel", property: "height", renderPart: () => renderTarget(accordion) },
  {
    part: "the Accordion.Trigger chevron",
    property: "rotate",
    renderPart: () => render(accordion).getByRole("button").querySelector("svg") as Element,
  },
  { part: "Progress.Indicator", property: "width", renderPart: () => renderTarget(progress(40)) },
  {
    part: "ScrollArea.Scrollbar",
    property: "opacity",
    renderPart: () =>
      renderTarget(
        <ScrollArea.Root>
          <ScrollArea.Viewport>Content</ScrollArea.Viewport>
          <ScrollArea.Scrollbar keepMounted data-testid="target">
            <ScrollArea.Thumb />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>,
      ),
  },
] as const;

describe(".micro-interactions with no reduced-motion preference", () => {
  beforeAll(() => commands.emulateMedia({ reducedMotion: "no-preference" }));
  afterAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));

  it("transitions with its own defaults when nothing overrides them", () => {
    expect(transitionOf(renderTarget(plain()))).toEqual({
      property: "all",
      duration: "0.3s",
      timingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    });
  });

  it("lets a duration utility change the duration", () => {
    expect(transitionOf(renderTarget(plain("duration-150")))).toEqual({
      property: "all",
      duration: "0.15s",
      timingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    });
  });

  it("lets an easing utility change the timing function", () => {
    expect(transitionOf(renderTarget(plain("ease-linear")))).toEqual({
      property: "all",
      duration: "0.3s",
      timingFunction: "linear",
    });
  });

  // Button has the class from its variants and passes `className` through
  it("lets a duration utility change Button's duration", () => {
    const button = renderTarget(
      <Button data-testid="target" className="duration-150">
        Target
      </Button>,
    );
    expect(transitionOf(button).duration).toBe("0.15s");
  });

  it.each(COLOR_FADES)("fades only colours on $component", ({ ui }) => {
    const properties = transitionOf(renderTarget(ui())).property.split(", ");
    expect(properties).toEqual(expect.arrayContaining(["color", "background-color"]));
    expect(properties).not.toContain("all");
  });

  it.each(COLOR_FADES)(
    "lets a transition utility replace the colour fade on $component",
    ({ ui }) => {
      expect(transitionOf(renderTarget(ui("transition-opacity"))).property).toBe("opacity");
    },
  );
});

describe(".micro-interactions with reduced motion", () => {
  beforeAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));

  it("does not transition", () => {
    expect(transitionOf(renderTarget(plain())).property).toBe("none");
  });

  it.each(["transition-colors", "transition-colors!"])(
    "does not transition when %s is added",
    (utility) => {
      expect(transitionOf(renderTarget(plain(utility))).property).toBe("none");
    },
  );

  it.each(COLOR_FADES)("stops the colour fade on $component", ({ ui }) => {
    expect(transitionOf(renderTarget(ui())).property).toBe("none");
  });
});

describe("component motion with no reduced-motion preference", () => {
  beforeAll(() => commands.emulateMedia({ reducedMotion: "no-preference" }));
  afterAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));

  it.each(OWN_TRANSITIONS)("transitions $property on $part", ({ renderPart, property }) => {
    // The chevron uses `transition-transform`, which Tailwind expands to several properties
    expect(transitionOf(renderPart()).property.split(", ")).toContain(property);
  });

  // `scale-75` sets the `scale` property, not `transform`
  it("scales and fades the ThemeToggle icon out", () => {
    const { rerender } = render(<ThemeToggle theme="light" />);
    const sun = screen.getByRole("button").firstElementChild as HTMLElement;
    rerender(<ThemeToggle theme="dark" />);
    const properties = sun.getAnimations().map((a) => (a as CSSTransition).transitionProperty);
    expect(properties.sort()).toEqual(["opacity", "scale"]);
  });
});

describe("component motion with reduced motion", () => {
  beforeAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));

  it.each(OWN_TRANSITIONS)("does not transition $part", ({ renderPart }) => {
    expect(transitionOf(renderPart()).property).toBe("none");
  });

  it("still opens and closes an Accordion on click", async () => {
    const user = userEvent.setup();
    render(accordion);
    const trigger = screen.getByRole("button", { name: "Section" });
    const panel = () => screen.queryByTestId("target");

    await user.click(trigger);
    await expect.poll(() => panel()?.hidden ?? true).toBe(true);

    await user.click(trigger);
    await expect.poll(() => panel()?.getBoundingClientRect().height ?? 0).toBeGreaterThan(0);
    expect(panel()).toBeVisible();
  });
});

describe("Progress.Indicator indeterminate animation", () => {
  afterAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));

  // Full class names, so Tailwind generates them
  it.each([
    { reducedMotion: "no-preference", className: undefined, animation: "pulse" },
    {
      reducedMotion: "no-preference",
      className: "data-[indeterminate]:animate-bounce",
      animation: "bounce",
    },
    {
      reducedMotion: "no-preference",
      className: "data-[indeterminate]:animate-none",
      animation: "none",
    },
    { reducedMotion: "reduce", className: undefined, animation: "none" },
    {
      reducedMotion: "reduce",
      className: "data-[indeterminate]:animate-bounce",
      animation: "none",
    },
  ] as const)(
    "animates as $animation with $reducedMotion and $className",
    async ({ reducedMotion, className, animation }) => {
      await commands.emulateMedia({ reducedMotion });
      const indicator = renderTarget(progress(null, className));
      expect(getComputedStyle(indicator).animationName).toBe(animation);
    },
  );
});

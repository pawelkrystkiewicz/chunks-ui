import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { Button } from "./components/button";
import { Slider } from "./components/slider";
import { Table } from "./components/table";
import { Textarea } from "./components/textarea";

/*
 * `.micro-interactions` (theme.css) gives components their default transition. Timing
 * utilities from the consumer, such as `duration-150` or `ease-linear`, must win over it, the
 * same as any other utility does over a component's own styles. With reduced motion nothing
 * turns the transition back on, not even a `transition-*` utility.
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

const sliderThumb = (
  <Slider.Root defaultValue={[40]}>
    <Slider.Control>
      <Slider.Track>
        <Slider.Thumb index={0} data-testid="target" />
      </Slider.Track>
    </Slider.Control>
  </Slider.Root>
);

// These set `transition-colors!` next to the class, so they fade colours only
const COLOR_FADES = [
  { component: "Slider.Thumb", ui: sliderThumb },
  { component: "Textarea", ui: <Textarea aria-label="Notes" data-testid="target" /> },
  {
    component: "Table.Row",
    ui: (
      <Table.Root>
        <Table.Body>
          <Table.Row data-testid="target">
            <Table.Cell>Cell</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
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
    const properties = transitionOf(renderTarget(ui)).property.split(", ");
    expect(properties).toEqual(expect.arrayContaining(["color", "background-color"]));
    expect(properties).not.toContain("all");
  });
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

  it("stops the Slider.Thumb colour fade from its transition-colors!", () => {
    expect(transitionOf(renderTarget(sliderThumb)).property).toBe("none");
  });
});

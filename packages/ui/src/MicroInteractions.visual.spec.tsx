import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { Button } from "./components/button";

/*
 * `.micro-interactions` (theme.css) gives components their default transition. Timing
 * utilities from the consumer, such as `duration-150` or `ease-linear`, must win over it, the
 * same as any other utility does over a component's own styles.
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

const ELEMENTS = [
  {
    element: "a plain element",
    ui: (className?: string) => (
      <span data-testid="target" className={["micro-interactions", className].join(" ")}>
        Target
      </span>
    ),
  },
  {
    element: "Button",
    ui: (className?: string) => (
      <Button data-testid="target" className={className}>
        Target
      </Button>
    ),
  },
] as const;

function renderTarget(ui: ReactNode) {
  return render(ui).getByTestId("target");
}

describe.each(ELEMENTS)(".micro-interactions on $element", ({ ui }) => {
  describe("with no reduced-motion preference", () => {
    beforeAll(() => commands.emulateMedia({ reducedMotion: "no-preference" }));
    afterAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));

    it("transitions with its own defaults when nothing overrides them", () => {
      expect(transitionOf(renderTarget(ui()))).toEqual({
        property: "all",
        duration: "0.3s",
        timingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
      });
    });

    it("lets a duration utility change the duration", () => {
      expect(transitionOf(renderTarget(ui("duration-150")))).toEqual({
        property: "all",
        duration: "0.15s",
        timingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
      });
    });

    it("lets an easing utility change the timing function", () => {
      expect(transitionOf(renderTarget(ui("ease-linear")))).toEqual({
        property: "all",
        duration: "0.3s",
        timingFunction: "linear",
      });
    });
  });

  describe("with reduced motion", () => {
    beforeAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));

    it("does not transition", () => {
      expect(transitionOf(renderTarget(ui())).property).toBe("none");
    });

    it("does not transition when a timing utility is added", () => {
      expect(transitionOf(renderTarget(ui("duration-150 ease-linear"))).property).toBe("none");
    });
  });
});

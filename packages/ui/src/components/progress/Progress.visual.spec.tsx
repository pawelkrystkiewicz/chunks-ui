import { render } from "@testing-library/react";
import { afterAll, describe, it } from "vitest";
import { commands } from "vitest/browser";
import { pauseAnimations, renderFixture } from "../../VisualTest.utils";
import { Progress } from "./index";

describe("Progress", () => {
  it("determinate", async () => {
    const { fixture } = await renderFixture(
      <Progress.Root value={65} max={100}>
        <Progress.Track>
          <Progress.Indicator />
        </Progress.Track>
      </Progress.Root>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("indeterminate", async () => {
    const { fixture } = await renderFixture(
      <Progress.Root value={null}>
        <Progress.Track>
          <Progress.Indicator />
        </Progress.Track>
      </Progress.Root>,
    );
    pauseAnimations();
    await expect(fixture).toMatchScreenshot();
  });
});

const renderIndeterminate = (className?: string) =>
  render(
    <Progress.Root value={null}>
      <Progress.Track>
        <Progress.Indicator data-testid="indicator" className={className} />
      </Progress.Track>
    </Progress.Root>,
  ).getByTestId("indicator");

/*
 * The indeterminate pulse is an essential status indicator, like the Loader spinner, so it
 * keeps running with reduced motion. A `data-indeterminate:animate-*` class on the indicator
 * replaces it; an `animate-*` class without that prefix does not.
 */
describe("Progress.Indicator indeterminate animation", () => {
  afterAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));

  // Full class names, so Tailwind generates them
  it.each([
    { reducedMotion: "no-preference", className: undefined, animation: "pulse" },
    {
      reducedMotion: "no-preference",
      className: "data-indeterminate:animate-bounce",
      animation: "bounce",
    },
    {
      reducedMotion: "no-preference",
      className: "data-indeterminate:animate-none",
      animation: "none",
    },
    // The old bracketed spelling stays beside the library's class and wins by stylesheet order
    {
      reducedMotion: "no-preference",
      className: "data-[indeterminate]:animate-none",
      animation: "none",
    },
    { reducedMotion: "reduce", className: undefined, animation: "pulse" },
    {
      reducedMotion: "reduce",
      className: "data-indeterminate:animate-bounce",
      animation: "bounce",
    },
    {
      reducedMotion: "reduce",
      className: "data-indeterminate:animate-none",
      animation: "none",
    },
    // Opt-out for apps that stop the pulse with reduced motion
    {
      reducedMotion: "reduce",
      className: "data-indeterminate:motion-reduce:animate-none",
      animation: "none",
    },
  ] as const)(
    "animates as $animation with $reducedMotion and $className",
    async ({ reducedMotion, className, animation }) => {
      await commands.emulateMedia({ reducedMotion });
      expect(getComputedStyle(renderIndeterminate(className)).animationName).toBe(animation);
    },
  );
});

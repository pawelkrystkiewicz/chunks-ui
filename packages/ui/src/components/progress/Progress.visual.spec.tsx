import { render } from "@testing-library/react";
import { afterAll, describe, it } from "vitest";
import { commands } from "vitest/browser";
import { pauseAnimations, renderFixture, SMALL_FEATURE_SCREENSHOT } from "../../VisualTest.utils";
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
    await expect(fixture).toMatchScreenshot(SMALL_FEATURE_SCREENSHOT);
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
    await expect(fixture).toMatchScreenshot(SMALL_FEATURE_SCREENSHOT);
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

const emulateReducedMotion = async (reducedMotion: "reduce" | "no-preference") => {
  await commands.emulateMedia({ reducedMotion });
  await expect
    .poll(() => matchMedia("(prefers-reduced-motion: reduce)").matches)
    .toBe(reducedMotion === "reduce");
};

/*
 * The indeterminate pulse is an essential status indicator, like the Loader spinner, so it
 * keeps running with reduced motion. A `data-[indeterminate]:animate-*` class on the indicator
 * replaces it; an `animate-*` class without that prefix does not.
 */
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
    { reducedMotion: "reduce", className: undefined, animation: "pulse" },
    {
      reducedMotion: "reduce",
      className: "data-[indeterminate]:animate-bounce",
      animation: "bounce",
    },
    {
      reducedMotion: "reduce",
      className: "data-[indeterminate]:animate-none",
      animation: "none",
    },
    // Opt-out for apps that stop the pulse with reduced motion
    {
      reducedMotion: "no-preference",
      className: "data-[indeterminate]:motion-reduce:animate-none",
      animation: "pulse",
    },
    {
      reducedMotion: "reduce",
      className: "data-[indeterminate]:motion-reduce:animate-none",
      animation: "none",
    },
  ] as const)(
    "animates as $animation with $reducedMotion and $className",
    async ({ reducedMotion, className, animation }) => {
      await emulateReducedMotion(reducedMotion);
      expect(getComputedStyle(renderIndeterminate(className)).animationName).toBe(animation);
    },
  );
});

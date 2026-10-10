import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { renderFixture, SMALL_FEATURE_SCREENSHOT } from "../../VisualTest.utils";
import { Slider } from "./index";

describe("Slider", () => {
  it("single", async () => {
    const { fixture } = await renderFixture(
      <div style={{ width: 200 }}>
        <Slider.Root defaultValue={[40]} min={0} max={100}>
          <Slider.Control>
            <Slider.Track>
              <Slider.Indicator />
              <Slider.Thumb index={0} />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </div>,
    );
    await expect(fixture).toMatchScreenshot(SMALL_FEATURE_SCREENSHOT);
  });

  it("range", async () => {
    const { fixture } = await renderFixture(
      <div style={{ width: 200 }}>
        <Slider.Root defaultValue={[20, 70]} min={0} max={100}>
          <Slider.Control>
            <Slider.Track>
              <Slider.Indicator />
              <Slider.Thumb index={0} />
              <Slider.Thumb index={1} />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </div>,
    );
    await expect(fixture).toMatchScreenshot(SMALL_FEATURE_SCREENSHOT);
  });

  it("disabled", async () => {
    const { fixture } = await renderFixture(
      <div style={{ width: 200 }}>
        <Slider.Root defaultValue={[40]} min={0} max={100} disabled>
          <Slider.Control>
            <Slider.Track>
              <Slider.Indicator />
              <Slider.Thumb index={0} />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </div>,
    );
    await expect(fixture).toMatchScreenshot(SMALL_FEATURE_SCREENSHOT);
  });

  // Keyboard focus lands on the visually hidden range input inside the thumb, so the thumb
  // has to show the ring for it
  it("rings the thumb when tabbed to", async () => {
    const { getByRole, getByText } = await renderFixture(
      <div style={{ width: 200 }}>
        <button type="button">Before</button>
        <Slider.Root defaultValue={[40]} min={0} max={100}>
          <Slider.Control>
            <Slider.Track>
              <Slider.Indicator />
              <Slider.Thumb index={0} aria-label="Volume" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </div>,
    );
    const input = getByRole("slider", { name: "Volume" });
    const thumb = input.parentElement as HTMLElement;
    const ring = () => {
      const { outlineStyle, outlineWidth } = getComputedStyle(thumb);
      return { outlineStyle, outlineWidth };
    };
    expect(ring().outlineStyle).toBe("none");

    getByText("Before").focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(input);
    await expect.poll(ring).toEqual({ outlineStyle: "solid", outlineWidth: "2px" });
  });
});

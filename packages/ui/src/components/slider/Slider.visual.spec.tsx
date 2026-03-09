import { describe, it } from "vitest";
import { renderFixture } from "../../VisualTest.utils";
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
    await expect(fixture).toMatchScreenshot();
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
    await expect(fixture).toMatchScreenshot();
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
    await expect(fixture).toMatchScreenshot();
  });
});

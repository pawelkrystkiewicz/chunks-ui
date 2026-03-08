import { describe, it } from "vitest";
import { ELEMENT_COLOR } from "../../types";
import { renderFixture } from "../../VisualTest.utils";
import { Chip } from "./index";

const colors = ELEMENT_COLOR;

describe("Chip", () => {
  it("color matrix", async () => {
    const { fixture } = await renderFixture(
      <div style={{ display: "flex", gap: 12 }}>
        {colors.map((c) => (
          <Chip key={c} color={c}>
            {c}
          </Chip>
        ))}
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("removable", async () => {
    const { fixture } = await renderFixture(
      <div style={{ display: "flex", gap: 12 }}>
        {colors.map((c) => (
          <Chip key={c} color={c} onRemove={() => {}}>
            {c}
          </Chip>
        ))}
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
  });
});

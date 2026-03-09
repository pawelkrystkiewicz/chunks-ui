import { describe, it } from "vitest";
import { renderFixture } from "../../VisualTest.utils";
import { ScrollArea } from "./index";

describe("ScrollArea", () => {
  it("vertical scroll", async () => {
    const { fixture } = await renderFixture(
      <ScrollArea.Root style={{ height: 120, width: 200 }}>
        <ScrollArea.Viewport>
          <div style={{ height: 300, padding: 8 }}>
            {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
              <div key={String(n)}>Line {n}</div>
            ))}
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical">
          <ScrollArea.Thumb />
        </ScrollArea.Scrollbar>
        <ScrollArea.Corner />
      </ScrollArea.Root>,
    );
    await expect(fixture).toMatchScreenshot();
  });
});

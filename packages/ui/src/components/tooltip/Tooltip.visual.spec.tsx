import { describe, it } from "vitest";
import { renderPage } from "../../VisualTest.utils";
import { Button } from "../button";
import { Tooltip } from "./index";

describe("Tooltip", () => {
  it("open", async () => {
    const body = await renderPage(
      <div style={{ padding: 80, display: "flex", justifyContent: "center" }}>
        <Tooltip.Provider>
          <Tooltip.Root defaultOpen>
            <Tooltip.Trigger render={<Button variant="outlined" />}>Hover me</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup>
                  <Tooltip.Arrow />
                  Tooltip content
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>,
    );
    await expect(body).toMatchScreenshot();
  });
});

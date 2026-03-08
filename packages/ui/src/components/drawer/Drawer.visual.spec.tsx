import { describe, it } from "vitest";
import { renderPage } from "../../VisualTest.utils";
import { Drawer } from "./index";

describe("Drawer", () => {
  it("right", async () => {
    const body = await renderPage(
      <Drawer.Root defaultOpen>
        <Drawer.Portal>
          <Drawer.Backdrop />
          <Drawer.Popup side="right">
            <Drawer.Title>Drawer Title</Drawer.Title>
            <Drawer.Description>Right side drawer content.</Drawer.Description>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    await expect(body).toMatchScreenshot();
  });

  it("left", async () => {
    const body = await renderPage(
      <Drawer.Root defaultOpen>
        <Drawer.Portal>
          <Drawer.Backdrop />
          <Drawer.Popup side="left">
            <Drawer.Title>Left Drawer</Drawer.Title>
            <Drawer.Description>Left side drawer content.</Drawer.Description>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    await expect(body).toMatchScreenshot();
  });

  it("bottom", async () => {
    const body = await renderPage(
      <Drawer.Root defaultOpen>
        <Drawer.Portal>
          <Drawer.Backdrop />
          <Drawer.Popup side="bottom">
            <Drawer.Title>Bottom Drawer</Drawer.Title>
            <Drawer.Description>Bottom drawer content.</Drawer.Description>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    await expect(body).toMatchScreenshot();
  });
});

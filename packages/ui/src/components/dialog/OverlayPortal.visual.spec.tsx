import { DirectionProvider } from "@base-ui/react/direction-provider";
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { overlays } from "../../VisualTest.overlays";
import { type Dir, inlineSpan, waitForStable } from "../../VisualTest.utils";
import { Menu } from "../menu";

// Geometry only, no screenshots. A popup opened from a Dialog or Drawer portals into the
// overlay's portal node, its offset parent: Floating UI places the popup against that box but
// does not watch it, so the box must stay put when the page behind the overlay changes height
// (#664).

afterEach(() => {
  document.documentElement.removeAttribute("dir");
});

describe.each(["ltr", "rtl"] as Dir[])("in %s", (dir) => {
  it.each(["Dialog", "Drawer"] as const)(
    "keeps a Menu opened from a %s at its trigger while the page behind it grows",
    async (name) => {
      // The way an app sets a direction: `dir` on <html>, which portalled popups inherit
      document.documentElement.dir = dir;
      const Overlay = overlays[name];
      render(
        <DirectionProvider direction={dir}>
          <div data-testid="page content" />
          <Overlay name={name} defaultOpen>
            <Menu.Root>
              <Menu.Trigger>Actions</Menu.Trigger>
              <Menu.Content align="start">
                <Menu.Item>Move to another folder</Menu.Item>
              </Menu.Content>
            </Menu.Root>
          </Overlay>
        </DirectionProvider>,
      );
      const trigger = page.getByRole("button", { name: "Actions" });
      await trigger.click();
      const menu = page.getByRole("menu");
      await expect.element(menu).toBeVisible();
      // Where the menu sits against its trigger: the gap below it, and how far its inline start is
      // past the trigger's
      const offset = () => {
        const triggerBox = trigger.element().getBoundingClientRect();
        return {
          below: menu.element().getBoundingClientRect().top - triggerBox.bottom,
          start: inlineSpan(menu.element(), dir).start - inlineSpan(trigger.element(), dir).start,
        };
      };
      const before = await waitForStable(offset);
      // At its trigger: below it by the side offset, aligned to its inline start
      expect(before).toEqual({ below: expect.closeTo(8, 0), start: expect.closeTo(0, 0) });
      // As wide as its label: a portal box with no width would leave the menu no room to grow
      // into, and the label would wrap
      const label = document.createRange();
      label.selectNodeContents(page.getByRole("menuitem").element());
      expect(label.getClientRects()).toHaveLength(1);

      // Content before the overlay's portal node in the document grows, as a list that loads does.
      // The portal node must come after it, or the check proves nothing
      const content = page.getByTestId("page content").element();
      const portalNode = trigger.element().closest("[data-base-ui-portal]")!;
      expect(content.compareDocumentPosition(portalNode)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      content.style.height = "20px";
      expect(await waitForStable(offset)).toEqual({
        below: expect.closeTo(before.below, 0),
        start: expect.closeTo(before.start, 0),
      });
    },
  );
});

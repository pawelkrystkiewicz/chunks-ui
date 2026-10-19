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
// (#664) or scrolls.

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  scrollTo(0, 0);
});

/**
 * Where the menu sits against its trigger: the gap below it, and how far its inline start is
 * past the trigger's
 */
type Offset = { below: number; start: number };

/** Within half a pixel of `offset` */
const near = ({ below, start }: Offset) => ({
  below: expect.closeTo(below, 0),
  start: expect.closeTo(start, 0),
});

/**
 * Renders the page's content, with room below it to scroll, and scrolls the page by `scroll`
 * px; then opens a Dialog or Drawer, and a Menu from it. Returns the content, the menu's offset
 * from its trigger, and that offset once the menu is still.
 */
async function openMenu(name: keyof typeof overlays, dir: Dir, scroll = 0) {
  render(
    <>
      <div data-testid="page content" />
      <div style={{ height: "200vh" }} />
    </>,
  );
  scrollTo(0, scroll);
  // The way an app sets a direction: `dir` on <html>, which portalled popups inherit
  document.documentElement.dir = dir;
  const Overlay = overlays[name];
  render(
    <DirectionProvider direction={dir}>
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
  const content = page.getByTestId("page content").element();
  // The menu is placed against the overlay's portal node, which comes after the content, on the
  // page scrolled as asked, or the checks prove nothing
  const portalNode = trigger.element().closest("[data-base-ui-portal]");
  expect(menu.element().parentElement?.offsetParent).toBe(portalNode);
  expect(content.compareDocumentPosition(portalNode!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  expect(scrollY).toBe(scroll);

  const offset = (): Offset => {
    const triggerBox = trigger.element().getBoundingClientRect();
    return {
      below: menu.element().getBoundingClientRect().top - triggerBox.bottom,
      start: inlineSpan(menu.element(), dir).start - inlineSpan(trigger.element(), dir).start,
    };
  };
  const at = await waitForStable(offset);
  // At its trigger: below it by the side offset, aligned to its inline start
  expect(at).toEqual(near({ below: 8, start: 0 }));
  // As wide as its label: a portal box with no width would leave the menu no room to grow
  // into, and the label would wrap
  const label = document.createRange();
  label.selectNodeContents(page.getByRole("menuitem").element());
  expect(label.getClientRects()).toHaveLength(1);
  return { content, offset, at };
}

describe.each(["ltr", "rtl"] as Dir[])("in %s", (dir) => {
  it.each([
    ["Dialog", "the page", 0],
    ["Drawer", "the page", 0],
    ["Dialog", "a page scrolled by 300px", 300],
    ["Drawer", "a page scrolled by 300px", 300],
  ] as const)(
    "keeps a Menu opened from a %s at its trigger while %s grows behind it",
    async (name, _page, scroll) => {
      const { content, offset, at } = await openMenu(name, dir, scroll);
      // Content before the overlay's portal node in the document grows, as a list that loads does
      content.style.height = "20px";
      expect(await waitForStable(offset)).toEqual(near(at));
    },
  );

  // The user scrolls the page behind a non-modal overlay, or the app's code behind a modal one
  it.each(["Dialog", "Drawer"] as const)(
    "keeps a Menu opened from a %s at its trigger when the page scrolls, before Floating UI hears of it",
    async (name) => {
      const { offset, at } = await openMenu(name, dir);
      scrollTo(0, 100);
      expect(scrollY).toBe(100);
      // Read in the task of the scroll: Floating UI hears of it at the next frame, so a box that
      // scrolls with the page carries the menu off its trigger until then
      expect(offset()).toEqual(near(at));
    },
  );
});

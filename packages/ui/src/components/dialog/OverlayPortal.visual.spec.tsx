import { DirectionProvider } from "@base-ui/react/direction-provider";
import { render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { page } from "vitest/browser";
import { overlays } from "../../VisualTest.overlays";
import { type Dir, inlineSpan, waitForStable } from "../../VisualTest.utils";
import { Menu } from "../menu";

// Geometry only, no screenshots: a popup opened from a Dialog or Drawer stays at its trigger when
// the page behind the overlay changes height (#664) or scrolls.

afterEach(() => {
  document.documentElement.removeAttribute("dir");
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
 * Renders the page's content, with room below it to scroll, and scrolls the page by 300px, so
 * the menu opens on a scrolled page; then opens a Dialog or Drawer, and a Menu from it. Returns
 * the content, the menu's offset from its trigger, and that offset once the menu is still.
 */
async function openMenu(name: keyof typeof overlays, dir: Dir) {
  render(
    <>
      <div data-testid="page content" />
      <div style={{ height: "200vh" }} />
    </>,
  );
  scrollTo(0, 300);
  const Overlay = overlays[name];
  const ui = (
    <Overlay name={name} defaultOpen>
      <Menu.Root>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Content align="start">
          <Menu.Item>Move to another folder</Menu.Item>
        </Menu.Content>
      </Menu.Root>
    </Overlay>
  );
  if (dir === "rtl") {
    // The way an app sets a direction: `dir` on <html>, which portalled popups inherit
    document.documentElement.dir = dir;
    render(<DirectionProvider direction={dir}>{ui}</DirectionProvider>);
  } else {
    render(ui);
  }
  const trigger = page.getByRole("button", { name: "Actions" });
  await trigger.click();
  const menu = page.getByRole("menu");
  await expect.element(menu).toBeVisible();
  const content = page.getByTestId("page content").element();
  // The menu is placed against the overlay's portal node, which comes after the content, on the
  // scrolled page, or the checks prove nothing
  const portalNode = trigger.element().closest("[data-base-ui-portal]");
  expect(menu.element().parentElement?.offsetParent).toBe(portalNode);
  expect(content.compareDocumentPosition(portalNode!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  expect(scrollY).toBe(300);

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

it.each([
  ["Dialog", "ltr"],
  ["Drawer", "ltr"],
  // A smoke check of the direction: nothing here runs along the inline axis
  ["Dialog", "rtl"],
] as const)(
  "keeps a Menu opened from a %s (%s) at its trigger as the page scrolls and grows (#664)",
  async (name, dir) => {
    const { content, offset, at } = await openMenu(name, dir);
    // The user scrolls the page behind a non-modal overlay, or the app's code behind a modal one.
    // Read in the task of the scroll: Floating UI hears of it at the next frame, so a box that
    // scrolls with the page carries the menu off its trigger until then
    scrollTo(0, 400);
    expect(scrollY).toBe(400);
    expect(offset()).toEqual(near(at));
    // Content before the overlay's portal node in the document grows, as a list that loads does:
    // read in its task too, as the menu can be placed again later, after a frame showed it off
    content.style.height = "20px";
    expect(offset()).toEqual(near(at));
    expect(await waitForStable(offset)).toEqual(near(at));
  },
);

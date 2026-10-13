import { render } from "@testing-library/react";
import type { CSSProperties, ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { Menu } from "./components/menu";
import { Popover } from "./components/popover";
import {
  expectNoOverflow,
  overflowPast,
  renderFixture,
  renderPage,
  withViewport,
} from "./VisualTest.utils";

/** A 100 × 50 box, off the page's origin, with `children` inside */
function box(children: ReactNode, style?: CSSProperties) {
  const { getByTestId, unmount } = render(
    <div
      data-testid="box"
      style={{ position: "relative", margin: 100, width: 100, height: 50, ...style }}
    >
      {children}
    </div>,
  );
  const overflow = overflowPast(getByTestId("box"));
  unmount();
  return overflow;
}

const none = { top: 0, right: 0, bottom: 0, left: 0 };

describe("overflowPast", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("dir");
  });

  it("reports nothing for content that fits", () => {
    expect(box(<div style={{ width: 100, height: 50 }} />)).toEqual(none);
  });

  it("reports positioned content past the right and bottom edges", () => {
    const sizes = { position: "absolute", width: 20, height: 20 } as const;
    expect(box(<div style={{ ...sizes, right: -30, top: 0 }} />)).toEqual({ ...none, right: 30 });
    expect(box(<div style={{ ...sizes, bottom: -30, left: 0 }} />)).toEqual({
      ...none,
      bottom: 30,
    });
    expect(
      box(<div style={{ ...sizes, position: "fixed", top: 200, left: 400 }} />).right,
    ).toBeGreaterThan(0);
  });

  it("reports left overflow as left and right overflow as right on an RTL page", () => {
    document.documentElement.dir = "rtl";
    expect(box(<div style={{ width: 160, height: 10 }} />)).toEqual({ ...none, left: 60 });
    expect(box(<div style={{ width: 20, height: 10, transform: "translateX(30px)" }} />)).toEqual({
      ...none,
      right: 30,
    });
  });

  it("reports RTL text spilling past the left edge", () => {
    document.documentElement.dir = "rtl";
    const { left, right } = box(
      <span style={{ whiteSpace: "nowrap" }}>{"a long line of text ".repeat(4)}</span>,
    );
    expect(left).toBeGreaterThan(0);
    expect(right).toBe(0);
  });

  it("ignores a 1px visually hidden element away from the fixture", () => {
    expect(
      box(
        <span
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: 1,
            height: 1,
            clipPath: "inset(50%)",
          }}
        />,
      ),
    ).toEqual(none);
  });

  it("reports a box thin in one dimension that spills past the edge", () => {
    expect(
      box(<div style={{ position: "absolute", top: 0, left: 0, width: 300, height: 1 }} />),
    ).toEqual({
      ...none,
      right: 200,
    });
    expect(
      box(<div style={{ position: "absolute", top: 0, left: 0, width: 1, height: 300 }} />),
    ).toEqual({
      ...none,
      bottom: 250,
    });
  });

  it("reports content under a display: contents wrapper", () => {
    expect(
      box(
        <div style={{ display: "contents" }}>
          <div style={{ width: 160, height: 10 }} />
        </div>,
      ),
    ).toEqual({ ...none, right: 60 });
  });

  it("counts a popup the box's content portals to <body>", async () => {
    const { getByTestId } = render(
      <div data-testid="box" style={{ margin: 100, width: 200, height: 50 }}>
        <Popover.Root defaultOpen>
          <Popover.Trigger>Open</Popover.Trigger>
          <Popover.Content>
            <div style={{ height: 100 }}>Below the box</div>
          </Popover.Content>
        </Popover.Root>
      </div>,
    );
    const below = page.getByText("Below the box");
    await expect.element(below).toBeVisible();
    // Floating UI has positioned the popup once it left the page's top left
    await expect.poll(() => below.element().getBoundingClientRect().top).toBeGreaterThan(100);
    expect(overflowPast(getByTestId("box")).bottom).toBeGreaterThan(0);
  });

  // The portal's <div> spans <body> at no height, and a modal menu lays a transparent inert
  // backdrop over the whole page: neither paints anything a screenshot crops
  it("counts neither a portal's own box nor a modal popup's inert backdrop", async () => {
    const { getByTestId } = render(
      <>
        <div data-testid="box" style={{ height: 300 }}>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Options</Menu.Trigger>
            <Menu.Content>
              <Menu.Item>Edit</Menu.Item>
            </Menu.Content>
          </Menu.Root>
        </div>
        {/* Pushes the portal's <div> (the last child of <body>) below the box's bottom edge */}
        <div style={{ height: 200 }} />
      </>,
    );
    await expect.element(page.getByRole("menuitem", { name: "Edit" })).toBeVisible();
    expect(document.querySelector("[data-base-ui-portal] [data-base-ui-inert]")).not.toBeNull();
    expect(overflowPast(getByTestId("box"))).toEqual(none);
  });

  // Floating UI portals a nested popup into its parent's portal <div>, so the walk of the parent
  // reaches the nested portal's own <div> (it spans <body> at no height) as an ordinary child
  it("does not count the own box of a portal nested in another portal", async () => {
    const { getByTestId } = render(
      <>
        <div data-testid="box" style={{ height: 400 }}>
          <Popover.Root defaultOpen>
            <Popover.Trigger>Open</Popover.Trigger>
            <Popover.Content>
              <Popover.Root defaultOpen>
                <Popover.Trigger>Nested</Popover.Trigger>
                <Popover.Content>Nested popup</Popover.Content>
              </Popover.Root>
            </Popover.Content>
          </Popover.Root>
        </div>
        {/* Pushes the portals' <div>s below the box's bottom edge */}
        <div style={{ height: 300 }} />
      </>,
    );
    const nested = page.getByText("Nested popup");
    await expect.element(nested).toBeVisible();
    await expect.poll(() => nested.element().getBoundingClientRect().top).toBeGreaterThan(0);
    const nestedPortal = nested.element().closest("[data-base-ui-portal]");
    expect(nestedPortal?.parentElement?.closest("[data-base-ui-portal]")).not.toBeNull();
    expect(overflowPast(getByTestId("box"))).toEqual(none);
  });

  // An author's own role="presentation" element (a layout table) that Base UI marks inert behind a
  // modal is page content, unlike the empty backdrop
  it("counts a role=presentation element with content that Base UI marks inert", () => {
    const { getByTestId } = render(
      <div data-testid="box" style={{ margin: 100, width: 100, height: 50 }}>
        <div role="presentation" data-base-ui-inert="" data-testid="layout">
          <div style={{ width: 160, height: 10 }} />
        </div>
        <div role="presentation" data-base-ui-inert="" data-testid="backdrop" />
      </div>,
    );
    expect(overflowPast(getByTestId("box"))).toEqual({ ...none, right: 60 });
  });

  it("does not measure the popup around the element it checks", async () => {
    render(
      <Popover.Root defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <div data-testid="inside" style={{ width: 60, height: 20 }} />
        </Popover.Content>
      </Popover.Root>,
    );
    const inside = page.getByTestId("inside");
    await expect.element(inside).toBeVisible();
    await expect.poll(() => inside.element().getBoundingClientRect().top).toBeGreaterThan(0);
    const portal = inside.element().closest("[data-base-ui-portal]");
    expect(portal).not.toBeNull();
    // The popup's own boxes are bigger than the element, but they are not content past it
    expect(overflowPast(inside.element())).toEqual(none);
    expect(() => expectNoOverflow(inside.element())).not.toThrow();
  });

  it("does not count content inside an overflow: auto or hidden box, but counts the box", () => {
    for (const overflow of ["auto", "hidden"]) {
      expect(
        box(
          <div style={{ width: 100, height: 50, overflow }}>
            <div style={{ width: 500, height: 10 }} />
          </div>,
        ),
      ).toEqual(none);
      expect(
        box(
          <div style={{ width: 160, height: 50, overflow }}>
            <div style={{ width: 500, height: 10 }} />
          </div>,
        ),
      ).toEqual({ ...none, right: 60 });
    }
  });
});

describe("toMatchScreenshot", () => {
  const cropped = "content past the screenshotted element, which a screenshot crops";

  it("fails when the fixture's content grows past it after the render", async () => {
    const { fixture, getByTestId } = await renderFixture(
      <div data-testid="panel" style={{ width: 100, height: 20 }} />,
    );
    getByTestId("panel").style.minWidth = "600px";
    await expect(expect(fixture).toMatchScreenshot()).rejects.toThrow(cropped);
  });

  it("passes when a fixture rendered with allowOverflow grows past itself", async () => {
    const { fixture, getByTestId } = await renderFixture(
      <div data-testid="panel" style={{ width: 100, height: 20 }} />,
      { allowOverflow: true },
    );
    getByTestId("panel").style.minWidth = "600px";
    expect(overflowPast(fixture).right).toBeGreaterThan(0);
    expect(() => expectNoOverflow(fixture)).not.toThrow();
  });

  it("fails when a popup opened on the page reaches past it", async () => {
    const body = await renderPage(
      <Popover.Root>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <div style={{ width: 600 }}>Wider than the page</div>
        </Popover.Content>
      </Popover.Root>,
    );
    await userEvent.click(page.getByRole("button", { name: "Open" }));
    await expect.element(page.getByText("Wider than the page")).toBeVisible();
    await expect(expect(body).toMatchScreenshot()).rejects.toThrow(cropped);
  });

  // The popup portals to <body>, outside the fixture, and opens below the trigger, past the
  // fixture's bottom edge
  it("fails when a popup the fixture opens reaches past the fixture", async () => {
    const { fixture } = await renderFixture(
      <Popover.Root>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <div style={{ height: 100 }}>Below the fixture</div>
        </Popover.Content>
      </Popover.Root>,
    );
    await userEvent.click(page.getByRole("button", { name: "Open" }));
    const popup = page.getByText("Below the fixture");
    await expect.element(popup).toBeVisible();
    expect(fixture.contains(popup.element())).toBe(false);
    await expect(expect(fixture).toMatchScreenshot()).rejects.toThrow(cropped);
  });

  it("waits for a locator's element that renders after the call, then checks it", async () => {
    const late = page.getByTestId("late");
    expect(late.query()).toBeNull();
    const screenshot = expect(late).toMatchScreenshot();
    // 200px of content in a 100px box: the overflow check, not a missing element, fails the call
    render(
      <div data-testid="late" style={{ width: 100 }}>
        <div style={{ width: 300, height: 10 }} />
      </div>,
    );
    await expect(screenshot).rejects.toThrow(cropped);
  });

  it("fails at once with Vitest's own error for a nullish target", async () => {
    const start = performance.now();
    await expect(expect(null).toMatchScreenshot()).rejects.toThrow(
      "Expected element or locator to be defined",
    );
    // Before an expect.element poll would give up (1s by default)
    expect(performance.now() - start).toBeLessThan(1000);
  });
});

/** Width and height in px of a screenshot of the test page */
async function screenshotSize() {
  const image = new Image();
  image.src = `data:image/png;base64,${await page.screenshot({ save: false })}`;
  await image.decode();
  return { width: image.naturalWidth, height: image.naturalHeight };
}

describe("withViewport", () => {
  it("rejects a page wider or taller than the runner window", () => {
    const message = /raise RUNNER_WINDOW in vitest\.visual\.config\.ts/;
    expect(() => withViewport(2000)).toThrow(message);
    expect(() => withViewport(500, 5000)).toThrow(message);
  });
});

describe("a screenshot of the page", () => {
  it("has one px per CSS px on the default 414 × 896 page", async () => {
    expect(await screenshotSize()).toEqual({ width: 414, height: 896 });
  });

  describe("set wider by withViewport", () => {
    withViewport(1000);

    it("has one px per CSS px too", async () => {
      expect(await screenshotSize()).toEqual({ width: 1000, height: 896 });
    });
  });
});

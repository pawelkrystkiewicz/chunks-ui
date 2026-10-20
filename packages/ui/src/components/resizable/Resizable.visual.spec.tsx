import { cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { describeDirs, renderFixture, withViewport } from "../../VisualTest.utils";
import { Resizable } from "./index";

const box = "overflow-hidden rounded-md border border-border";
const pane = "bg-muted";

/** A panel's width or height in CSS px, as laid out */
const sized = (el: HTMLElement, axis: "width" | "height" = "width") =>
  el.getBoundingClientRect()[axis];

afterEach(() => {
  cleanup();
  document.body.removeAttribute("style");
});

function Horizontal(props: Partial<React.ComponentProps<typeof Resizable.Group>>) {
  return (
    <div style={{ width: 400, height: 160, flex: "none" }}>
      <Resizable.Group className={box} aria-label="Split" {...props}>
        <Resizable.Panel id="side" className={pane} defaultSize="30%" minSize="20%" maxSize="50%">
          <div className="p-3 text-sm">Side</div>
        </Resizable.Panel>
        <Resizable.Handle data-testid="handle" aria-label="Resize side" />
        <Resizable.Panel id="main">
          <div className="p-3 text-sm">Main</div>
        </Resizable.Panel>
      </Resizable.Group>
    </div>
  );
}

const side = () => document.getElementById("side") as HTMLElement;
const main = () => document.getElementById("main") as HTMLElement;
const HANDLE = '[data-testid="handle"]';

describe("Resizable", () => {
  withViewport(700);

  it("horizontal", async () => {
    const { fixture } = await renderFixture(<Horizontal />);
    await expect(fixture).toMatchScreenshot();
  });

  it("vertical", async () => {
    const { fixture } = await renderFixture(
      <div style={{ width: 240, height: 200, flex: "none" }}>
        <Resizable.Group orientation="vertical" className={box} aria-label="Split">
          <Resizable.Panel id="top" className={pane} defaultSize="40%">
            <div className="p-3 text-sm">Top</div>
          </Resizable.Panel>
          <Resizable.Handle aria-label="Resize top" />
          <Resizable.Panel id="bottom">
            <div className="p-3 text-sm">Bottom</div>
          </Resizable.Panel>
        </Resizable.Group>
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("three panes mixing px and %", async () => {
    const { fixture } = await renderFixture(
      <div style={{ width: 480, height: 120, flex: "none" }}>
        <Resizable.Group className={box} aria-label="Layout">
          <Resizable.Panel id="nav" className={pane} defaultSize={120} minSize={80}>
            <div className="p-3 text-sm">Nav 120px</div>
          </Resizable.Panel>
          <Resizable.Handle aria-label="Resize nav" />
          <Resizable.Panel id="list" defaultSize="60%">
            <div className="p-3 text-sm">List 60%</div>
          </Resizable.Panel>
          <Resizable.Handle aria-label="Resize list" />
          <Resizable.Panel id="detail" className={pane} defaultSize="40%">
            <div className="p-3 text-sm">Detail 40%</div>
          </Resizable.Panel>
        </Resizable.Group>
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("nested", async () => {
    const { fixture } = await renderFixture(
      <div style={{ width: 400, height: 200, flex: "none" }}>
        <Resizable.Group className={box} aria-label="Outer">
          <Resizable.Panel id="left" className={pane} defaultSize="35%">
            <div className="p-3 text-sm">Left</div>
          </Resizable.Panel>
          <Resizable.Handle aria-label="Resize left" />
          <Resizable.Panel id="right" defaultSize="65%">
            <Resizable.Group orientation="vertical" aria-label="Inner">
              <Resizable.Panel id="top" defaultSize="50%">
                <div className="p-3 text-sm">Top</div>
              </Resizable.Panel>
              <Resizable.Handle aria-label="Resize top" />
              <Resizable.Panel id="bottom" className={pane} defaultSize="50%">
                <div className="p-3 text-sm">Bottom</div>
              </Resizable.Panel>
            </Resizable.Group>
          </Resizable.Panel>
        </Resizable.Group>
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("disabled handle", async () => {
    const { fixture } = await renderFixture(
      <div style={{ width: 400, height: 100, flex: "none" }}>
        <Resizable.Group className={box} aria-label="Split">
          <Resizable.Panel id="side" className={pane} defaultSize="50%">
            <div className="p-3 text-sm">Side</div>
          </Resizable.Panel>
          <Resizable.Handle disabled aria-label="Resize side" />
          <Resizable.Panel id="main">Main</Resizable.Panel>
        </Resizable.Group>
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
    const handle = fixture.querySelector("[role=separator]") as HTMLElement;
    expect(getComputedStyle(handle).cursor).toBe("not-allowed");
  });

  it("handle with keyboard focus", async () => {
    const { fixture } = await renderFixture(<Horizontal />);
    await userEvent.tab();
    expect(document.activeElement).toBe(fixture.querySelector("[role=separator]"));
    await expect(fixture).toMatchScreenshot();
  });

  it("handle while dragging", async () => {
    const { fixture } = await renderFixture(<Horizontal />);
    await commands.pointerDown(HANDLE);
    await commands.pointerMoveBy(40, 0, 4);
    await expect(fixture).toMatchScreenshot();
    await commands.pointerUp();
  });
});

describe("Resizable layout in the browser", () => {
  withViewport(700);

  it("fills the group, border and handle included", async () => {
    await renderFixture(<Horizontal />);
    const group = document.querySelector("[role=group]") as HTMLElement;
    const handle = document.querySelector(HANDLE) as HTMLElement;
    // 400 wide, 1px border each side, 1px handle: 397px shared 30 / 70
    const available = 400 - 2 - sized(handle);
    expect(sized(side())).toBeCloseTo(available * 0.3, 1);
    expect(sized(side()) + sized(main()) + sized(handle) + 2).toBeCloseTo(sized(group), 1);
    expect(handle).toHaveAttribute("aria-valuenow", "30");
  });

  it("keeps a px panel at its size and gives the rest to the % panels", async () => {
    await renderFixture(
      <div style={{ width: 480, height: 80, flex: "none" }}>
        <Resizable.Group aria-label="Layout">
          <Resizable.Panel id="side" defaultSize={120}>
            <div className="p-3 text-sm">Nav</div>
          </Resizable.Panel>
          <Resizable.Handle aria-label="r1" />
          <Resizable.Panel id="main" defaultSize="75%">
            <div className="p-3 text-sm">A</div>
          </Resizable.Panel>
          <Resizable.Handle aria-label="r2" />
          <Resizable.Panel defaultSize="25%" id="c">
            <div className="p-3 text-sm">B</div>
          </Resizable.Panel>
        </Resizable.Group>
      </div>,
    );
    expect(sized(side())).toBe(120);
    const rest = 480 - 120 - 2;
    expect(sized(main())).toBeCloseTo(rest * 0.75, 1);
  });

  it("shrinks a px panel that is larger than the group", async () => {
    await renderFixture(
      <div style={{ width: 200, height: 80, flex: "none" }}>
        <Resizable.Group aria-label="Layout">
          <Resizable.Panel id="side" defaultSize={500}>
            <div className="p-3 text-sm">Nav</div>
          </Resizable.Panel>
          <Resizable.Handle aria-label="r1" />
          <Resizable.Panel id="main">A</Resizable.Panel>
        </Resizable.Group>
      </div>,
    );
    await expect.poll(() => sized(side())).toBeLessThanOrEqual(200);
  });
});

describeDirs("Resizable drag (%s)", (dir) => {
  withViewport(700);

  /** A pointer moving toward the inline end grows the first panel in LTR, shrinks it in RTL */
  const toward = dir === "rtl" ? -1 : 1;

  it("puts the first panel at the inline start", async () => {
    const { fixture } = await renderFixture(<Horizontal />);
    const first = side().getBoundingClientRect();
    const group = (document.querySelector("[role=group]") as HTMLElement).getBoundingClientRect();
    if (dir === "rtl") expect(first.right).toBeCloseTo(group.right - 1, 0);
    else expect(first.left).toBeCloseTo(group.left + 1, 0);
    await expect(fixture).toMatchScreenshot();
  });

  it("moves the handle with the pointer and reports the layout once, on release", async () => {
    const onLayoutChange = vi.fn();
    await renderFixture(<Horizontal onLayoutChange={onLayoutChange} />);
    const before = sized(side());
    const handle = document.querySelector(HANDLE) as HTMLElement;

    await commands.pointerDown(HANDLE);
    expect(handle).toHaveAttribute("data-dragging");
    expect(document.body.style.userSelect).toBe("none");
    await commands.pointerMoveBy(20 * toward, 0, 4);
    await commands.pointerMoveBy(20 * toward, 0, 4);

    expect(sized(side()) - before).toBeCloseTo(40, 0);
    expect(handle).toHaveAttribute("aria-valuenow", expect.stringMatching(/^4[0-9.]+$/));
    expect(onLayoutChange).not.toHaveBeenCalled();

    await commands.pointerUp();
    expect(onLayoutChange).toHaveBeenCalledTimes(1);
    const layout = onLayoutChange.mock.calls[0]?.[0] as Record<string, number>;
    expect(layout.side).toBeCloseTo((sized(side()) / (sized(side()) + sized(main()))) * 100, 1);
    expect(layout.side! + layout.main!).toBeCloseTo(100, 1);
    expect(handle).not.toHaveAttribute("data-dragging");
    expect(document.body.style.userSelect).toBe("");
    expect(sized(side()) - before).toBeCloseTo(40, 0);
  });

  it("grows toward the pointer in a vertical group", async () => {
    const onLayoutChange = vi.fn();
    await renderFixture(
      <div style={{ width: 240, height: 200, flex: "none" }}>
        <Resizable.Group orientation="vertical" aria-label="Split" onLayoutChange={onLayoutChange}>
          <Resizable.Panel id="top" defaultSize="40%" minSize="10%">
            <div className="p-3 text-sm">Top</div>
          </Resizable.Panel>
          <Resizable.Handle data-testid="handle" aria-label="Resize top" />
          <Resizable.Panel id="bottom">Bottom</Resizable.Panel>
        </Resizable.Group>
      </div>,
    );
    const top = document.getElementById("top") as HTMLElement;
    const before = sized(top, "height");
    await commands.pointerDown(HANDLE);
    await commands.pointerMoveBy(0, 30, 3);
    await commands.pointerUp();
    expect(sized(top, "height") - before).toBeCloseTo(30, 0);
    expect(onLayoutChange).toHaveBeenCalledTimes(1);
  });

  it("stops at the min and max of the panels", async () => {
    const onLayoutChange = vi.fn();
    await renderFixture(<Horizontal onLayoutChange={onLayoutChange} />);
    const available = 400 - 2 - 1;

    await commands.pointerDown(HANDLE);
    await commands.pointerMoveBy(500 * toward, 0, 5);
    expect(sized(side())).toBeCloseTo(available * 0.5, 1);
    await commands.pointerMoveBy(-900 * toward, 0, 5);
    expect(sized(side())).toBeCloseTo(available * 0.2, 1);
    await commands.pointerUp();
    expect(onLayoutChange).toHaveBeenCalledTimes(1);
    expect(onLayoutChange.mock.calls[0]?.[0].side).toBeCloseTo(20, 1);
  });

  it("moves a px panel by whole pixels and leaves the other handle's panels alone", async () => {
    const onLayoutChange = vi.fn();
    await renderFixture(
      <div style={{ width: 480, height: 80, flex: "none" }}>
        <Resizable.Group aria-label="Layout" onLayoutChange={onLayoutChange}>
          <Resizable.Panel id="nav" defaultSize={120} minSize={80}>
            <div className="p-3 text-sm">Nav</div>
          </Resizable.Panel>
          <Resizable.Handle data-testid="handle" aria-label="r1" />
          <Resizable.Panel id="list" defaultSize="50%">
            <div className="p-3 text-sm">List</div>
          </Resizable.Panel>
          <Resizable.Handle aria-label="r2" />
          <Resizable.Panel id="detail" defaultSize="50%">
            <div className="p-3 text-sm">Detail</div>
          </Resizable.Panel>
        </Resizable.Group>
      </div>,
    );
    const detail = document.getElementById("detail") as HTMLElement;
    const detailBefore = sized(detail);
    await commands.pointerDown(HANDLE);
    await commands.pointerMoveBy(50 * toward, 0, 5);
    await commands.pointerUp();
    expect(sized(document.getElementById("nav") as HTMLElement)).toBeCloseTo(170, 1);
    expect(sized(detail)).toBeCloseTo(detailBefore, 1);
    expect(onLayoutChange.mock.calls[0]?.[0].nav).toBeCloseTo(170, 1);
  });
});

describe("Resizable pointer handling", () => {
  withViewport(700);

  it("starts a drag from the hit area beside the line", async () => {
    await renderFixture(<Horizontal />);
    const handle = document.querySelector(HANDLE) as HTMLElement;
    expect(getComputedStyle(handle).touchAction).toBe("none");
    expect(Number.parseFloat(getComputedStyle(handle, "::after").width)).toBeGreaterThanOrEqual(12);
    const before = sized(side());
    await commands.pointerDown(HANDLE, 4, 0);
    await commands.pointerMoveBy(30, 0, 3);
    await commands.pointerUp();
    expect(sized(side()) - before).toBeCloseTo(30, 0);
  });

  it("undoes the drag on pointercancel", async () => {
    const onLayoutChange = vi.fn();
    await renderFixture(<Horizontal onLayoutChange={onLayoutChange} />);
    const handle = document.querySelector(HANDLE) as HTMLElement;
    const before = sized(side());
    await commands.pointerDown(HANDLE);
    await commands.pointerMoveBy(60, 0, 3);
    expect(sized(side()) - before).toBeCloseTo(60, 0);
    // Chromium's mouse is pointer 1
    handle.dispatchEvent(new PointerEvent("pointercancel", { pointerId: 1, bubbles: true }));
    await commands.pointerUp();
    expect(sized(side())).toBeCloseTo(before, 1);
    expect(handle).toHaveAttribute("aria-valuenow", "30");
    expect(handle).not.toHaveAttribute("data-dragging");
    expect(document.body.style.userSelect).toBe("");
    expect(onLayoutChange).not.toHaveBeenCalled();
  });

  it("lets go of the page when it unmounts mid-drag", async () => {
    await renderFixture(<Horizontal />);
    await commands.pointerDown(HANDLE);
    await commands.pointerMoveBy(30, 0, 3);
    expect(document.body.style.userSelect).toBe("none");
    cleanup();
    expect(document.body.style.userSelect).toBe("");
    await commands.pointerUp();
  });

  it("resizes by key in the browser too", async () => {
    const onLayoutChange = vi.fn();
    await renderFixture(<Horizontal onLayoutChange={onLayoutChange} />);
    const before = sized(side());
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    expect(sized(side()) - before).toBeCloseTo(3.97, 1);
    expect(onLayoutChange).toHaveBeenCalledTimes(1);
  });

  it("keeps a % panel at its px min when the group shrinks", async () => {
    await renderFixture(
      <div id="box" style={{ width: 600, height: 80, flex: "none" }}>
        <Resizable.Group aria-label="Layout">
          <Resizable.Panel id="side" defaultSize="30%" minSize={150}>
            <div className="p-3 text-sm">Side</div>
          </Resizable.Panel>
          <Resizable.Handle aria-label="r1" />
          <Resizable.Panel id="main">Main</Resizable.Panel>
        </Resizable.Group>
      </div>,
    );
    expect(sized(side())).toBeCloseTo(179.7, 0);
    (document.getElementById("box") as HTMLElement).style.width = "300px";
    await expect.poll(() => sized(side())).toBeCloseTo(150, 0);
    (document.getElementById("box") as HTMLElement).style.width = "600px";
    await expect.poll(() => sized(side())).toBeCloseTo(179.7, 0);
  });
});

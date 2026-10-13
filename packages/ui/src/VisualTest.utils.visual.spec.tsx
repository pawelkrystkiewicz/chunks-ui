import { render } from "@testing-library/react";
import type { CSSProperties, ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { overflowPast, withViewport } from "./VisualTest.utils";

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

/** Width and height in px of a screenshot of the test page */
async function screenshotSize() {
  const image = new Image();
  image.src = `data:image/png;base64,${await page.screenshot({ save: false })}`;
  await image.decode();
  return { width: image.naturalWidth, height: image.naturalHeight };
}

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

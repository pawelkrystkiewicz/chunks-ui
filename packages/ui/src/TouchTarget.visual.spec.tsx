import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { ClearButton } from "./components/clear-button";

/*
 * `touch-target` (theme.css) grows an element's hit area to at least 44×44px, centred on it,
 * and leaves its size and layout alone. These specs press the real mouse at points around the
 * element: jsdom has no layout and no hit testing. No screenshots are taken.
 */

/** The smallest hit area, in CSS px, on each axis */
const MIN_AREA = 44;
/** How far inside or outside an edge of the hit area a press lands, so rounding can't flip it */
const MARGIN = 2;

function renderStage(children: ReactNode) {
  const result = render(
    <div
      data-testid="stage"
      style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}
    >
      {children}
    </div>,
  );
  return { ...result, stage: result.getByTestId("stage") };
}

/** Presses the mouse at viewport point (x, y), inside `stage`, and returns the element it hit */
async function pressAt(stage: HTMLElement, x: number, y: number) {
  const { left, top } = stage.getBoundingClientRect();
  const hits: (EventTarget | null)[] = [];
  const record = (event: PointerEvent) => hits.push(event.target);
  document.addEventListener("pointerdown", record, { capture: true });
  try {
    await userEvent.click(stage, { position: { x: x - left, y: y - top } });
  } finally {
    document.removeEventListener("pointerdown", record, { capture: true });
  }
  return hits[0];
}

const centreOf = (element: Element) => {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { x: left + width / 2, y: top + height / 2 };
};

const SIZES = [
  { width: 16, height: 16 },
  { width: 24, height: 8 },
  // Wider than the minimum: the area grows only vertically
  { width: 80, height: 20 },
] as const;

describe.each(SIZES)("touch-target on a $width×$height element", ({ width, height }) => {
  const halfWidth = Math.max(width, MIN_AREA) / 2;
  const halfHeight = Math.max(height, MIN_AREA) / 2;

  function renderTarget() {
    const { stage, getByTestId } = renderStage(
      <span data-testid="target" className="touch-target" style={{ width, height }} />,
    );
    const target = getByTestId("target");
    return { stage, target, centre: centreOf(target) };
  }

  it("keeps its own size", () => {
    const { target } = renderTarget();
    const box = target.getBoundingClientRect();
    expect({ width: box.width, height: box.height }).toEqual({ width, height });
  });

  it("catches a press just inside each edge and corner of the area", async () => {
    const { stage, target, centre } = renderTarget();
    const dx = halfWidth - MARGIN;
    const dy = halfHeight - MARGIN;
    const points = [
      [-dx, 0],
      [dx, 0],
      [0, -dy],
      [0, dy],
      [-dx, -dy],
      [dx, dy],
    ] as const;
    for (const [x, y] of points) {
      expect(await pressAt(stage, centre.x + x, centre.y + y), `${x}, ${y}`).toBe(target);
    }
  });

  it("does not catch a press just outside each edge of the area", async () => {
    const { stage, centre } = renderTarget();
    const dx = halfWidth + MARGIN;
    const dy = halfHeight + MARGIN;
    const points = [
      [-dx, 0],
      [dx, 0],
      [0, -dy],
      [0, dy],
    ] as const;
    for (const [x, y] of points) {
      expect(await pressAt(stage, centre.x + x, centre.y + y), `${x}, ${y}`).toBe(stage);
    }
  });
});

describe("touch-target layout", () => {
  it("moves neither the element, its content nor its neighbours", () => {
    const { getByTestId, getByRole } = renderStage(
      <>
        <span data-testid="before">Before</span>
        <ClearButton />
        <span data-testid="after">After</span>
      </>,
    );
    const boxes = () =>
      [
        getByTestId("before"),
        getByRole("button"),
        getByRole("button").querySelector("svg") as Element,
        getByTestId("after"),
      ].map((element) => element.getBoundingClientRect().toJSON());
    const without = boxes();

    getByRole("button").classList.add("touch-target");
    expect(boxes()).toEqual(without);
  });

  it("makes a static element the area's containing block", () => {
    const { getByTestId } = renderStage(<span data-testid="target" className="touch-target" />);
    expect(getComputedStyle(getByTestId("target")).position).toBe("relative");
  });

  // The `::after` box is absolutely positioned against the element, which works from any position
  it.each(["absolute", "fixed", "sticky"])(
    "keeps position: %s, with the area still centred",
    async (position) => {
      const { stage, getByTestId } = renderStage(
        <span
          data-testid="target"
          className={`touch-target ${position}`}
          style={{ display: "block", width: 16, height: 16 }}
        />,
      );
      const target = getByTestId("target");
      expect(getComputedStyle(target).position).toBe(position);
      const { x, y } = centreOf(target);
      expect(await pressAt(stage, x - (MIN_AREA / 2 - MARGIN), y)).toBe(target);
    },
  );
});

describe("touch-target on ClearButton (24px)", () => {
  const outside = (24 + MIN_AREA) / 4; // halfway between the button edge and the area edge

  it("clears on a press beside the button", async () => {
    const onClick = vi.fn();
    const { stage, getByRole } = renderStage(
      <ClearButton className="touch-target" onClick={onClick} />,
    );
    const button = getByRole("button");
    const { x, y } = centreOf(button);
    expect(await pressAt(stage, x + outside, y)).toBe(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  // The area inherits the button's `pointer-events: none`, so a disabled button stays inert
  it("lets a press beside a disabled button through", async () => {
    const onClick = vi.fn();
    const { stage, getByRole } = renderStage(
      <ClearButton className="touch-target" disabled onClick={onClick} />,
    );
    const { x, y } = centreOf(getByRole("button"));
    expect(await pressAt(stage, x + outside, y)).toBe(stage);
    expect(onClick).not.toHaveBeenCalled();
  });
});

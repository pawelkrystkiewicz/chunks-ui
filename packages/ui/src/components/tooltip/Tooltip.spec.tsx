import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef, type ReactElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reloadMotion } from "../../lib/use-motion";
import { Tooltip } from "./Tooltip";

afterEach(cleanup);

describe("Tooltip", () => {
  it("transitions the Popup with CSS while Motion has not loaded", async () => {
    const loading = reloadMotion();
    render(
      <Tooltip.Root open>
        <Tooltip.Trigger>Hover</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup data-testid="popup">Tip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );
    expect(screen.getByTestId("popup")).toHaveClass("micro-interactions");
    await loading;
  });

  it("renders Popup with custom className", () => {
    render(
      <Tooltip.Root open>
        <Tooltip.Trigger>Hover</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup className="custom" data-testid="popup">
              Tip
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );
    expect(screen.getByTestId("popup")).toHaveClass("custom");
    expect(screen.getByText("Tip")).toBeInTheDocument();
  });

  it("renders Arrow with custom className", () => {
    render(
      <Tooltip.Root open>
        <Tooltip.Trigger>Hover</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup>
              Tip
              <Tooltip.Arrow className="custom" data-testid="arrow" />
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );
    expect(screen.getByTestId("arrow")).toHaveClass("custom");
  });

  it("renders Positioner with custom className", () => {
    render(
      <Tooltip.Root open>
        <Tooltip.Trigger>Hover</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner className="custom" data-testid="pos">
            <Tooltip.Popup>Tip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );
    expect(screen.getByTestId("pos")).toHaveClass("custom");
  });

  // Positioner keeps a ref of its own, to read the arrow's default padding
  it("passes a ref on Positioner to the positioner element", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Tooltip.Root open>
        <Tooltip.Trigger>Hover</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner ref={ref} data-testid="pos">
            <Tooltip.Popup>Tip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );
    expect(ref.current).toBe(screen.getByTestId("pos"));
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <Tooltip.Root open>
        <Tooltip.Trigger>Hover</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup>Tip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );
    expect(
      await axe(container, {
        rules: {
          // Base UI focus-guard spans with role="button" are internal implementation details
          "aria-command-name": { enabled: false },
        },
      }),
    ).toHaveNoViolations();
  });
});

describe("Tooltip open delay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const advance = (ms: number) =>
    act(() => {
      vi.advanceTimersByTime(ms);
    });

  // fireEvent, not user-event: user-event awaits a real setTimeout that fake timers never fire.
  function hover(ui: ReactNode) {
    render(ui);
    const trigger = screen.getByText("Hover");
    fireEvent.mouseEnter(trigger);
    fireEvent.mouseMove(trigger);
  }

  function Tip({
    delay,
    label = "Hover",
    tip = "Tip",
  }: {
    delay?: number;
    label?: string;
    tip?: string;
  }) {
    return (
      <Tooltip.Root>
        <Tooltip.Trigger delay={delay}>{label}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup>{tip}</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    );
  }

  it("opens after 50ms without a Provider", () => {
    hover(<Tip />);
    advance(30);
    expect(screen.queryByText("Tip")).toBeNull();
    advance(30);
    expect(screen.getByText("Tip")).toBeInTheDocument();
  });

  it("uses the Provider delay", () => {
    hover(
      <Tooltip.Provider delay={1000}>
        <Tip />
      </Tooltip.Provider>,
    );
    advance(300);
    expect(screen.queryByText("Tip")).toBeNull();
    advance(650);
    expect(screen.queryByText("Tip")).toBeNull();
    advance(100);
    expect(screen.getByText("Tip")).toBeInTheDocument();
  });

  it("opens after 50ms inside a Provider with no delay", () => {
    hover(
      <Tooltip.Provider>
        <Tip />
      </Tooltip.Provider>,
    );
    advance(30);
    expect(screen.queryByText("Tip")).toBeNull();
    advance(30);
    expect(screen.getByText("Tip")).toBeInTheDocument();
  });

  it("lets a Trigger delay override the Provider delay", () => {
    hover(
      <Tooltip.Provider delay={1000}>
        <Tip delay={0} />
      </Tooltip.Provider>,
    );
    advance(0);
    expect(screen.getByText("Tip")).toBeInTheDocument();
  });

  it("opens the next tooltip in a Provider instantly once one is open", () => {
    hover(
      <Tooltip.Provider delay={1000}>
        <Tip tip="Tip A" />
        <Tip label="B" tip="Tip B" />
      </Tooltip.Provider>,
    );
    advance(1000);
    expect(screen.getByText("Tip A")).toBeInTheDocument();
    fireEvent.mouseLeave(screen.getByText("Hover"));
    fireEvent.mouseEnter(screen.getByText("B"));
    fireEvent.mouseMove(screen.getByText("B"));
    advance(0);
    expect(screen.getByText("Tip B")).toBeInTheDocument();
  });
});

// Last, since Motion stays loaded for the tests that follow
describe("Tooltip.Popup with Motion loaded", () => {
  function renderPopup(renderProp?: ReactElement) {
    render(
      <Tooltip.Root open>
        <Tooltip.Trigger>Hover</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup render={renderProp} data-testid="popup">
              Tip
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );
    return screen.getByTestId("popup");
  }

  it("animates the default element with Motion, not CSS", async () => {
    await reloadMotion();
    expect(renderPopup()).not.toHaveClass("micro-interactions");
  });

  // A consumer's `render` replaces the animated element, so the spring cannot attach to it
  it("keeps the CSS transition on the element a render prop gives it", async () => {
    await reloadMotion();
    const el = renderPopup(<section />);
    expect(el.tagName).toBe("SECTION");
    expect(el).toHaveClass("micro-interactions", "data-starting-style:opacity-0");
  });
});

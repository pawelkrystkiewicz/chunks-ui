import { cleanup, render } from "@testing-library/react";
import { createRef, type Ref, type RefObject, useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMergedRef } from "./use-merged-ref";

afterEach(cleanup);

/** Renders a div with its own ref object merged with `consumer`; `own()` reads that object. */
function setup(consumer: Ref<HTMLDivElement> | undefined) {
  let ownRef: RefObject<HTMLDivElement | null> = { current: null };
  function Box() {
    const ref = useRef<HTMLDivElement>(null);
    ownRef = ref;
    return <div data-testid="box" ref={useMergedRef(ref, consumer)} />;
  }
  return { own: () => ownRef.current, ...render(<Box />) };
}

describe("useMergedRef", () => {
  it("fills the component's own ref when no consumer ref is passed", () => {
    const { own, getByTestId } = setup(undefined);
    expect(own()).toBe(getByTestId("box"));
  });

  it("fills a consumer ref object and the own ref, and clears both on unmount", () => {
    const consumer = createRef<HTMLDivElement>();
    const { own, getByTestId, unmount } = setup(consumer);
    expect(consumer.current).toBe(getByTestId("box"));
    expect(own()).toBe(getByTestId("box"));
    unmount();
    expect(consumer.current).toBeNull();
    expect(own()).toBeNull();
  });

  it("calls a consumer callback ref with the element, then with null on unmount", () => {
    const consumer = vi.fn();
    const { getByTestId, unmount } = setup(consumer);
    expect(consumer).toHaveBeenLastCalledWith(getByTestId("box"));
    unmount();
    expect(consumer).toHaveBeenLastCalledWith(null);
  });

  it("runs the cleanup a consumer callback ref returns, instead of calling it with null", () => {
    const detach = vi.fn();
    const consumer = vi.fn(() => detach);
    const { own, unmount } = setup(consumer);
    unmount();
    expect(detach).toHaveBeenCalledOnce();
    expect(own()).toBeNull();
    expect(consumer).not.toHaveBeenCalledWith(null);
  });
});

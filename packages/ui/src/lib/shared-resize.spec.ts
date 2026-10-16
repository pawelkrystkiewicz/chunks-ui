import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { notifyResize, observeResize, resizeBatches } from "./shared-resize";

type Stub = {
  callback: ResizeObserverCallback;
  /** Each element the observer watches, and the box it watches */
  targets: Map<Element, ResizeObserverBoxOptions>;
  /** Every `observe` call, in order */
  observed: Element[];
  disconnected: boolean;
};

/** Every ResizeObserver created, in order */
const stubs: Stub[] = [];

/** An entry for `target`; the module reads nothing else of it */
const entry = (target: Element) => ({ target }) as unknown as ResizeObserverEntry;

/** Notifies the observers that watch `target`, as the browser does after layout */
function resize(...targets: Element[]) {
  for (const stub of stubs) {
    const entries = targets.filter((target) => stub.targets.has(target)).map(entry);
    if (entries.length > 0) stub.callback(entries, {} as ResizeObserver);
  }
}

const live = () => stubs.filter((stub) => !stub.disconnected);

const NativeResizeObserver = globalThis.ResizeObserver;

beforeAll(() => {
  globalThis.ResizeObserver = class {
    #stub: Stub;
    constructor(callback: ResizeObserverCallback) {
      this.#stub = { callback, targets: new Map(), observed: [], disconnected: false };
      stubs.push(this.#stub);
    }
    observe(target: Element, options?: ResizeObserverOptions) {
      this.#stub.targets.set(target, options?.box ?? "content-box");
      this.#stub.observed.push(target);
    }
    unobserve(target: Element) {
      this.#stub.targets.delete(target);
    }
    disconnect() {
      this.#stub.targets.clear();
      this.#stub.disconnected = true;
    }
  };
});

afterAll(() => {
  globalThis.ResizeObserver = NativeResizeObserver;
});

const stops: (() => void)[] = [];
/** Observes, and stops after the test */
const observe = (...args: Parameters<typeof observeResize>) => {
  const stop = observeResize(...args);
  stops.push(stop);
  return stop;
};

afterEach(() => {
  for (const stop of stops) stop();
  stops.length = 0;
  stubs.length = 0;
});

const element = () => document.createElement("div");

describe("observeResize", () => {
  it("shares one observer per box between targets, from the first observed to the last", () => {
    const [a, b] = [element(), element()];
    const stopA = observe(a, "border-box", vi.fn());
    const stopB = observe(b, "border-box", vi.fn());
    const stopContent = observe(a, "content-box", vi.fn());
    expect(stubs).toHaveLength(2);
    expect([...(stubs[0]?.targets ?? [])]).toEqual([
      [a, "border-box"],
      [b, "border-box"],
    ]);
    expect([...(stubs[1]?.targets ?? [])]).toEqual([[a, "content-box"]]);

    stopA();
    expect(stubs[0]?.targets.has(a)).toBe(false);
    expect(live()).toHaveLength(2);
    stopB();
    stopContent();
    expect(live()).toHaveLength(0);
    // Observed again, a new observer is created
    observe(a, "border-box", vi.fn());
    expect(live()).toHaveLength(1);
  });

  it("runs the callbacks of every notified target in one batch, each once", () => {
    const measureGroup = vi.fn();
    const measureOther = vi.fn();
    const [container, item, other] = [element(), element(), element()];
    observe(container, "border-box", measureGroup);
    observe(item, "border-box", measureGroup);
    observe(other, "border-box", measureOther);
    const batches = resizeBatches.count;

    resize(container, item, other);
    expect(measureGroup).toHaveBeenCalledTimes(1);
    expect(measureOther).toHaveBeenCalledTimes(1);
    expect(resizeBatches.count).toBe(batches + 1);
  });

  it("runs no batch for a target that nothing observes any more", () => {
    const onResize = vi.fn();
    const target = element();
    const stop = observe(target, "content-box", onResize);
    const stub = stubs[0];
    stop();
    const batches = resizeBatches.count;
    // A notification in flight for a target just unobserved
    stub?.callback([entry(target)], {} as ResizeObserver);
    expect(onResize).not.toHaveBeenCalled();
    expect(resizeBatches.count).toBe(batches);
  });

  it("keeps observing a target until its last callback stops", () => {
    const target = element();
    const first = vi.fn();
    const second = vi.fn();
    const stopFirst = observe(target, "border-box", first);
    observe(target, "border-box", second);
    stopFirst();
    expect(stubs[0]?.targets.has(target)).toBe(true);
    resize(target);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("ignores a stop called twice, leaving a later observation of the target alone", () => {
    const target = element();
    const stop = observe(target, "border-box", vi.fn());
    stop();
    const onResize = vi.fn();
    observe(target, "border-box", onResize);
    stop();
    resize(target);
    expect(onResize).toHaveBeenCalledTimes(1);
  });

  it("does nothing without a ResizeObserver", () => {
    const Stubbed = globalThis.ResizeObserver;
    // @ts-expect-error -- jsdom, and the server, have none
    globalThis.ResizeObserver = undefined;
    try {
      const target = element();
      expect(() => observe(target, "border-box", vi.fn())()).not.toThrow();
      expect(() => notifyResize(target, "border-box")).not.toThrow();
      expect(stubs).toHaveLength(0);
    } finally {
      globalThis.ResizeObserver = Stubbed;
    }
  });
});

describe("notifyResize", () => {
  it("observes the target's box again, so the observer notifies it once more", () => {
    const target = element();
    observe(target, "border-box", vi.fn());
    observe(target, "content-box", vi.fn());
    notifyResize(target, "border-box");
    expect(stubs[0]?.observed).toEqual([target, target]);
    expect(stubs[0]?.targets.get(target)).toBe("border-box");
    expect(stubs[1]?.observed).toEqual([target]);
  });

  it("does nothing for a box of the target that isn't observed", () => {
    const target = element();
    observe(target, "border-box", vi.fn());
    notifyResize(element(), "border-box");
    notifyResize(target, "content-box");
    expect(stubs[0]?.observed).toEqual([target]);
    expect(stubs).toHaveLength(1);
  });
});

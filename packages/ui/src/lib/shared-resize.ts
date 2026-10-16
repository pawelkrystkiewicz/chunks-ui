import { flushSync } from "react-dom";

/**
 * One ResizeObserver per box: one observer can't watch an element by two boxes. All indicators
 * share them, so a resize reaching many groups costs one `flushSync` per box per frame. Created
 * with the first element observed and dropped with the last, so the server creates none.
 */
type Shared = { observer: ResizeObserver | null; callbacks: Map<Element, (() => void)[]> };
type Box = "border-box" | "content-box";

const shared: Record<Box, Shared> = {
  "border-box": { observer: null, callbacks: new Map() },
  "content-box": { observer: null, callbacks: new Map() },
};

/** How many batches the shared observers have run, one `flushSync` each. For specs. */
export const resizeBatches = { count: 0 };

function notify({ callbacks }: Shared, entries: ResizeObserverEntry[]) {
  // Once per callback: a group's container and items notified together measure the group once
  const batch = new Set<() => void>();
  for (const { target } of entries) {
    for (const callback of callbacks.get(target) ?? []) batch.add(callback);
  }
  if (batch.size === 0) return;
  resizeBatches.count++;
  // The browser runs this after layout and before it paints. One synchronous render commits
  // every notified group's update in this frame, rather than one render per group. A callback
  // that throws is reported and doesn't stop the others.
  flushSync(() => {
    for (const callback of batch) {
      try {
        callback();
      } catch (error) {
        reportError(error);
      }
    }
  });
}

/**
 * Observes `target`'s `box` with the shared observer; `onResize` runs after layout, before paint.
 * Only the first subscriber of a (target, box) is also notified when it starts. Does nothing
 * without ResizeObserver.
 */
export function observeResize(target: Element, box: Box, onResize: () => void): () => void {
  if (typeof ResizeObserver === "undefined") return () => {};
  const state = shared[box];
  let callbacks = state.callbacks.get(target);
  if (!callbacks) {
    callbacks = [];
    state.callbacks.set(target, callbacks);
    state.observer ??= new ResizeObserver((entries) => notify(state, entries));
    state.observer.observe(target, { box });
  }
  callbacks.push(onResize);
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    callbacks.splice(callbacks.indexOf(onResize), 1);
    if (callbacks.length > 0) return;
    state.callbacks.delete(target);
    state.observer?.unobserve(target);
    if (state.callbacks.size === 0) {
      state.observer?.disconnect();
      state.observer = null;
    }
  };
}

/**
 * Has the shared observer notify `target`'s `box` callbacks again before the next paint, as on a
 * resize: for a change that moves what they measure without resizing `target`. Nothing happens
 * while `target`'s `box` isn't observed.
 */
export function notifyResize(target: Element, box: Box) {
  const { observer, callbacks } = shared[box];
  if (!observer || !callbacks.has(target)) return;
  // A new observation is notified in the next resize observer step, whatever the size
  observer.unobserve(target);
  observer.observe(target, { box });
}

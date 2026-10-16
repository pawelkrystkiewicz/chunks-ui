import { flushSync } from "react-dom";

/** The boxes an indicator watches */
export type ResizeBox = "border-box" | "content-box";

type Callback = () => void;

/**
 * One ResizeObserver per box (border-box, content-box), shared by every indicator on the page:
 * at most one synchronous render per box per frame for all groups. An observer can't watch an
 * element by two boxes at once, hence one per box. Created when the first element is observed and
 * dropped when the last stops, so nothing is created where this module loads on the server.
 */
type Shared = { observer: ResizeObserver | null; callbacks: Map<Element, Callback[]> };
const shared: Record<ResizeBox, Shared> = {
  "border-box": { observer: null, callbacks: new Map() },
  "content-box": { observer: null, callbacks: new Map() },
};

/** How many batches the shared observers have run, one `flushSync` each. For specs. */
export const resizeBatches = { count: 0 };

function notify({ callbacks }: Shared, entries: ResizeObserverEntry[]) {
  // Once per callback: a group's container and items notified together measure the group once
  const batch = new Set<Callback>();
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
        if (typeof reportError === "function") reportError(error);
        else
          setTimeout(() => {
            throw error;
          });
      }
    }
  });
}

/**
 * Observes `target`'s `box` with the observer every indicator shares. `onResize` runs when the
 * box changes size: after layout, before paint, in one `flushSync` with every other callback the
 * observer notifies in that step. It also runs once when the observation starts, but only for
 * the first subscriber of a (target, box): a later one joins an observation already running, and
 * waits for the next resize or `notifyResize`. Returns a function that stops observing. Does nothing where there is no
 * ResizeObserver (the server, jsdom).
 */
export function observeResize(target: Element, box: ResizeBox, onResize: Callback): () => void {
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
export function notifyResize(target: Element, box: ResizeBox) {
  const { observer, callbacks } = shared[box];
  if (!observer || !callbacks.has(target)) return;
  // A new observation is notified in the next resize observer step, whatever the size
  observer.unobserve(target);
  observer.observe(target, { box });
}

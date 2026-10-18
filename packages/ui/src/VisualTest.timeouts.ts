/**
 * How long a wait gives Motion or the browser to act, in ms: for a value to settle, start or
 * change, a render path to switch, an element to mount or go, or an event to arrive. A wait ends
 * as soon as it is met, so only a failing one runs to the limit. The visual config sets it as the
 * `expect.poll` timeout, so a poll takes no per-call option. `expect.element` does not read that
 * setting: without `{ timeout }` it waits for the rest of the test, so an element wait that needs
 * this bound passes `{ timeout: SETTLE_TIMEOUT_MS }`. This file imports nothing, so the config can
 * load it.
 */
export const SETTLE_TIMEOUT_MS = 5000;

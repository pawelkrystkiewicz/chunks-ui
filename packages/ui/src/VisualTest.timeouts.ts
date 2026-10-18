/**
 * How long a wait gives Motion or the browser to act, in ms: for a value to settle, start or
 * change, a render path to switch, an element to mount or go, or an event to arrive. A wait ends
 * as soon as it is met, so only a failing one runs to the limit. The visual config sets it as the
 * `expect.poll` and `expect.element` timeout, so those waits take no per-call option. This file
 * imports nothing, so the config can load it.
 */
export const SETTLE_TIMEOUT_MS = 5000;

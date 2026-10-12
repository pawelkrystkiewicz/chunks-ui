// The landing --ring (globals.css) on keyboard focus, as chunks-ui's Button draws it. Grid cells and
// the header logo draw it inside their box: the grid frame and the hero's edge clip what is outside.
// Plain module (no "use client"), so server and client files share the same strings.
export const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
export const FOCUS_RING_INSET =
  "focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ring";

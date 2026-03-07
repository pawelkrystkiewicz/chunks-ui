export const springs = {
  /** Indicator movement — bouncy, playful */
  indicator: { type: "spring", stiffness: 300, damping: 32 },

  /** Content transitions — snappy, no overshoot */
  content: {
    type: "spring",
    stiffness: 300,
    damping: 30,
    bounce: 0,
    restDelta: 0.01,
  },

  /** Enter/exit overlays — gentle fade */
  overlay: { type: "spring", stiffness: 200, damping: 25 },

  /** Micro-interactions — fast response */
  micro: { type: "spring", stiffness: 400, damping: 28 },
} as const;

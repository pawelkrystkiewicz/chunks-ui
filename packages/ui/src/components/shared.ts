/**
 * The press scale, and the colour and opacity fades, of a button. Not the focus ring, which then
 * also shows at once under a consumer's duration utility. One duration for the whole list: the
 * class's three durations would repeat over it (theme.css).
 */
export const BUTTON_ANIMATION_CLASSES = [
  "micro-interactions",
  "[transition-property:color,background-color,border-color,opacity,scale]",
  "duration-300",
  "active:scale-95",
];

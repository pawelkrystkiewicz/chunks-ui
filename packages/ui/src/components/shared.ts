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

/**
 * The transition list of a part with an outline focus ring, for a part with no transition of its
 * own: the colours, opacity, shadow and scale, and no outline, so the ring shows at once. With no
 * duration the parts do not animate. A `duration-*` utility fades these properties, not the ring,
 * and a `transition-*` utility in `className` does not change the list, which comes after it in
 * the CSS.
 */
export const RING_TRANSITION =
  "[transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,translate,scale,rotate,filter,backdrop-filter,width,height,border-radius]";

/** The same list, with the class's fade (300ms) for a part that animates its colours */
export const RING_ANIMATION_CLASSES = ["micro-interactions", RING_TRANSITION, "duration-300"];

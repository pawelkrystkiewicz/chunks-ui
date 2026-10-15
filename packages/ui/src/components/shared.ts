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

/**
 * `RING_TRANSITION` without `opacity`, `transform`, `translate`, `scale` and `rotate`, for a popup
 * whose Motion spring writes those: a `transition-*` or `duration-*` utility in `className` then
 * does not transition them on top of the spring.
 */
export const RING_TRANSITION_MOTION =
  "[transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,box-shadow,filter,backdrop-filter,width,height,border-radius]";

/** The same list, with the class's fade (300ms) for a part that animates its colours */
export const RING_ANIMATION_CLASSES = ["micro-interactions", RING_TRANSITION, "duration-300"];

/**
 * The library's keyboard focus ring: 2px `--ring`, 2px offset, `:focus-visible` only. Not used by
 * popup-arrow's overlay or Slider's `has-[:focus-visible]` ring.
 */
export const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/** The class `theme.css` styles the toast content box by; see `.ToastContent` there. */
export const TOAST_CONTENT_CLASS = "ToastContent";

/**
 * The class the popups' `has-[.PopupArrow]:` variants and `arrowPaddingIn` find the arrow by; see
 * `popup-arrow.ts` and `arrow-padding.ts`. Those variants spell it out so Tailwind's scanner sees
 * the whole class.
 */
export const POPUP_ARROW_CLASS = "PopupArrow";

/*
 * The arrow shared by Popover.Arrow and Menu.Arrow: a square in the popup's colours, standing on
 * the corner between its two bordered sides, which each side turns to point at the trigger.
 */

const CORNERS = [
  "borderTopLeftRadius",
  "borderTopRightRadius",
  "borderBottomRightRadius",
  "borderBottomLeftRadius",
] as const;

/**
 * The default `arrowPadding` for the popup in `positioner`, or `undefined` while it holds no
 * `.PopupArrow`. Base UI holds the arrow's box at least `arrowPadding` from the popup's ends; its
 * foot, the turned square's diagonal, reaches (√2 − 1)/2 of its size past that box on each side.
 * The padding is the popup's largest corner radius plus that reach, so the foot starts where the
 * edge after the curve is straight. Both come from CSS variables (`--radius`, `--spacing`), so
 * they're read from the open popup. A popup too short for the padding (Floating UI caps it at the
 * middle, less 1px) needs a smaller radius on the arrow's edge, as the Tooltip has.
 */
export function arrowPaddingIn(positioner: Element): number | undefined {
  const arrow = positioner.querySelector(".PopupArrow");
  // Not the first child: Base UI puts focus guards around the popup
  const popup = arrow && [...positioner.children].find((child) => child.contains(arrow));
  if (!arrow || !popup) return undefined;
  const corners = getComputedStyle(popup);
  // A value with a percentage (`min(8px, 50% - 8px)`) parses as NaN, and leaves the others to count
  const radius = Math.max(0, ...CORNERS.map((corner) => Number.parseFloat(corners[corner]) || 0));
  const size = Number.parseFloat(getComputedStyle(arrow).width);
  const padding = radius + (size * (Math.SQRT2 - 1)) / 2;
  // Without layout (jsdom, happy-dom) the width is "" and the padding NaN: Base UI's own default
  // then applies, instead of a `left: NaN`
  return Number.isFinite(padding) ? padding : undefined;
}

/**
 * For a popup that can hold an arrow. `relative` makes the popup the arrow's containing block at
 * all times, not only while a scale animation transforms it. With an arrow inside, the popup moves
 * away from the trigger by `--popup-arrow-reach`, the arrow's reach (2.5/√2 units, less the 1px
 * border, rounded up to 1.75 units: whole pixels at the default spacing), so `sideOffset` stays
 * the gap between the trigger and the tip. Base UI measures `--available-height` from the
 * positioner, before that move, so a popup that caps its height takes the reach off it too.
 *
 * The arrow is a positioned child, so it paints over the popup's own focus ring where they meet.
 * In a popup that holds an arrow (`has-[.PopupArrow]:`), the ring moves to an `::after` overlay,
 * positioned and raised so it paints above the arrow. Chromium draws the ring of a bordered box up
 * to 1px over the border, so the overlay takes the popup's border box: the popup's padding box (its
 * containing block) with the popup's border widths, transparent, around it, centred on it. Where
 * `place-self` doesn't align an absolutely positioned box, `-inset-px` still fits a 1px border. It
 * takes the popup's radius too. Forced colours name `Highlight`, the system focus colour. A popup
 * without an arrow keeps the browser's ring on itself: an overlay would be clipped by its `overflow`.
 */
export const arrowPopupClasses = [
  "relative",
  "[--popup-arrow-reach:0px] has-[.PopupArrow]:[--popup-arrow-reach:calc(var(--spacing)*1.75)]",
  "has-[.PopupArrow]:data-[side=top]:mb-(--popup-arrow-reach)",
  "has-[.PopupArrow]:data-[side=bottom]:mt-(--popup-arrow-reach)",
  "has-[.PopupArrow]:data-[side=left]:mr-(--popup-arrow-reach)",
  "has-[.PopupArrow]:data-[side=right]:ml-(--popup-arrow-reach)",
  "has-[.PopupArrow]:data-[side=inline-start]:me-(--popup-arrow-reach)",
  "has-[.PopupArrow]:data-[side=inline-end]:ms-(--popup-arrow-reach)",
  "has-[.PopupArrow]:focus-visible:outline-none",
  "has-[.PopupArrow]:focus-visible:after:pointer-events-none has-[.PopupArrow]:focus-visible:after:absolute has-[.PopupArrow]:focus-visible:after:-inset-px has-[.PopupArrow]:focus-visible:after:z-10",
  "has-[.PopupArrow]:focus-visible:after:box-content has-[.PopupArrow]:focus-visible:after:size-full has-[.PopupArrow]:focus-visible:after:[place-self:unsafe_center]",
  "has-[.PopupArrow]:focus-visible:after:rounded-[inherit] has-[.PopupArrow]:focus-visible:after:border-solid has-[.PopupArrow]:focus-visible:after:[border-width:inherit] has-[.PopupArrow]:focus-visible:after:border-transparent",
  "has-[.PopupArrow]:focus-visible:after:[outline-style:auto] has-[.PopupArrow]:focus-visible:after:[outline-width:1px] has-[.PopupArrow]:focus-visible:after:[outline-color:-webkit-focus-ring-color]",
  // Forced colours revert an author `outline-color` on the overlay to CanvasText, so name the system focus colour
  "has-[.PopupArrow]:forced-colors:focus-visible:after:[outline-color:Highlight]",
];

export const arrowClasses = [
  "PopupArrow absolute size-2.5 border-border border-t border-l bg-popover",
  // Only the half with the tip: the other half would cover the popup's content
  "[clip-path:polygon(0_0,100%_0,0_100%)]",
  // Half the arrow's size, so its centre sits on the inner edge of the popup's border: the arrow
  // covers the border where they meet, and its own border carries the outline to the tip.
  "data-[side=top]:-bottom-1.25 data-[side=top]:-rotate-135",
  "data-[side=bottom]:-top-1.25 data-[side=bottom]:rotate-45",
  "data-[side=left]:-right-1.25 data-[side=left]:rotate-135",
  "data-[side=right]:-left-1.25 data-[side=right]:-rotate-45",
  // Logical sides: the arrow is on the popup edge that faces back toward the trigger, and turns
  // the other way in RTL, where that edge is on the other side. The arrow's own direction, as
  // for the inset: `rtl:` also matches inside an LTR section of an RTL page.
  "data-[side=inline-start]:-end-1.25 data-[side=inline-start]:rotate-135",
  "[&:dir(rtl)]:data-[side=inline-start]:-rotate-45",
  "data-[side=inline-end]:-start-1.25 data-[side=inline-end]:-rotate-45",
  "[&:dir(rtl)]:data-[side=inline-end]:rotate-135",
  // Base UI centres the arrow across the positioner, but it is placed inside the popup's 1px border
  "data-[side=top]:-ml-px data-[side=bottom]:-ml-px",
  "data-[side=left]:-mt-px data-[side=right]:-mt-px",
  "data-[side=inline-start]:-mt-px data-[side=inline-end]:-mt-px",
];

/*
 * The arrow shared by Popover.Arrow and Menu.Arrow: a square in the popup's colours, standing on
 * the corner between its two bordered sides, which each side turns to point at the trigger.
 */

/**
 * The positioner's default `arrowPadding`: how close Base UI lets the arrow come to the popup's
 * ends (by a smaller trigger with `align` start or end, it shifts the popup instead, so the arrow
 * still points at the trigger's centre; with the default `center`, near a viewport edge, the arrow
 * can be held at the padding instead). The arrow's foot, 2.5/√2 units either
 * side of its centre, then starts 7.9px in, where the straight edge after the 8px `rounded-md`
 * corner begins. At Base UI's 5 it stood out of the curve. The arrow scales with `--spacing`
 * but this is fixed px: raise it with a larger corner radius or a larger `--spacing`.
 */
export const ARROW_PADDING_PX = 10;

/**
 * For a popup that can hold an arrow. `relative` makes the popup the arrow's containing block at
 * all times, not only while a scale animation transforms it. With an arrow inside, the popup moves
 * away from the trigger by `--popup-arrow-reach`, the arrow's reach (2.5/√2 units, less the 1px
 * border, rounded up to 1.75 units: whole pixels at the default spacing), so `sideOffset` stays
 * the gap between the trigger and the tip. Base UI measures `--available-height` from the
 * positioner, before that move, so a popup that caps its height takes the reach off it too.
 *
 * The arrow is a positioned child, so it paints over the popup's own focus ring where they meet.
 * In a popup that holds an arrow (`has-[.PopupArrow]:`), the ring moves to an `::after` overlay:
 * positioned, last in the popup and raised, it paints above the arrow. `relative` above anchors it on the popup's border box, and it takes the
 * popup's radius and a clear border of the popup's width, because Chromium draws the ring of a
 * bordered box partly over the border. It draws the browser's own ring (`outline: auto 1px
 * -webkit-focus-ring-color`, which matches Chromium's UA ring; Safari draws its own platform ring
 * either way; a browser without that colour keeps its default one), only while the popup is
 * `:focus-visible`. Forced colours name `Highlight`, the system focus colour. A popup without an
 * arrow keeps the browser's ring on itself: an `overflow` on it would clip the overlay.
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
  "has-[.PopupArrow]:focus-visible:after:rounded-[inherit] has-[.PopupArrow]:focus-visible:after:border has-[.PopupArrow]:focus-visible:after:border-transparent",
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

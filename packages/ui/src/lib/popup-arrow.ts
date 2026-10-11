/*
 * The arrow shared by Popover.Arrow and Menu.Arrow: a square in the popup's colours, standing on
 * the corner between its two bordered sides, which each side turns to point at the trigger.
 */

/**
 * The positioner's default `arrowPadding`: how close Base UI lets the arrow come to the popup's
 * ends (by a small trigger, it shifts the popup instead). The arrow's foot, 2.5/√2 units either
 * side of its centre, then starts 7.9px in, where the straight edge after the 8px `rounded-md`
 * corner begins. At Base UI's 5 it stood out of the curve. A larger radius needs more padding.
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
 * The ring moves to an `::after` overlay instead: positioned, last in the popup and raised, it
 * paints above the arrow. `relative` above anchors it on the popup's border box, and it takes the
 * popup's radius and a clear border of the popup's width, because Chromium draws the ring of a
 * bordered box partly over the border. It draws the browser's own ring (`outline: auto 1px
 * -webkit-focus-ring-color`, as Chromium and Safari do; a browser without that colour keeps its
 * default one), only while the popup is `:focus-visible`.
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
  "focus-visible:outline-none",
  "focus-visible:after:pointer-events-none focus-visible:after:absolute focus-visible:after:-inset-px focus-visible:after:z-10",
  "focus-visible:after:rounded-[inherit] focus-visible:after:border focus-visible:after:border-transparent",
  "focus-visible:after:[outline-style:auto] focus-visible:after:[outline-width:1px] focus-visible:after:[outline-color:-webkit-focus-ring-color]",
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

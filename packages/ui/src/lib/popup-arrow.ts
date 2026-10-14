/*
 * The arrow shared by Popover.Arrow and Menu.Arrow: a square in the popup's colours, standing on
 * the corner between its two bordered sides, which each side turns to point at the trigger.
 */

/**
 * For a popup that can hold an arrow. `relative` makes the popup the arrow's containing block at
 * all times, not only while a scale animation transforms it. With an arrow inside, the popup moves
 * away from the trigger by `--popup-arrow-reach`, the arrow's reach (2.5/√2 units, less the 1px
 * border, rounded up to 1.75 units: whole pixels at the default spacing), so `sideOffset` stays
 * the gap between the trigger and the tip. Base UI measures `--available-height` from the
 * positioner, before that move, so a popup that caps its height takes the reach off it too.
 *
 * A popup focused from the keyboard draws the library's ring, as a Button does: 2px of `--ring`,
 * 2px outside its edge. The arrow is a positioned child, so it paints over the popup's own ring
 * where they meet. In a popup that holds an arrow (`has-[.PopupArrow]:`), the ring moves to an
 * `::after` overlay, positioned and raised so it paints above the arrow. The overlay takes the
 * popup's border box, so its ring sits where the popup's own would: the popup's padding box (its
 * containing block) with the popup's border widths, transparent, around it, centred on it. In a
 * browser without `place-self` on absolutely positioned boxes, `-inset-px` still fits a 1px border
 * (with `border-0` that browser draws the overlay 1px up and to the left).
 * It takes the popup's radius too. A popup without an arrow keeps the ring on itself: an overlay
 * would be clipped by a consumer's `overflow`, which does not clip the popup's own outline.
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
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  "has-[.PopupArrow]:focus-visible:outline-none",
  "has-[.PopupArrow]:focus-visible:after:pointer-events-none has-[.PopupArrow]:focus-visible:after:absolute has-[.PopupArrow]:focus-visible:after:-inset-px has-[.PopupArrow]:focus-visible:after:z-10",
  "has-[.PopupArrow]:focus-visible:after:box-content has-[.PopupArrow]:focus-visible:after:size-full has-[.PopupArrow]:focus-visible:after:[place-self:unsafe_center]",
  "has-[.PopupArrow]:focus-visible:after:rounded-[inherit] has-[.PopupArrow]:focus-visible:after:border-solid has-[.PopupArrow]:focus-visible:after:[border-width:inherit] has-[.PopupArrow]:focus-visible:after:border-transparent",
  "has-[.PopupArrow]:focus-visible:after:outline-2 has-[.PopupArrow]:focus-visible:after:outline-offset-2",
  // An arbitrary property: tailwind-merge replaces it with a consumer's `[outline-color:…]`, and
  // Tailwind sorts a colour utility after it
  "has-[.PopupArrow]:focus-visible:after:[outline-color:var(--ring)]",
  // Forced colours revert the ring colour: the focused popup gets the browser's focus colour, but
  // the overlay, which has no focus, gets CanvasText, so it names the system focus colour
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

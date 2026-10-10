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
  // the other way in RTL, where that edge is on the other side.
  "data-[side=inline-start]:-inset-e-1.25 data-[side=inline-start]:rotate-135",
  "rtl:data-[side=inline-start]:-rotate-45",
  "data-[side=inline-end]:-inset-s-1.25 data-[side=inline-end]:-rotate-45",
  "rtl:data-[side=inline-end]:rotate-135",
  // Base UI centres the arrow across the positioner, but it is placed inside the popup's 1px border
  "data-[side=top]:-ml-px data-[side=bottom]:-ml-px",
  "data-[side=left]:-mt-px data-[side=right]:-mt-px",
  "data-[side=inline-start]:-mt-px data-[side=inline-end]:-mt-px",
];

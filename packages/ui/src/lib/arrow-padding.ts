const CORNERS = [
  "borderTopLeftRadius",
  "borderTopRightRadius",
  "borderBottomRightRadius",
  "borderBottomLeftRadius",
] as const;

/**
 * The default `arrowPadding` for the popup in `positioner`, or `undefined` while it holds no
 * `.PopupArrow`: the largest of the four corner radii (the larger component of an elliptical
 * corner; a percentage counts as 0) plus the arrow's overhang, (√2 − 1)/2 of its size, so the foot
 * starts on the straight edge. Read from the open popup, as `--radius` and `--spacing` are CSS
 * variables.
 */
export function arrowPaddingIn(positioner: Element): number | undefined {
  const arrow = positioner.querySelector(".PopupArrow");
  // Not the first child: Base UI puts focus guards around the popup
  const popup = arrow && [...positioner.children].find((child) => child.contains(arrow));
  if (!arrow || !popup) return undefined;
  const corners = getComputedStyle(popup);
  // An elliptical corner is "<horizontal> <vertical>": the larger counts. Only a length in pixels
  // does; a percentage, or a function (`min(8px, 50% - 8px)`), counts as 0.
  const radius = Math.max(
    0,
    ...CORNERS.flatMap((corner) =>
      corners[corner]
        .split(/\s+/)
        .map((value) => (/^[\d.]+px$/.test(value) ? Number.parseFloat(value) : 0)),
    ),
  );
  const size = Number.parseFloat(getComputedStyle(arrow).width);
  const padding = radius + (size * (Math.SQRT2 - 1)) / 2;
  // Without layout (jsdom, happy-dom) the width is "" and the padding NaN: Base UI's own default
  // then applies, instead of a `left: NaN`
  return Number.isFinite(padding) ? padding : undefined;
}

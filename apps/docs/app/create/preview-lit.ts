// Which preview elements paint with a colour token, read from their Tailwind classes and inline
// style: the Accessibility panel outlines them while that token's colour editor is open.

/** The utilities that take a colour, by the part before the colour's name */
const COLOR =
  /^(bg|text|border(-[xytrblse])?|outline|ring(-offset)?|inset-ring|shadow|inset-shadow|fill|stroke|from|via|to|divide|accent|caret|decoration|placeholder)$/;

/**
 * Whether a variant applies to `el` while an editor is open. Pointer and focus variants never do:
 * the pointer and focus are in the editor. A `data-*` or `aria-*` variant applies in its state.
 * ponytail: every other variant (`dark:`, breakpoints, `group-*`, `has-*`) counts as applying.
 */
function applies(el: Element, variant: string) {
  if (/hover|focus|active/.test(variant)) return false;
  const data = /^data-\[?([\w-]+)(?:=([\w-]+))?\]?$/.exec(variant);
  if (data) {
    const value = el.getAttribute(`data-${data[1]}`);
    return data[2] ? value === data[2] : value !== null;
  }
  const aria = /^aria-([\w-]+)$/.exec(variant);
  return aria ? el.getAttribute(`aria-${aria[1]}`) === "true" : true;
}

/**
 * Whether one of `el`'s classes, or its inline style, paints with one of `tokens`. ponytail: a
 * colour set in a stylesheet, or reached through `currentColor`, is not seen, and an ancestor's
 * `overflow: hidden` clips the outline (the Progress indicator's).
 */
export function paintsWith(el: Element, tokens: string[]) {
  // `var(--x)`, `var(--x, …)` or Tailwind's `bg-(--x)`
  const named = new RegExp(`\\(--(${tokens.join("|")})[,)]`);
  if (named.test(el.getAttribute("style") ?? "")) return true;
  return [...el.classList].some((cls) => {
    // The variants end at the last colon outside brackets
    const variants = cls.split(/:(?![^[]*\])/);
    const utility = (variants.pop() ?? "").replace(/^!|!$/g, "");
    if (!variants.every((v) => applies(el, v))) return false;
    const name = utility.replace(/\/[\d.]+$/, "");
    return (
      named.test(utility) ||
      tokens.some((t) => name.endsWith(`-${t}`) && COLOR.test(name.slice(0, -t.length - 1)))
    );
  });
}

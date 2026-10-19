// Which preview elements paint with a colour token, read from their Tailwind classes and inline
// style: the Accessibility panel outlines them while that token's colour editor is open.

import { cn } from "chunks-ui/utils";

/** The utilities that take a colour, by the part before the colour's name */
const COLOR =
  /^(bg|text|border(-[xytrblse])?|outline|ring(-offset)?|inset-ring|shadow|inset-shadow|fill|stroke|from|via|to|divide|accent|caret|decoration|placeholder)$/;

/** Tailwind's pointer and focus variants: of the element, a named group or peer, or inside it */
const INTERACTION =
  /^(group-|peer-|has-)?(\[:)?(hover|focus|focus-visible|focus-within|active)\]?(\/[\w-]+)?$/;

/** The state variants: Base UI's `data-*` and `aria-*` */
const STATE = /^(data|aria)-/;

/**
 * Whether a variant applies to `el` while an editor is open. A `data-*` or `aria-*` variant applies
 * in its state (`data-active` is Base UI's state, not the pointer's). Pointer and focus variants,
 * `has-[:focus-visible]` among them, never do: the pointer and focus are in the editor. ponytail:
 * every other variant (`dark:`, breakpoints, `group-*`, `in-*`, other `has-*`) counts as applying.
 */
function applies(el: Element, variant: string) {
  const data = /^data-\[?([\w-]+)(?:=([\w-]+))?\]?$/.exec(variant);
  if (data) {
    const value = el.getAttribute(`data-${data[1]}`);
    return data[2] ? value === data[2] : value !== null;
  }
  const aria = /^aria-([\w-]+)$/.exec(variant);
  if (aria) return el.getAttribute(`aria-${aria[1]}`) === "true";
  return !INTERACTION.test(variant);
}

/** A class's variants, then its utility: the variants end at the last colon outside brackets */
const parts = (cls: string) => cls.split(/:(?![^[]*\])/);

/**
 * A test of whether an element's classes, or its inline style, paint with one of `tokens`. Built
 * once per scan of the preview. ponytail: a colour an element inherits (most text takes
 * `--foreground` that way), sets in a stylesheet or reaches through `currentColor` is not seen, and
 * an ancestor's `overflow: hidden` clips the outline (the Progress indicator's).
 */
export function paintsWith(tokens: string[]) {
  // `var(--x)`, `var(--x, …)` or Tailwind's `bg-(--x)`
  const named = new RegExp(`\\(--(${tokens.join("|")})[,)]`);
  return (el: Element) => {
    if (named.test(el.getAttribute("style") ?? "")) return true;
    // The classes that apply. A class in a state that applies beats a plain one of its kind in the
    // CSS (`data-checked:bg-primary` beats `bg-input`): put last without its state variants, it
    // makes tailwind-merge drop the plain one.
    const plain: string[] = [];
    const state: string[] = [];
    for (const cls of el.classList) {
      const variants = parts(cls);
      const utility = variants.pop() ?? "";
      if (!variants.every((v) => applies(el, v))) continue;
      const rest = variants.filter((v) => !STATE.test(v));
      if (rest.length < variants.length) state.push([...rest, utility].join(":"));
      else plain.push(cls);
    }
    return (state.length ? cn(plain, state).split(" ") : plain).some((cls) => {
      const utility = (parts(cls).pop() ?? "").replace(/^!|!$/g, "");
      const name = utility.replace(/\/[\d.]+$/, "");
      return (
        named.test(utility) ||
        tokens.some((t) => name.endsWith(`-${t}`) && COLOR.test(name.slice(0, -t.length - 1)))
      );
    });
  };
}

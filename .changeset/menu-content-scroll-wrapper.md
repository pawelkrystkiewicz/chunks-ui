---
"chunks-ui": minor
---

`Menu.Content` now puts its items in an inner element that scrolls, so the popup does not clip `Menu.Arrow`. The `className` of `Menu.Content` still styles the popup, but the popup's only child is now that scroll element, not your items:

- Layout classes such as `grid`, `gap-*`, `space-y-*`, `divide-*` and child variants (`*:`, `[&>*]:`) no longer reach the items.
- Padding classes pad outside the scroll area, and `p-0` does not remove the `p-1` around the items.
- `overflow-hidden` clips the arrow.

To lay out or style the items, wrap them in your own element inside `Menu.Content`, for example `<div className="grid gap-1">…</div>`.

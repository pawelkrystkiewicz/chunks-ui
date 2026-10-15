---
"chunks-ui": minor
---

`Card` has no shadow by default, and its spacing comes from `Card.Root`

- `Card.Root` no longer has `shadow-sm`. To keep a shadow, pass a class: `<Card.Root className="shadow-sm">`.
- `Card.Root` is now a flex column with `py-6` and `gap-6`. `Card.Header`, `Card.Content` and `Card.Footer` have only `px-6` (before: `p-6`, `p-6 pt-0` and `p-6 pt-0`). Any subset of parts is now padded on every side. Before, any card without `Card.Header` (including Content + Footer) had no top padding. A card that starts with `Card.Header` looks the same as before, unless the Header has `border-b`: the Content under it is now 24px below the divider, where it was flush (`pt-0`). A `Card.Footer` with `border-t` changes the same way: its content is now 24px below the divider, where it was flush.
- `Card.Header` with `border-b` gets `pb-6`, so its divider still sits 24px from the header text, and `Card.Footer` with `border-t` gets `pt-6`, so the footer text sits 24px from its divider. To change that padding, use the same variant, for example `[.border-b]:pb-4`. A plain `pb-4` loses to it. Only the exact `border-b` and `border-t` classes trigger this; with `border-b-2`, `border-y` or `border`, add the padding yourself.
- If you set padding on a part, for example `<Card.Content className="p-4">`, the root's `py-6` now adds to it. Move the vertical padding and the gap to the root and keep the horizontal padding on the parts: `<Card.Root className="gap-4 py-4">` with `<Card.Content className="px-4">`.
- The root's `flex flex-col gap-6 py-6` applies to every child, not only the parts:
  - Raw text and inline children now stack as flex items, 24px apart. A lone button stretches to the full width of the card.
  - An image at the top of the card is no longer flush with the top edge.
  - `space-y-*` on the root adds to `gap-6`.
  - `pt-*` and `pb-*` on the parts add to the gap. To change one gap, pass `gap-0` to the root and pad the parts.
  - Remove any `pt-6` you added to a `Card.Content` that has no `Card.Header` above it. It now doubles the top padding.
  - To get the old root box back, pass `className="block p-0"` to the root: `block` replaces `flex`, and `p-0` removes `py-6`. The parts then have only `px-6`, so add their vertical padding yourself.

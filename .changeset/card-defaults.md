---
"chunks-ui": minor
---

`Card` has no shadow by default, and its spacing comes from `Card.Root`

- `Card.Root` no longer has `shadow-sm`. To keep a shadow, pass a class: `<Card.Root className="shadow-sm">`.
- `Card.Root` is now a flex column with `py-6` and `gap-6`. `Card.Header`, `Card.Content` and `Card.Footer` have only `px-6` (before: `p-6`, `p-6 pt-0` and `p-6 pt-0`). Any subset of parts is now padded on every side. Before, a card with only `Card.Content` or `Card.Footer` had no top padding. A card with Header, Content and Footer looks the same as before.
- `Card.Header` with `border-b` gets `pb-6`, and `Card.Footer` with `border-t` gets `pt-6`, so a divider still sits 24px from the text. To change that padding, use the same variant, for example `[.border-b]:pb-4`. A plain `pb-4` loses to it.
- If you set padding on a part, for example `<Card.Content className="p-4">`, the root's `py-6` now adds to it. Move the vertical padding and the gap to the root and keep the horizontal padding on the parts: `<Card.Root className="gap-4 py-4">` with `<Card.Content className="px-4">`.

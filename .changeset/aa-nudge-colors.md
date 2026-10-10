---
"chunks-ui": minor
---

The default colours now meet WCAG 2 AA contrast in light and dark mode. Some colours change, and coloured text has new tokens.

Changed tokens, in both modes unless noted:

| Token | Before | After |
|---|---|---|
| `--primary` | `oklch(60.48% 0.2165 257.21)` (#007bff) | `oklch(0.56 0.2165 257.21)` (#006cef) |
| `--destructive` | `oklch(66.16% 0.2249 25.88)` (#ff4242) | `oklch(0.582 0.2249 25.88)` (#e21c28) |
| `--success-foreground` | `oklch(0.985 0 0)` (white) | `oklch(0.145 0 0)` (dark) |
| `--muted-foreground` (light) | `oklch(0.556 0 0)` | `oklch(0.53 0 0)` |
| `--ring` (light) | `oklch(0.708 0 0)` | `oklch(0.62 0 0)` |

White text on primary goes from 3.81:1 to 4.58:1, white on destructive from 3.29:1 to 4.54:1, and text on success from 1.98:1 to 9.56:1. `--muted-foreground` on `--muted` goes from 4.35:1 to 4.82:1, and `--ring` on the background from 2.58:1 to 3.64:1.

New colours for coloured text: `primary-text`, `success-text`, `warning-text` and `destructive-text` (for example `text-primary-text`). Each one uses the hue and chroma of its fill and changes only the lightness: at most 0.51 in light mode, at least 0.63 in dark mode. The shade is computed on the element that uses it, so it follows a `--primary` that you set on `:root` or on any nested element. To use a different shade, set `--primary-text`, `--success-text`, `--warning-text` or `--destructive-text`.

These components now use the new colours: `Button` and `IconButton` (`outlined` and `text` variants), `Chip`, `Field.Error`, the current day in `Calendar`, and the hover colour of `ClearButton`. In light mode, coloured text on white goes from 2.06–3.98:1 to 5.05–6.12:1, and on a `Chip` tint from 1.91–3.48:1 to 4.66–5.50:1.

The new colours use CSS relative colour syntax: Chrome 119+, Safari 18+ and Firefox 128+. Older browsers show this text in the inherited text colour.

---
"chunks-ui": minor
---

The default text and fill colours now meet WCAG 2 AA contrast in light and dark mode (the focus ring, `--ring`, is not among them: it measures about 2.4:1 in light mode and 2:1 in dark mode), and coloured text has new tokens: `primary-text`, `success-text`, `warning-text` and `destructive-text` (for example `text-primary-text`). See "Coloured Text" in the theme docs for how they work and which browsers support them (Safari 18+, Chrome 119+, Firefox 128+).

| Token | Before | After | Contrast |
|---|---|---|---|
| `--primary` | `oklch(60.48% 0.2165 257.21)` | `oklch(0.56 0.2165 257.21)` | white on fill 3.81 to 4.58 |
| `--destructive` | `oklch(66.16% 0.2249 25.88)` | `oklch(0.582 0.2249 25.88)` | white on fill 3.29 to 4.54 |
| `--success-foreground` | `oklch(0.985 0 0)` | `oklch(0.145 0 0)` | text on fill 1.98 to 9.56 |
| `--muted-foreground` (light) | `oklch(0.556 0 0)` | `oklch(0.53 0 0)` | on `--muted` 4.35 to 4.82 |

`Button` and `IconButton` (`outlined`, `text`), `Chip`, `Field.Error`, the current day in `Calendar` and the `ClearButton` hover colour now use the new text tokens. Coloured text on white goes from 2.06-3.98:1 to 5.05-6.12:1.

To keep the old colours, set the "Before" values of the table in `:root` and `.dark` of your theme (`--primary`, `--destructive`, `--success-foreground`, and `--muted-foreground` in light mode only), and set `--colored-text-lightness: l` so the coloured text takes its fill's own lightness again, as it did before the text tokens.

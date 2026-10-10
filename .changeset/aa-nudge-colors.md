---
"chunks-ui": minor
---

The default colours now meet WCAG 2 AA contrast in light and dark mode, and coloured text has new tokens: `primary-text`, `success-text`, `warning-text` and `destructive-text` (for example `text-primary-text`). See "Coloured Text" in the theme docs for how they work and which browsers support them (Safari 18+, Chrome 119+, Firefox 128+).

| Token | Before | After | Contrast |
|---|---|---|---|
| `--primary` | `oklch(60.48% 0.2165 257.21)` | `oklch(0.56 0.2165 257.21)` | white on fill 3.81 to 4.58 |
| `--destructive` | `oklch(66.16% 0.2249 25.88)` | `oklch(0.582 0.2249 25.88)` | white on fill 3.29 to 4.54 |
| `--success-foreground` | `oklch(0.985 0 0)` | `oklch(0.145 0 0)` | text on fill 1.98 to 9.56 |
| `--muted-foreground` (light) | `oklch(0.556 0 0)` | `oklch(0.53 0 0)` | on `--muted` 4.35 to 4.82 |
| `--ring` (light) | `oklch(0.708 0 0)` | `oklch(0.62 0 0)` | on background 2.58 to 3.64 |

`Button` and `IconButton` (`outlined`, `text`), `Chip`, `Field.Error`, the current day in `Calendar` and the `ClearButton` hover colour now use the new text tokens. Coloured text on white goes from 2.06-3.98:1 to 5.05-6.12:1.

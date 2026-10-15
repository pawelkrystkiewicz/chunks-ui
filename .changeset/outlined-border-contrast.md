---
"chunks-ui": minor
---

Fixed: in light mode the border of an `outlined` success or warning `Button` or `IconButton` was the fill colour, about 2:1 on white, and a control's border needs 3:1. These borders now use new tokens, `border-success-border` and `border-warning-border`, which cap the fill's lightness at 0.64 (success) and 0.67 (warning): 3.06:1 and 3.08:1 on white. A darker custom fill keeps its lightness. In dark mode the borders are still the fill (about 9.6:1). Set `--success-border` or `--warning-border` to use a different shade. To get the fill back as the border, set `--success-border-lightness: l` and `--warning-border-lightness: l` in `:root`; they are `min(l, 0.64)` and `min(l, 0.67)` by default. Browsers without relative colour syntax (before Chrome 119, Safari 18 and Firefox 128) now draw these borders in the text colour. See "Coloured Text" in the theme docs.

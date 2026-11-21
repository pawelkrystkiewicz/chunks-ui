---
"chunks-ui": minor
---

Changed: the optional `tailwindcss` peer is now `^4.3.1`, so Tailwind 4.0 to 4.3.0 is no longer supported. The per-component CSS (`chunks-ui/theme.core.css` with `chunks-ui/sources/<component>.css`) relies on a file that `@source not` excluded being included again by a later `@source`, which works from 4.3.1. An app on an older 4.x, `chunks-ui/theme.css` alone included, must upgrade Tailwind to 4.3.1 or newer.

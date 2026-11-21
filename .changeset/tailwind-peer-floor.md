---
"chunks-ui": minor
---

Changed: the optional `tailwindcss` peer is now `^4.3.1`. The per-component CSS (`chunks-ui/theme.core.css` with `chunks-ui/sources/<component>.css`) relies on a file that `@source not` excluded being included again by a later `@source`, which works from 4.3.1. On Tailwind 4.1.0 to 4.3.0 that CSS generates no component classes and shows no error, and on 4.0 the build fails with "@source paths must be quoted". `chunks-ui/theme.css` alone still works, but npm 7 or newer stops the install with an `ERESOLVE` error until Tailwind is 4.3.1 or newer; pnpm, Bun and Yarn print a warning. Upgrade Tailwind to fix it.

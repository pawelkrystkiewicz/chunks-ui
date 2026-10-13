---
"chunks-ui": minor
---

The default focus ring (`--ring`) is now a lighter shade of the primary, `color-mix(in oklch, var(--primary) 60%, var(--background))`, in light and dark mode. Before, it was a neutral grey (`oklch(0.62 0 0)` light, `oklch(0.556 0 0)` dark). With the default theme it measures about 2.4:1 on the light background and 2:1 on the dark one. Set `--ring` to use a colour of your choice.

The ring follows a `--primary` or `--background` that you set on `:root`. A nested element that sets either one keeps the ring of its parent, so declare `--ring` on that element too. See "Focus Ring" in the theme docs.

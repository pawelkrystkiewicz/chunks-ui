---
"chunks-ui": patch
---

Fixed: `cn` did not know the theme's z-index layers (`z-dropdowns`, `z-modals`, …) or easing curves (`ease-fluid`, `ease-snappy`), so an override kept both classes and CSS order decided the winner. `cn("z-dropdowns", "z-50")` now gives `z-50` and `cn("ease-fluid", "ease-in")` gives `ease-in`.

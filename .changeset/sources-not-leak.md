---
"chunks-ui": patch
---

Fixed: an app that imports only some `chunks-ui/sources/<component>.css` files got the classes of every component, unless its CSS used `@import "tailwindcss" source(none)`. Now it gets only the classes of those components. `chunks-ui/theme.core.css` must come before every `chunks-ui/sources/` import: in the other order the components get no classes. `chunks-ui/theme.css` alone is unchanged.

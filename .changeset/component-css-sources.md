---
"chunks-ui": minor
---

An app can now generate the CSS of only the components it uses. Import `chunks-ui/theme.core.css` in place of `chunks-ui/theme.css`, then `chunks-ui/sources/<component>.css` for each component the app renders, named after its docs page (`chunks-ui/sources/date-picker.css`). `chunks-ui/theme.css` alone works as before and still generates every component's classes.

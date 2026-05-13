---
"chunks-ui": patch
---

fix(icon-button): allow hover styles on nested SVG

Removed `[&_svg]:pointer-events-none` from IconButton's base classes.
Consumers can now apply `hover:` utilities directly to icon children
instead of wiring up `group` / `group-hover:`. No API change.

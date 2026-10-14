---
"chunks-ui": patch
---

`lucide-react` is no longer a dependency. The only icon it provided, the close button of `Toast`, is now drawn inline with the same shape, stroke and size, so toasts look exactly as before. The close icon no longer has the `lucide lucide-x` classes, so a global `svg.lucide` style does not reach it. An app that imports `lucide-react` without declaring it, relying on the copy that came with chunks-ui, must now add `lucide-react` to its own dependencies. Apps that already declare it are not affected.

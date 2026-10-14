---
"chunks-ui": patch
---

`lucide-react` is no longer a dependency. The only icon it provided, the close button of `Toast`, is now drawn inline with the same shape, stroke and size, so toasts look exactly as before. Apps that use Lucide icons themselves keep their own `lucide-react` dependency; nothing changes for them.

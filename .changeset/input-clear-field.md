---
"chunks-ui": patch
---

Fixed: inside a disabled `Field.Root`, `Input` showed its clear button as if enabled, with the pointer cursor and the hover feedback, and a click changed nothing. The field disables the input element through Base UI, not through the `disabled` prop the component read. The button now hides while the input is disabled or read-only, whichever sets it: `disabled`, `readOnly`, or a disabled `Field.Root`. The field case hides it by CSS, off the input element's `disabled` attribute, and an `endAdornment` shows in its place while it is hidden.

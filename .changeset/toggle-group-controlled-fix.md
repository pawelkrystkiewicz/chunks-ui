---
"chunks-ui": patch
---

Fix ToggleGroup controlled mode to respect rejected value changes

Previously, clicking to deselect an item would immediately update the internal indicator state, even if the parent component rejected the change via `onValueChange`. Now in controlled mode, the internal state only updates when the `value` prop actually changes, allowing patterns like preventing empty selection:

```tsx
onValueChange={(v) => v.length > 0 && setValue(v)}
```

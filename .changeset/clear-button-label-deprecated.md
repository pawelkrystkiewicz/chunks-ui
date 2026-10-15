---
"chunks-ui": patch
---

Deprecated: the `label` prop of `ClearButton`. Use `labels={{ clear: "…" }}`, as on the other components with built-in text, or `aria-label`. `label` still works and still takes precedence over `labels`. When both `aria-label` and `label` are set, `aria-label` now wins; before, `label` did.

```tsx
// Before
<ClearButton label="Remove tag" />
// After
<ClearButton labels={{ clear: "Remove tag" }} />
```

---
"chunks-ui": minor
---

Deprecated: the `label` prop of `ClearButton`. Use `labels={{ clear: "…" }}`, as on the other components with built-in text, or `aria-label`. `label` still works and still takes precedence over `labels`.

```tsx
// Before
<ClearButton label="Remove tag" />
// After
<ClearButton labels={{ clear: "Remove tag" }} />
```

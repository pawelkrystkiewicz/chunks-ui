---
"chunks-ui": minor
---

Fixed: `ToggleGroup.Root`'s `onValueChange` received `string[]` whatever `value` or `defaultValue` you passed, so a typed `useState` setter needed a wrapper or a cast. It now infers the item type from `value`, `defaultValue` or an annotated `onValueChange`, like `Radio.Group` and `Accordion.Root`, and `ToggleGroupRootProps` takes the same optional type parameter. One compile-time difference: an inline `defaultValue={["bold"]}` now types the handler's value as `"bold"[]`, as Base UI's own `ToggleGroup` does, so annotate the handler (`(next: string[]) => …`) or write `<ToggleGroup.Root<string>>` to get `string[]`. No runtime change.

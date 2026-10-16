---
"chunks-ui": minor
---

Fixed: `ToggleGroup.Root`'s `onValueChange` received `string[]` whatever `value` or `defaultValue` you passed, so a `useState` setter with a narrower type needed a wrapper or a cast. `ToggleGroup.Root` now infers the type of one item's value from `value`, `defaultValue` or an annotated `onValueChange`, like `Radio.Group` and `Accordion.Root`, so a typed `useState` setter is an `onValueChange`:

```tsx
const [pressed, setPressed] = useState<("bold" | "italic")[]>([]);
<ToggleGroup.Root multiple value={pressed} onValueChange={setPressed}>…</ToggleGroup.Root>
```

`ToggleGroupRootProps` takes the same optional type parameter (`ToggleGroupRootProps<"bold" | "italic">`); an item's value is a string, as Base UI requires. Without a value to infer from, or without the parameter, it is `string`, as before. One difference at compile time: an inline `defaultValue={["bold"]}` (or `value`) now types the handler's value as `"bold"[]` instead of `string[]`, as Base UI's own `ToggleGroup` does, so `next.includes("italic")` in the handler no longer compiles. Annotate the handler (`(next: string[]) => …`) or pass the item type (`<ToggleGroup.Root<string> …>`) to get `string[]` back. No runtime change.

---
"chunks-ui": minor
---

`Radio.Group`, `Accordion.Root` and `Slider.Root` now infer the type of `value`, `defaultValue` and the value `onValueChange` receives from the `value` or `defaultValue` you pass, so a `useState` setter is an `onValueChange`:

```tsx
const [value, setValue] = useState<"a" | "b">("a");
<Radio.Group value={value} onValueChange={setValue}>…</Radio.Group>
```

Before, the value was `unknown` on `Radio.Group`, `unknown[]` on `Accordion.Root` and `number | readonly number[]` on `Slider.Root`, so `onValueChange={setValue}` needed a wrapper or a cast. `Accordion.Root` infers the type of one item's value; its `value`, `defaultValue` and callback are arrays of it. `Slider.Root` infers `number` or an array of numbers, so `useState(50)` and `useState([20, 80])` both work. `RadioGroupProps`, `AccordionRootProps` and `SliderRootProps` take the same optional type parameter (`RadioGroupProps<"a" | "b">`). Without `value`, `defaultValue` or a typed `onValueChange`, or without the parameter, the types are as before (`unknown`, `unknown[]`, `number | readonly number[]`). No runtime change.

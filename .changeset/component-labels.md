---
"chunks-ui": minor
---

Added: a `labels` prop that replaces the built-in English text of a component, for example to translate it. Pass only the keys you want to change; the others keep their English default.

```tsx
<Combobox.Root labels={{ trigger: "Pokaż opcje", clear: "Wyczyść wybór", chipRemove: "Usuń" }}>
```

These components take it: `Breadcrumb.Root`, `Calendar`, `Chip`, `ClearButton`, `Combobox.Root`, `CopyButton`, `DatePicker`, `Input`, `InputCopy`, `NumberField.Root`, `Pagination.Root`, `Slider.Root`, `ThemeToggle` and `Toast.Viewport`. Each one exports the type of its labels (`ComboboxLabels`) and its English defaults (`DEFAULT_COMBOBOX_LABELS`), typed read-only. Text that depends on data is a function: the `Calendar` keys get the date they describe, so you can pass `Intl` formatters. `DatePicker` takes the `Calendar` keys too and passes them to its calendar. An `aria-label` on a part still wins over `labels`, and so do the props that already set the same text (`placeholder` on `DatePicker`, `label` on `ClearButton`, `children` on `Pagination.Previous` and `Pagination.Next`, `getAriaValueText` and `aria-valuetext` on `Slider.Thumb`). An `aria-labelledby` on `ClearButton` turns its default name off.

Changed: the remove button of a `Chip` and `Combobox.ChipRemove` are now named after their chip, "Remove Apple" instead of "Remove". A test that finds the button by the exact name "Remove" must now include the chip's text. A `{chip}` in `labels.remove` (`Chip`) or `labels.chipRemove` (`Combobox`) marks where the chip's text goes: `"{chip} を削除"` reads "Apple を削除". Only the first `{chip}` counts. The `Chip` root now always renders an `id`: a generated one unless you pass `id`.

Fixed: the copy button of `InputCopy` now reads "Copied" after a copy, as `CopyButton` does. Before, `InputCopy` set a fixed "Copy to clipboard" name on it.

Fixed: screen readers now read the "More" of `Breadcrumb.Ellipsis`. Before, the whole ellipsis was `aria-hidden`, its text included.

`Combobox.Root` is now a chunks-ui component that wraps Base UI's. `ComboboxRootProps` keeps its shape when used without type arguments and now takes them too (`ComboboxRootProps<Value, Multiple, Item>`).

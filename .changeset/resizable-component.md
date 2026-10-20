---
"chunks-ui": minor
---

Added `Resizable`: a split-pane layout with `Resizable.Group`, `Resizable.Panel`, `Resizable.Handle` and an optional decorative `Resizable.Grip` for the handle, horizontal or vertical, sizes in px and %, pointer and keyboard resizing (RTL aware), and `defaultLayout`, `layout`, `onLayoutChange` and `sanitizeLayout` (also in `chunks-ui/utils`, for Server Components) to save and restore the layout without storage code in the component.

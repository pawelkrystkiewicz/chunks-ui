---
"chunks-ui": patch
---

The `ToggleGroup` indicator no longer springs when the group or an item changes size. A change of font size, padding or container width moves the pill to the pressed item at once, so it doesn't trail behind it. Only pressing another item slides the pill, with Motion and with the CSS fallback. A size change during a slide changes where the slide ends. Without Motion, the indicator's CSS transition is now off except during a slide.

Fixed:

- The indicator now follows the pressed item when only that item changes size or is shown again, in a group that keeps its size. It also follows a padding change of a group sized by its items. Before, it was measured again only when the group's content box changed size.
- A group shown again after `display: none` or `<Activity>` now paints the indicator over the pressed item in its first frame, also when another item was pressed while the group was hidden. Before, the first frame had no indicator. A group with a default value also shows the indicator in its first frame.
- A resize just before another item was pressed no longer moves the indicator back to the item pressed before, one frame later.

---
"chunks-ui": patch
---

Fixed: a `ToggleGroup` nested inside another `ToggleGroup` took its pill state from the other group. A disabled pressed item in one group dimmed the pill of the other. In an outer group without a pill (a `multiple` group, or one with no item pressed), the pressed item of the inner group also drew a pill of its own, which jumped to a newly pressed item while the inner pill slid. Each group now dims and draws its pill from its own items. An item wrapped in an element of its own, rather than placed directly in its group, can still take the other group's state.

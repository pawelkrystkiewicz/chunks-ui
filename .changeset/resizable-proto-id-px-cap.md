---
"chunks-ui": patch
---

Fixed: a `Resizable.Panel` whose `id` is `__proto__` gave `[object Object]` as its size and `NaN` after a drag; it is now treated as a panel without an `id` (a generated one and a warning in development) and resizes like any other.

Fixed: a stored px size far above the group (about 1e19px and up) left a panel at 0px or gave `NaN`; it now fits like a smaller one.

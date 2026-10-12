---
"chunks-ui": patch
---

Fixed: under `dir="rtl"`, the `Toast` viewport now sits bottom-left, at the inline end, and toasts slide in and out past the left edge instead of the right. The direction is the toast's own, so a toast in a left-to-right section of a right-to-left page still slides from the right. A toast can now be swiped away to the left as well as to the right and down, and it leaves the way it was swiped; pass `swipeDirection` to `Toast.Root` to change that. Left-to-right layout is unchanged. A toast hidden past the provider's `limit` now slides in when a newer one closes; before, it appeared without its enter transition, in both directions. With reduced motion, toasts still appear and leave without moving.

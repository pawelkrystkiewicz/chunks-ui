---
"chunks-ui": minor
---

Fixed: under `dir="rtl"`, the `Toast` viewport now sits bottom-left, at the inline end, and toasts slide in and out past the left edge instead of the right. The direction is the toast's own, so a toast in a left-to-right section of a right-to-left page still slides from the right. Left-to-right layout is unchanged. In both directions a toast can now be swiped away left or right, and it leaves the way it was swiped (down too); before, Base UI's default allowed down and right only. With reduced motion, toasts still appear and leave without moving.

To keep the viewport at the bottom-right under RTL, pass `className="end-auto right-4"` to `Toast.Viewport`. The swipe directions of the toasts the default viewport renders cannot be changed; where you render `Toast.Root` yourself, pass `swipeDirection={["down", "right"]}` for the old set.

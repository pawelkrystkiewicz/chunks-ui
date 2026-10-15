---
"chunks-ui": minor
---

In the default `Toast.Viewport`, toasts past the provider's `limit` (3 by default) are now hidden and take no space, and a hidden toast slides in when a newer one closes. Before, they stayed on screen as inert cards whose buttons did not respond. The opt-in `toast-stack` pattern does not change. To show more toasts at once, raise `limit` on `Toast.Provider`; a test that expects every added toast to be visible must count only the first `limit`.

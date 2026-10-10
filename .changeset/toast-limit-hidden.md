---
"chunks-ui": patch
---

In the default `Toast.Viewport`, toasts past the provider's `limit` (3 by default) are now hidden and take no space. Before, they stayed on screen as inert cards whose buttons did not respond. A hidden toast shows again when a newer one closes. The opt-in `toast-stack` pattern does not change.

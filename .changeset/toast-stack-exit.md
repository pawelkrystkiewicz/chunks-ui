---
"chunks-ui": patch
---

Fixed: a closing toast in the opt-in `toast-stack` pattern vanished at once instead of sliding out. The stack moves its toasts along `transform`, while `Toast.Root` slides along `translate`, which the stack's transition did not cover, so the toast jumped off the page. A stacked toast now ignores the `translate` slide and leaves the way it entered, downward, over the stack's 500ms.

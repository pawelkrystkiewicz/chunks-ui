---
"chunks-ui": patch
---

Fixed: a closing toast in the opt-in `toast-stack` pattern vanished at once instead of sliding out. It now leaves over 500ms, downward when closed and in the swipe direction when swiped.

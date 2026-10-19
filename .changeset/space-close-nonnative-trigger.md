---
"chunks-ui": patch
---

Fixed: a popup whose trigger is not a native button (`nativeButton={false}`, rendered as a `<span>` or `<div>`) opened again after a close made by the Space key, as when a `Menu.Item` was picked with Space, or a keydown handler inside the popup set `open` to false on Space. Base UI clicks such a trigger on a Space keyup, and the keyup of the closing Space now does nothing on the trigger.

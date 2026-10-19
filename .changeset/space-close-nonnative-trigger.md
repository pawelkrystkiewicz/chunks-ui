---
"chunks-ui": patch
---

Fixed: a popup whose trigger is not a native button (`nativeButton={false}`, rendered as a `<span>` or `<div>`) opened again after a close made by the Space key, as when a keydown handler inside it set `open` to false on Space. Focus went to the trigger before Space came up, and Base UI clicks such a trigger on a Space keyup. Focus now goes to the trigger at that keyup.

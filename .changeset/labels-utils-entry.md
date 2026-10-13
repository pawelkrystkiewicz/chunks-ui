---
"chunks-ui": minor
---

Added: `chunks-ui/utils` exports the English label defaults of every component (`DEFAULT_COMBOBOX_LABELS`, `DEFAULT_CALENDAR_LABELS` and the others) and their `<Component>Labels` types. A React Server Component can now read the defaults: from `chunks-ui`, which starts with `"use client"`, each export is a client reference.

```tsx
import { DEFAULT_COPY_BUTTON_LABELS } from "chunks-ui/utils";
```

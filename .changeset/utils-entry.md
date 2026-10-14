---
"chunks-ui": minor
---

Added: a `chunks-ui/utils` entry for React Server Components. The `chunks-ui` bundle starts with `"use client"`, so in a server component each of its exports is a client reference, and a call such as `cn(...)` or `buttonVariants(...)` threw "Attempted to call buttonVariants() from the server but buttonVariants is on the client". `chunks-ui/utils` has no `"use client"` and no React code, so its functions run on the server:

```tsx
import { buttonVariants, cn, DEFAULT_COPY_BUTTON_LABELS } from "chunks-ui/utils";
```

It exports `cn`, `cnState`, `buttonVariants`, `chipVariants`, `iconButtonVariants`, `inputVariants`, `springs`, the `ELEMENT_*` constants, the `ClassInput`, `StateClassName` and `Element*` types, and the English label defaults of every component (`DEFAULT_COMBOBOX_LABELS`, `DEFAULT_CALENDAR_LABELS` and the others) with their `<Component>Labels` types, so a server component can read the defaults too. `chunks-ui` still exports all of them, so existing imports do not change. `cn` from `chunks-ui` and from `chunks-ui/utils` is the same function, with one tailwind-merge cache.

Like `chunks-ui`, the entry gives `require` the CommonJS typings (`dist/utils.d.cts`) and `import` the ESM typings (`dist/utils.d.ts`).

---
"chunks-ui": minor
---

Added: a `chunks-ui/utils` entry for React Server Components. The `chunks-ui` bundle starts with `"use client"`, so in a server component each of its exports is a client reference, and a call such as `cn(...)` or `buttonVariants(...)` threw "Attempted to call buttonVariants() from the server but buttonVariants is on the client". `chunks-ui/utils` has no `"use client"` and no React code, so its functions run on the server:

```tsx
import { buttonVariants, cn } from "chunks-ui/utils";
```

It exports `cn`, `cnState`, `buttonVariants`, `chipVariants`, `iconButtonVariants`, `inputVariants`, `springs`, the `ELEMENT_*` constants, and the `ClassInput`, `StateClassName` and `Element*` types. `chunks-ui` still exports all of them, so existing imports do not change.

---
"chunks-ui": minor
---

Toast ships production-ready out of the box with per-type icons, colored accent bars, and correct TypeScript typing — no custom wrapping required.

**What's new**

- **Per-type styling**: Passing `type: 'success' | 'error' | 'warning' | 'info'` to `toast.add()` now renders a matching lucide icon (`CheckCircle2`, `XCircle`, `AlertTriangle`, `Info`) and color-token accent (`--success`, `--destructive`, `--warning`, `--primary`). Unknown types fall back to `Info` + `text-muted-foreground`.
- **Rounded accent bar**: A full-height 4px accent stripe is rendered on the left of each toast via an absolutely-positioned child inside an `overflow-hidden rounded-xl` root, so the bar follows the corner radius cleanly instead of producing a jag.
- **Top-level `createToastManager`**: Now importable directly — `import { createToastManager } from 'chunks-ui'` — in addition to the existing `Toast.createToastManager` compound property.
- **lucide-react** added as a direct dependency of `chunks-ui` (tree-shaken per-icon, ~1KB per icon).

**Fixed**

- `ToastRoot` previously forwarded the required `toast` prop to Base UI via an untyped `...props` spread. It now destructures `toast` explicitly and passes it by name, closing a latent typing hole that would have silently dropped the prop on any future refactor.

**Breaking (minor)**

- `<Toast.Root>` now requires the `toast` prop at the call site. The type already required it via `ComponentProps<typeof BaseToast.Root>`, but the runtime implementation silently tolerated omission via spread. Hand-rolled `<Toast.Root>` callers must now pass `toast={...}` explicitly — the compound `<Toast.Viewport>` already does this internally, so the vast majority of consumers are unaffected.

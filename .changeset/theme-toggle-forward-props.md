---
"chunks-ui": patch
---

`ThemeToggle` now forwards `ref` and every other `<button>` prop (`id`, `aria-*`, `data-*`, `disabled`, event handlers) to its `<button>`. `ThemeToggleProps` extends `ComponentProps<"button">` without `children`. Before, it accepted only `theme`, `onClick`, `lightIcon`, `darkIcon` and `className`, so it could not be a `Tooltip.Trigger` or `Popover.Trigger` render target: the trigger's ref and handlers were dropped and the tooltip never opened. Its default `aria-label` can now be overridden.

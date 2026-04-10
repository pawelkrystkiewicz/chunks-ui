---
"chunks-ui": minor
---

<!-- markdownlint-disable MD036 MD041 -->

Toast gains a set of per-toast styling slots, a reduced-motion-aware slide-in, an opt-in stacking pattern, and a top-level `createToastManager` export — all without adding runtime dependencies or shipping opinions about icons, colours, or semantic types.

**Per-toast styling — `ToastStyleOptions`**

Five new fields are merged into Base UI's `ToastObject` via TypeScript module augmentation, so they're type-safe at every `add()`, `update()`, and `promise()` call site. The interface is exported from the package root as `ToastStyleOptions`:

- `icon` — any `ComponentType<{ className?: string }>`. The library passes default sizing (`size-5 shrink-0 self-start`) via `className`, so lucide/heroicons components can be passed directly with no wrapper. Skipping the field renders a toast with no leading slot — there is no default icon.
- `iconClassName` — extra classes merged onto the icon (use for colour, e.g. `text-success`).
- `className` — extra classes merged onto `Toast.Root` (use for per-toast accent bars, borders, background tints).
- `dissmissable` — renders a `×` close button on that specific toast.
- `onClose` — click handler for the close button; implicitly enables the button even without `dissmissable: true`.

The library ships no semantic types, no default colours, and no icon library. Downstream consumers can build whatever pattern their design system needs — the docs show a ~20-line `TYPE_STYLES` map that covers `primary | success | destructive | warning` in pure data, with zero closures or factory functions.

**Stacking pattern (opt-in CSS)**

Two classes added to `theme.css`, ported verbatim from Base UI's reference stacking example:

- `.toast-stack-viewport` — overrides the default flex-column layout on `Toast.Viewport` so children can absolute-stack at the same anchor point.
- `.toast-stack` — applied per-toast via `add({ className: "toast-stack" })`. Drives the collapsed/expanded deck off every per-root CSS variable Base UI exposes (`--toast-index`, `--toast-height`, `--toast-frontmost-height`, `--toast-offset-y`, `--toast-swipe-movement-x/y`) and responds to `data-expanded`, `data-starting-style`, `data-ending-style`, `data-swipe-direction`, and `data-limited`. Includes a `::after` gap-filler so hovering across toasts doesn't collapse the deck mid-scrub.

Plus a `.toast-stack .ToastContent[data-behind]` rule that fades the text of toasts sitting behind the frontmost one in the stack, with a `[data-expanded]` override that restores it on hover. Both are scoped under `.toast-stack` so regular (non-stacked) viewports are unaffected. All stacking transitions are gated behind `@media (prefers-reduced-motion: reduce)`.

To enable the pattern, the `ToastViewport` internals now render their content wrapper as `<BaseToast.Content>` (exposing Base UI's `data-behind` attribute) and carry stable `Toast` / `ToastContent` class-name hooks for custom CSS targeting.

**Reduced motion**

`ToastRoot` now calls `useReducedMotion()` and gates the slide-in/out transitions (`micro-interactions`, `data-starting-style:translate-x-full`, `data-ending-style:translate-x-full`, `transition-[transform,opacity]`) behind `!reduced`. Users with `prefers-reduced-motion: reduce` get an instant appearance instead of a 300 ms slide.

**Top-level `createToastManager`**

Now importable directly as `import { createToastManager } from 'chunks-ui'` in addition to the existing `Toast.createToastManager` compound property. Zero runtime change — just an additive export to match the `Toast` barrel.

**Fixed — latent typing hole in `ToastRoot`**

Previously the required `toast` prop flowed into Base UI's `Toast.Root` via an untyped `...props` spread. `ToastRoot` now destructures `toast` explicitly and passes it by name, closing a latent hole that would have silently dropped the prop on any future refactor.

**Breaking (minor)**

- `<Toast.Root>` now requires the `toast` prop at the call site. The type already required it via `ComponentProps<typeof BaseToast.Root>`, but the runtime implementation silently tolerated omission via spread. Hand-rolled `<Toast.Root>` callers must now pass `toast={...}` explicitly — the compound `<Toast.Viewport>` already does this internally, so consumers using the standard `<Toast.Provider>` + `<Toast.Viewport>` pattern are unaffected.

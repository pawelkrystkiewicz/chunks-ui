---
"chunks-ui": minor
---

`Tabs.Indicator` now shows on a server-rendered page before React hydrates. It turns on Base UI's `renderBeforeHydration` by default (Base UI's own default is `false`), so Base UI renders a small inline `<script>` after the indicator that measures the active tab and places the pill over it. Pass `renderBeforeHydration={false}` to opt out; the pill then shows after hydration, as before.

The script is inline, so a CSP that doesn't allow inline scripts (no `'unsafe-inline'` in `script-src`, or `default-src` when `script-src` is absent, or a nonce, hash or `'strict-dynamic'`, which make browsers ignore `'unsafe-inline'`) blocks the script and reports a violation. Pass your per-request nonce to Base UI's `CSPProvider` (`@base-ui/react/csp-provider`), or opt out with `renderBeforeHydration={false}`.

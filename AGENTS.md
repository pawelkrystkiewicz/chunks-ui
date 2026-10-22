# Chunks UI

Personal React 19+ component library replacing `@creation-ui/react`. Two npm packages: `chunks-ui` (React) and `chunks-ui-core` (the framework-free layer it depends on).

## Stack

- Headless: `@base-ui/react` v1.9+ (includes Floating UI)
- Styling: Tailwind CSS v4 + CVA + `clsx` + `tailwind-merge`
- Animation: Motion 12.8+ (optional peer dep)
- Build: tsup (ESM + CJS + .d.ts)
- Test: Vitest + Testing Library + jest-axe
- Lint/Format: Biome
- Package manager: Bun
- Versioning: Changesets + Conventional Commits
- Monorepo: Turborepo

## Structure

- `packages/core/` — the published `chunks-ui-core` package: no React, no Base UI, no Motion, no `"use client"`
- `packages/core/src/components/<name>/` — a component's `*.Variants.ts` and `*.Labels.ts` files (e.g. `button/Button.Variants.ts`)
- `packages/core/src/lib/cn.ts` — `clsx` + `tailwind-merge` helper
- `packages/core/src/lib/cva.ts` — `cva` for the Variants files (internal to core, not exported)
- `packages/core/src/lib/motion.ts` — shared spring presets
- `packages/core/src/theme.css` — CSS variables (OKLCH, shadcn convention)
- `packages/core/src/index.ts` — barrel export (everything it exports is semver-tracked)
- `packages/ui/` — the published `chunks-ui` package; depends on `chunks-ui-core`
- `packages/ui/src/components/` — one folder per component (e.g. `button/Button.tsx`, `button/index.ts`)
- `packages/ui/src/lib/use-motion.ts` — `useMotion()` (lazy Motion loader) + `useReducedMotion()` hooks
- `packages/ui/src/lib/PopupMotion.tsx` — `createPopupRenderer()` for Base UI popup animations
- `packages/ui/src/lib/use-popup-render.ts` — `usePopupRender()`: a popup part's `render`, Motion spring or CSS path
- `packages/ui/src/theme.css` — a two-line wrapper: `@import "chunks-ui-core/theme.css"` and an `@source` for ui's own `dist`
- `packages/ui/src/utils.ts` — `chunks-ui/utils`: named re-exports from `chunks-ui-core`, for React Server Components
- `packages/ui/src/index.ts` — barrel export
- `apps/docs/` — Next.js 16 + Nextra 4 docs site

## Commands

- `bun install` — install dependencies
- `bun run build` — build all packages (Turborepo)
- `bun run dev` — start dev mode (watch)
- `bun run test` — run unit tests
- `bun run test:unit:coverage` — tests with V8 coverage report
- `bun run lint` — lint + format (Biome)
- `bun run check-types` — TypeScript strict mode typecheck
- `bun run format` — auto-format with Biome
- `bun run clean` — remove dist, node_modules, .turbo, .next

### Visual Regression Testing

- `bun run test:visual` — run visual regression tests (requires Playwright browsers)
- `bun run test:visual:update` — update visual snapshots locally
- `bun run test:webkit` — run the WebKit smoke tests (requires `bunx playwright install webkit` once)
- `bun run update:screenshots` — **trigger GitHub Actions workflow** to update screenshots on current branch (interactive, uses `gh` CLI)

## Key Conventions

- Always use `bun`, never `npm`/`yarn`/`pnpm`
- Components use Base UI compound pattern: `<X.Root>`, `<X.Trigger>`, `<X.Content>`
- Composition via Base UI `render` prop, not `asChild`
- Variants defined with CVA in separate `*.Variants.ts` files in `packages/core/src/components/<name>/`; import `cva` from `packages/core/src/lib/cva`, not from `class-variance-authority`
- A **new** component's Variants and Labels files go in `packages/core/src/components/<name>/` from the start. An existing component's inline class strings stay in its `packages/ui` file until it is ported (Phase 3 of `docs/SOLID_MIGRATION.md`). The ui component imports the exports of those files from `chunks-ui-core`, and its `index.ts` re-exports the public ones from there
- A new Labels module is exported from `packages/core/src/index.ts` and named in `packages/ui/src/utils.ts` and `packages/ui/src/index.ts` (named re-exports, not `export *`)
- CSS variables follow shadcn/ui naming: `--primary`, `--destructive`, `--success`, `--warning`
- Props over config objects: `<Button color="primary" variant="outlined">`
- One component, one job — no mode-switching god components
- Motion presets from `packages/core/src/lib/motion.ts` — no magic numbers in component files
- Components must work without Motion installed (CSS transition fallback)
- Respect `prefers-reduced-motion`
- Commits: `type(scope): message` (e.g. `feat(tabs): add indicator animation`)
- Visual tests for time-dependent components (Calendar, etc.) must use `vi.useFakeTimers()` to freeze dates

## Reference

- Component scope, selection criteria, and why components were removed: `CONTRIBUTING.md`
- Testing patterns, what to test, and CI setup: `TESTING_STRATEGY.md`

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

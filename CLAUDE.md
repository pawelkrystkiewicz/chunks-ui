# Chunks UI

Personal React 19+ component library. Single npm package (`chunks-ui`) replacing `@creation-ui/react`.

## Stack

- Headless: `@base-ui/react` v1.2+ (includes Floating UI)
- Styling: Tailwind CSS v4 + CVA + `clsx` + `tailwind-merge`
- Animation: Motion v12+ (optional peer dep)
- Build: tsup (ESM + CJS + .d.ts)
- Test: Vitest + Playwright CT
- Lint/Format: Biome
- Package manager: Bun
- Versioning: Changesets + Conventional Commits
- Monorepo: Turborepo

## Structure

- `packages/ui/` — the published `chunks-ui` package
- `packages/ui/src/components/` — one folder per component (e.g. `button/Button.tsx`, `button/Button.Variants.ts`, `button/index.ts`)
- `packages/ui/src/lib/cn.ts` — `clsx` + `tailwind-merge` helper
- `packages/ui/src/lib/motion.ts` — shared spring presets
- `packages/ui/src/theme.css` — CSS variables (OKLCH, shadcn convention)
- `packages/ui/src/index.ts` — barrel export
- Docs site lives alongside in the monorepo

## Commands

- `bun install` — install dependencies
- `bun run build` — build the package
- `bun run test` — run unit tests
- `bun run lint` — lint + format (Biome)

## Key Conventions

- Always use `bun`, never `npm`/`yarn`/`pnpm`
- Components use Base UI compound pattern: `<X.Root>`, `<X.Trigger>`, `<X.Content>`
- Composition via Base UI `render` prop, not `asChild`
- Variants defined with CVA in separate `*.Variants.ts` files
- CSS variables follow shadcn/ui naming: `--primary`, `--destructive`, `--success`, `--warning`
- Props over config objects: `<Button color="primary" variant="outlined">`
- One component, one job — no mode-switching god components
- Motion presets from `src/lib/motion.ts` — no magic numbers in component files
- Components must work without Motion installed (CSS transition fallback)
- Respect `prefers-reduced-motion`
- Commits: `type(scope): message` (e.g. `feat(tabs): add indicator animation`)

## Reference

- Full PRD with component list, color system, and architecture decisions: `PRD.md`
- Testing patterns, what to test, and CI setup: `TESTING_STRATEGY.md`

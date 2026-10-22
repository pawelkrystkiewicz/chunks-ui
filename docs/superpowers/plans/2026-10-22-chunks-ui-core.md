# chunks-ui-core Extraction (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move chunks-ui's framework-free layer into a new published package, `chunks-ui-core`, that `chunks-ui` depends on, with no change to what `chunks-ui` and `chunks-ui/utils` export.

**Architecture:** `git mv` the framework-free files from `packages/ui/src` into `packages/core/src` at the same relative paths, so the imports inside them stay valid. `chunks-ui` imports them from `"chunks-ui-core"` (a real dependency, external to its build). Inside the workspace, a `chunks-ui-source` export condition lets ui's tests and typecheck read core's source, so no step depends on a fresh `packages/core/dist`.

**Tech Stack:** Bun 1.4.3 workspaces (isolated linker), Turborepo, tsup, Vitest 4 + jsdom, Tailwind CSS v4, CVA, Changesets, GitHub Actions.

**Spec:** `docs/SOLID_MIGRATION.md` — §2 inventory, §3 target layout, §4 Phase 1, §6 decisions 1, 2, 3 and 8. It and this plan are committed on branch `refactor/chunks-ui-core`.

**Decided 2026-10-22 (Paweł):**

- D1: start Phase 1 now. The Phase 0 spike runs before Phase 2.
- D2: the first publish is a placeholder `0.0.0` (Task 4).
- D3: a new component's Variants and Labels files go in core from day one.
- D4 (default, not contested): core exports the resizable barrel flat while it is 0.x.

## Global Constraints

- `bun` only, never npm/yarn/pnpm. The one exception is Task 4, which Paweł runs himself.
- Package name `chunks-ui-core`, unscoped (decision 1). It is in `dependencies` of `chunks-ui`, not `peerDependencies` (decision 2).
- The range is `"chunks-ui-core": "^0.0.0"`, **never `workspace:*`**: `changeset publish` runs `npm publish`, which ships `workspace:*` as-is. Bun links the workspace package for a plain range (checked 2026-10-22: a symlink to `../../core`, and `workspace:packages/core` in `bun.lock`).
- Core imports nothing from `react`, `react-dom`, `@base-ui/react` or `motion`. It has no `"use client"`, no `.tsx` and no minification (Tailwind scans the built strings).
- Core `dependencies`: `clsx ^2.1.1`, `tailwind-merge ^3.7.0`. `peerDependencies`: `class-variance-authority ^0.7.1`, `tailwindcss ^4.0.0` (optional). `engines.node`: `>=22.23.3`.
- `chunks-ui` and `chunks-ui/utils` export exactly the names they export today (decision 8). `packages/ui/src/index.ts` uses named re-exports only, because Next.js rejects `export *` in a `"use client"` module.
- Core's `exports` has `.` (ESM + CJS + types), `./theme.css` as a plain string target (Bun's and Tailwind's resolvers both read it), and `./package.json`. `sideEffects: ["*.css"]`.
- Commits use `type(scope): message` and end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Never run `git clean` or a bare `git stash`. Delete files by exact path.
- One branch and one PR for Tasks 1–3, pushed once at the end. Task 2 has to land with Task 1, because CI's `check:no-motion` fails without it.

## Where this plan departs from the spec

1. `lib/cva.ts` and `lib/cva.spec.ts` move as well. The spec's inventory leaves them out, but all 7 Variants files import `cva` from there. `cva` stays internal to core and is not exported.
2. `components/resizable/Resizable.Variants.ts` moves. It was added after the inventory, and it is the same kind of file.
3. `chunks-ui/utils` becomes named re-exports of today's names, not `export * from "chunks-ui-core"`. §3 says `export *`; decision 8 is later and wins.
4. The second, banner-free tsup build stays, because it is what keeps `"use client"` out of `dist/utils.*`. Only the `importFromUtils` plugin goes.
5. Core copies ui's tree (`src/components/<name>/`, `src/lib/`, `src/types.ts`, `src/theme.css`) instead of using `src/<name>/`. That way `git mv` leaves every import inside the moved files valid.
6. Core starts at `0.0.0`. The changeset is `minor`, so Version Packages makes it `0.1.0`.

## Review Focus

1. **A Tailwind app that imports `chunks-ui/theme.css`** has to get the classes that now live only in core's dist (Button's `disabled:pointer-events-none`, `FIELD_TEXT_SIZE`'s `md:[@media(pointer:coarse)]:text-base`). That takes two hops: a nested `@import "chunks-ui-core/theme.css"`, then core's own `@source "./"`. Pinned by `bun run check:tailwind` in Task 1, Step 15. Its `KNOWN_CLASS` and `TOUCH_SIZE` are now in core's dist only, so a pass proves both hops on Tailwind 4.0.0 and on the installed version, under the isolated linker (pnpm-like).
2. **Core is edited and ui is tested before core is rebuilt.** ui's tests and typecheck must read core's source. Pinned in Task 1, Step 11: delete `packages/core/dist`, then run ui's tests and typecheck.
3. **A React Server Component imports `sanitizeLayout` from `chunks-ui/utils`.** `dist/utils.*` must stay banner-free and reach no client-only package. Pinned by ui's `check:dist` (the banner check, kept) and by core's import-graph spec (Task 1, Step 4).
4. **Consumers on node10 resolution or on CJS.** `chunks-ui`'s typings now import `chunks-ui-core`, and `require("chunks-ui")` requires it. Pinned by core's `check:exports` (attw, node10 included), ui's `check:dist` (loads the CJS entries) and `check:no-motion`'s typecheck under each resolution, which runs against the local core tarball (Task 2, Step 1).
5. **`cn` from `chunks-ui` and `cn` from `chunks-ui/utils` must be the same function**, with one tailwind-merge cache. Pinned by the identity checks in `utils.spec.ts` and `check:dist`. Both are kept.

---

### Task 1: Extract `chunks-ui-core`

**Files:**

- Move (`git mv`, same relative path under `packages/core/src/`), from `packages/ui/src/`:
  - `theme.css`, `types.ts`, `components/shared.ts`
  - `lib/cn.ts`, `lib/cn.spec.ts`, `lib/cva.ts`, `lib/cva.spec.ts`, `lib/labels.ts`, `lib/labels.spec.ts`, `lib/motion.ts`, `lib/popup-arrow.ts`, `lib/arrow-padding.ts`, `lib/arrow-padding.spec.ts`
  - `lib/resizable/` (all 9 files)
  - `components/{avatar,button,chip,drawer,icon-button,input,resizable}/*.Variants.ts` (7 files)
  - `components/*/*.Labels.ts` (15 files)
  - `components/calendar/date.ts`, `components/calendar/date.spec.ts`
- Create: `packages/core/{package.json,tsconfig.json,tsup.config.ts,vitest.config.ts,LICENSE}`, `packages/core/scripts/{check-dist.ts,tsconfig.json}`, `packages/core/src/index.ts`, `packages/core/src/index.spec.ts`, `packages/core/src/lib/data-attr-spelling.spec.ts` (a copy), `packages/ui/src/theme.css` (the new wrapper), `.changeset/chunks-ui-core.md`
- Modify: `packages/ui/package.json`, `packages/ui/tsup.config.ts`, `packages/ui/src/{index.ts,utils.ts,utils.spec.ts,visual-test.css}`, `packages/ui/src/components/*/index.ts` (18 files), every ui file that imports a moved module (77 files), `packages/ui/{tsconfig.json,tsconfig.visual.json,scripts/tsconfig.json,vitest.config.ts,vitest.visual.config.ts}`, `packages/ui/scripts/check-dist.ts`, `packages/ui/scripts/check-dist.spec.ts`, `apps/docs/app/create/theme-css.test-helpers.ts`, `bun.lock`

**Interfaces:**

- Produces: package `chunks-ui-core`. Its `src/index.ts` has `export * from` each moved non-spec module except `lib/cva.ts`, and for resizable it re-exports the `lib/resizable` barrel, not the individual files. All of it is public API (decision 8): today's `chunks-ui/utils` names, plus `arrowPopupClasses`, `arrowClasses`, `arrowPaddingIn`, the 9 `shared.ts` constants, the Drawer/Avatar/Resizable class sets, the `date.ts` helpers and the whole resizable barrel.
- Produces: export condition `chunks-ui-source` → `./src/index.ts`. Task 2 and the future `chunks-ui-solid` use it.

- [ ] **Step 1: Record the baseline coverage**

Run: `bun run build && bun run --cwd packages/ui test:unit:coverage`
Copy the four totals from `packages/ui/coverage/coverage-summary.json` into the scratchpad. Step 14 compares against them.

- [ ] **Step 2: Move the files**

Make the target directories, then `git mv` each file listed under **Files** to the same path under `packages/core/src/`. Expected: `git status` shows the moves as renames.

- [ ] **Step 3: Write core's package files**

- `package.json`: name, version `0.0.0`, the description "Framework-free layer of chunks-ui: Tailwind CSS v4 theme, class sets, cn and pure helpers shared by its React and Solid bindings.", `type: module`, `license: MIT`, `sideEffects`, `exports`, `engines`, `files: ["dist","README.md","CHANGELOG.md","LICENSE"]`, the dependencies and peers from Global Constraints, and `repository.directory: packages/core`. Copy `bugs`, `homepage` and `publishConfig` (`access: public`, `provenance: true`) from ui. `exports["."]` is `{ "chunks-ui-source": "./src/index.ts", "import": { types, default }, "require": { types, default } }`, with the condition key first. Add top-level `main`, `module` and `types` for node10. Scripts: `build` (tsup), `dev` (tsup --watch), `test`, `test:unit:coverage`, `lint` (biome check .), `check-types` (`tsc --noEmit && tsc -p scripts`), `check:dist`, `check:exports` (`attw --pack . --exclude-entrypoints ./theme.css`), `clean`. devDependencies: the ui versions of `@arethetypeswrong/cli`, `@chunks-ui/typescript-config`, `@vitest/coverage-v8`, `class-variance-authority`, `jsdom`, `tailwindcss`, `tsup`, `typescript`, `vite`, `vitest`.
- `tsconfig.json`: extends `@chunks-ui/typescript-config/base.json`; `lib: ["dom","dom.iterable","ESNext"]`, `target: ESNext`, `noUncheckedIndexedAccess: true`, `types: ["vite/client"]`, `include: ["src"]`. No `jsx` option.
- `scripts/tsconfig.json`: like ui's, with `types: ["bun"]` and `include: [".", "../src/index.ts"]`.
- `tsup.config.ts`: one build, entry `src/index.ts`, `format: ["cjs","esm"]`, `dts: true`, `onSuccess` copies `src/theme.css` to `dist/theme.css`. No banner. No minify.
- `vitest.config.ts`: `process.env.TZ = "Europe/Warsaw"` (with ui's comment), `environment: "jsdom"`, `include: ["src/**/*.spec.ts"]`, `passWithNoTests: false`, `css: { include: [/theme\.css\?raw$/] }`. Coverage: `include: ["src/**/*.ts"]`, `exclude: ["**/*.spec.*","src/index.ts","**/*.Variants.ts"]`, and ui's thresholds (88/72/88/90).
- `LICENSE`: `cp packages/ui/LICENSE packages/core/LICENSE`.

- [ ] **Step 4: Write the failing import-graph spec `packages/core/src/index.spec.ts`**

Move `runtimeSpecifiers`, `resolveRelative`, `packageName`, `importGraph` and the `describe("runtimeSpecifiers")` case out of `packages/ui/src/utils.spec.ts` unchanged. Add:

```ts
const SERVER_SAFE_PACKAGES = ["class-variance-authority", "clsx", "tailwind-merge"];

describe("chunks-ui-core", () => {
  it("reaches no package but clsx, tailwind-merge and class-variance-authority", () => {
    const { files, packages } = importGraph("./index.ts");
    expect(files).toContain("./components/button/Button.Variants.ts");
    expect(files).toContain("./lib/resizable/layout.ts");
    expect(packages.filter((name) => !SERVER_SAFE_PACKAGES.includes(packageName(name) ?? ""))).toEqual([]);
  });

  it("reaches no module that declares 'use client'", () => {
    const { files } = importGraph("./index.ts");
    expect(files.filter((file) => /^["']use client["']/m.test(sources[file] ?? ""))).toEqual([]);
  });
});
```

Run: `bun install && bun run --cwd packages/core test src/index.spec.ts`
Expected: FAIL with `cannot resolve "./index.ts"`.

- [ ] **Step 5: Write `packages/core/src/index.ts`**

Use one `export * from "./…"` line per module, as listed under Interfaces. Header comment: this is the framework-free layer; it carries no `"use client"` so Server Components can import it; every export here is semver-tracked public API (decision 8 in docs/SOLID_MIGRATION.md).

Run: `bun run --cwd packages/core test`
Expected: PASS. That covers the moved specs (cn, cva, labels, arrow-padding, date, the 3 resizable specs) and index.spec.

- [ ] **Step 6: Copy the data-attribute guard**

`cp packages/ui/src/lib/data-attr-spelling.spec.ts packages/core/src/lib/`. Its glob `../**` now covers core's `src/`. ui keeps its own copy, because ui still holds about 190 inline class strings.

Run: `bun run --cwd packages/core test src/lib/data-attr-spelling.spec.ts`
Expected: PASS.

- [ ] **Step 7: Write `packages/core/scripts/check-dist.ts`, then build and check core**

`checkDist(dist: string, expected: string[]): Promise<string[]>`, written in the style of ui's script. One failure line for each of these:

- `index.js` or `index.cjs` exports a different set of names from `src/index.ts`
- either file contains `use client`
- `index.d.ts` or `index.d.cts` contains `class-variance-authority/`
- `dist/theme.css` is missing, or lacks `@source "./"`

Run: `bun run --cwd packages/core build && bun run --cwd packages/core check:dist && bun run --cwd packages/core check:exports && bun run --cwd packages/core check-types && bun run --cwd packages/core lint`
Expected: all pass. attw reports no problem for node10, node16-cjs, node16-esm or bundler.

- [ ] **Step 8: Make ui depend on core**

Add `"chunks-ui-core": "^0.0.0"` to `dependencies` in `packages/ui/package.json`, then run `bun install`.
Verify: `readlink packages/ui/node_modules/chunks-ui-core` prints `../../core`, and `grep 'chunks-ui-core@workspace:packages/core' bun.lock` finds a line.

- [ ] **Step 9: Point ui's imports at core**

Every relative import in `packages/ui/src` that resolves into a moved module becomes `from "chunks-ui-core"`, merged into one import statement per file. Make the change with a one-off script in the scratchpad, then run `bun run --cwd packages/ui lint -- --write` to sort the imports. This includes the 18 `components/*/index.ts` re-exports. In `src/index.ts`, `export type * from "./types"` becomes a named `export type { ElementBaseVariant, ElementColor, ElementOrientation, ElementPlacement, ElementPlacementHorizontal, ElementPlacementVertical, ElementPosition, ElementVariant } from "chunks-ui-core"`. In `src/utils.ts`, today's names stay the same and now come `from "chunks-ui-core"`. Rewrite its header: it is a banner-free entry that exists for Server Components, and it adds no names in Phase 1.

Verify: `grep -rnE 'from "\.{1,2}/[^"]*(lib/(cn|cva|labels|motion|popup-arrow|arrow-padding|resizable)|/types|/shared|\.Variants|\.Labels|calendar/date|/date)"' packages/ui/src` prints nothing. Today the only `./types` modules are `src/types.ts` and `lib/resizable/types.ts`, and both move, so every hit is an import that was missed.

- [ ] **Step 10: Update ui's utils spec**

`packages/ui/src/utils.spec.ts` keeps its export-list test (the proof that the API did not change), the identity test, the Labels-type test and the layout-type test. Its two graph tests become:

```ts
it("imports only chunks-ui-core", () => {
  const specifiers = [...(sources["./utils.ts"] ?? "").matchAll(/from\s+"([^"]+)"/g)].map(([, s]) => s);
  expect(specifiers.length).toBeGreaterThan(0);
  expect(specifiers.filter((s) => s !== "chunks-ui-core")).toEqual([]);
});
```

- [ ] **Step 11: Let ui read core's source**

Add `"customConditions": ["chunks-ui-source"]` to `packages/ui/tsconfig.json`, `tsconfig.visual.json` and `scripts/tsconfig.json`. In `vitest.config.ts` and `vitest.visual.config.ts`, add `resolve: { conditions: ["chunks-ui-source", ...defaultClientConditions] }`, importing `defaultClientConditions` from `"vite"`. Check that `vitest.webkit.config.ts` inherits it from the visual config. Remove `css.include` from ui's `vitest.config.ts`: no ui spec reads CSS as raw text any more.

Run: `rm -rf packages/core/dist && bun run --cwd packages/ui test && bun run --cwd packages/ui check-types`
Expected: PASS with no core `dist/`.

- [ ] **Step 12: Write ui's theme wrapper and fix the visual CSS**

Create `packages/ui/src/theme.css` with a one-line comment (tokens and core's class sets come from `chunks-ui-core`; this `@source` scans chunks-ui's own dist for the classes its components still hold), then:

```css
@import "chunks-ui-core/theme.css";
@source "./";
```

In `src/visual-test.css`, change `@import "./theme.css"` to `@import "../../core/src/theme.css"`. That stylesheet's own `@source "./"` scans core's source. The visual workflows run without a build, so they cannot use core's `dist`.

- [ ] **Step 13: Simplify ui's build and pin W424 in `check:dist`**

`packages/ui/tsup.config.ts`: delete `importFromUtils`, `utilsModules`, the `readFileSync`/`resolve` imports and the `ponytail:` note. Keep both builds, and change the comment to say the second build exists only to keep the banner off `dist/utils.*`.

Add a test case to `packages/ui/scripts/check-dist.spec.ts`: a fixture whose `index.js` defines `function fitPixels` produces the failure `index.js holds no copy of the layout maths`. Run `bun test packages/ui/scripts` and expect FAIL. Then add that check for `index.*` and `utils.*` in `check-dist.ts`, and update the header comment: both entries hand out core's objects, and the identity checks stay. Run it again and expect PASS.

Run: `bun run build --filter=chunks-ui && bun run --cwd packages/ui check:dist && bun run --cwd packages/ui check:exports`
Verify the typings: `grep -l "chunks-ui-core" packages/ui/dist/index.d.ts packages/ui/dist/utils.d.ts` lists both files, and `grep -c "declare function sanitizeLayout" packages/ui/dist/utils.d.ts` prints `0`. If tsup inlined core's types, set `dts: { compilerOptions: { customConditions: [] } }` in ui's tsup config and rebuild.

- [ ] **Step 14: Fix the docs path and compare coverage**

`apps/docs/app/create/theme-css.test-helpers.ts:16` now points at `../../../../packages/core/src/theme.css`.
Run: `bun run test:unit:coverage --concurrency=1 --continue=dependencies-successful`
Expected: core, ui and docs pass with their thresholds. If ui drops below a threshold because covered files moved out, stop and report the before and after numbers to Paweł. Do not change a threshold.

- [ ] **Step 15: Run the local gates**

Run: `bun run gates`
Expected: every FAST step passes, including `check:tailwind` (Review Focus 1). `check:no-motion` belongs to Task 2.

- [ ] **Step 16: Add the changeset and commit**

`.changeset/chunks-ui-core.md`: `"chunks-ui-core": minor`, `"chunks-ui": patch`. Core's text: first release of chunks-ui's framework-free layer (theme.css, cn/cnState, class sets, label defaults, date and layout helpers). ui's text: chunks-ui now gets its theme and React-free helpers from chunks-ui-core; `chunks-ui` and `chunks-ui/utils` export the same names; a client bundle with Resizable no longer carries the layout maths twice (about 1.5 KB gzip). Check this against the `chunks-ui@0.4.1` tag. Resizable shipped in 0.4.0, so the duplication fix is a real change for users.

```bash
git add -A packages/core packages/ui apps/docs/app/create/theme-css.test-helpers.ts .changeset/chunks-ui-core.md bun.lock
git commit -m "refactor(core): extract chunks-ui-core from chunks-ui"
```

### Task 2: Release and CI plumbing

**Files:**

- Modify: `scripts/check-no-motion.ts`, `.github/workflows/release-changeset.yml`, `.github/workflows/quality-gates.yml`, `.github/workflows/visual-regression.tests.yml`, `scripts/gates.ts`, `package.json` (root)

**Interfaces:**

- Consumes: core's `check:exports` and `check:dist` scripts and its version field (Task 1).

- [ ] **Step 1: Install the local core in `check:no-motion`**

`pack()` packs `packages/core` as well as `packages/ui`. After the frozen fixture install, write `overrides: { "chunks-ui-core": "file:<core tarball>" }` into the fixture copy's `package.json`, then `bun add` the ui tarball. After the install, throw `the fixture installed chunks-ui-core from the registry, not the local tarball` unless the version in `Bun.resolveSync("chunks-ui-core/package.json", <fixture>/node_modules/chunks-ui)` equals the one in `packages/core/package.json`.
Run: `bun run check:no-motion` (needs network and Chromium).
Expected: PASS. While `chunks-ui-core` is not on npm, a pass also proves that the override works, because without it the install gets a 404.

- [ ] **Step 2: Choose packages by name in the release workflow**

In `release-changeset.yml`, the Slack text names each published `name@version`, comma-separated. "Create GitHub release" reads `VERSION` with `jq -r '.[] | select(.name == "chunks-ui") | .version'` from `publishedPackages`, and exits 0 without a release when that is empty (a core-only publish).
Verify: `echo '[{"name":"chunks-ui-core","version":"0.1.0"},{"name":"chunks-ui","version":"0.4.2"}]' | jq -r '.[] | select(.name == "chunks-ui") | .version'` prints `0.4.2`. `bun -e 'require("js-yaml").load(require("fs").readFileSync(".github/workflows/release-changeset.yml","utf8"))'` exits 0.

- [ ] **Step 3: Check core in CI and in the gates**

- `quality-gates.yml`: add `'packages/core/src/**', 'packages/core/tsup.config.ts', 'packages/core/package.json'` to the typecheck cache key. In the docs-build job, after "Build docs", add the step "Check chunks-ui-core package" (`working-directory: packages/core`, `bun run check:exports && bun run check:dist`).
- `scripts/gates.ts` `FULL`: add the matching step (cwd `packages/core`) in the same position.
- `visual-regression.tests.yml`: add `packages/core` to `WATCH`.
- Root `package.json` `release`: before ui's checks, run `bun run --cwd packages/core check:exports && bun run --cwd packages/core check:dist`.

Run: `bun test scripts/__specs__/gates.spec.ts`
Expected: PASS (each gates list matches the workflow steps in order).

- [ ] **Step 4: Run the full gates and commit**

Run: `bun run gates:full`
Expected: all pass.

```bash
git add scripts/check-no-motion.ts scripts/gates.ts package.json .github/workflows/release-changeset.yml .github/workflows/quality-gates.yml .github/workflows/visual-regression.tests.yml
git commit -m "ci(core): check and release chunks-ui-core with chunks-ui"
```

### Task 3: Docs and conventions

**Files:**

- Create: `packages/core/README.md`
- Modify: `packages/ui/README.md`, `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, `TESTING_STRATEGY.md`, `.claude/commands/new-component.md`, `.claude/agents/builder.md`, `apps/docs/app/components/landing/LandingPage.tsx:583`, `scripts/check-tailwind-compat.ts:47` (a comment), `docs/SOLID_MIGRATION.md`

- [ ] **Step 1: Write core's README**

It covers: what core is, and that `chunks-ui` installs it; direct use (class sets and `cn` for a non-React app, `@import "chunks-ui-core/theme.css"`); that everything exported is semver-tracked styling primitives; a `## Known limits` section that copies only the entries of `packages/ui/README.md › Known limits` that apply without Base UI. If none apply, write one line that says so.

- [ ] **Step 2: Point every doc path at the new files**

Update the lines found by `grep -rnE 'src/(lib/(cn|cva|motion|labels)|theme\.css|types\.ts)|Variants\.ts|Labels\.ts|src/utils' AGENTS.md README.md CONTRIBUTING.md TESTING_STRATEGY.md packages/ui/README.md .claude/commands/new-component.md .claude/agents/builder.md`. Rules to state: the existing Variants and Labels files, `cva`, `cn`, `springs` and `theme.css` live in `packages/core/src`; a new Labels module is exported from core's `src/index.ts` and named in ui's `src/utils.ts` and `src/index.ts`; a **new** component's Variants and Labels files go in `packages/core/src/components/<name>/` from day one (D3), while an existing component's inline class strings stay in ui until it is ported (Phase 3). Add one line to TESTING_STRATEGY: core's specs run in jsdom with the same `TZ` pin. Update the LandingPage link to `packages/core/src/lib/motion.ts` and the check-tailwind-compat comment to `packages/core/src/components/shared.ts`.
Verify: running the grep again finds only correct paths, `bun run lint && bun run check:docs-direction` pass, and `bun run build --filter=@chunks-ui/docs` passes.

- [ ] **Step 3: Write down what changed in the spec and CLAUDE.md**

In `docs/SOLID_MIGRATION.md`, tick Phase 1, copy in "Where this plan departs from the spec", and add D1–D4 to §6. `CLAUDE.md` is hook-protected, so put its replacement lines in the PR description for Paweł to apply: the paths of `cn.ts`, `motion.ts` and `theme.css`, and "import `cva` from `src/lib/cva`" becomes `packages/core/src/lib/cva`.

- [ ] **Step 4: Commit**

```bash
git add docs/SOLID_MIGRATION.md packages/core/README.md packages/ui/README.md README.md AGENTS.md CONTRIBUTING.md TESTING_STRATEGY.md .claude/commands/new-component.md .claude/agents/builder.md apps/docs/app/components/landing/LandingPage.tsx scripts/check-tailwind-compat.ts
git commit -m "docs(core): point paths and conventions at chunks-ui-core"
```

### Task 4 (Paweł, by hand): first npm publish of `chunks-ui-core`

npm's trusted publishing (OIDC, what `release-changeset.yml` uses) can only be set up for a package that already exists. The first version therefore has to be published by hand. Do this **before merging the Version Packages PR that bumps core to 0.1.0**. Otherwise CI's core publish fails while chunks-ui, which depends on core, still publishes, and every new install breaks.

- [ ] Publish a placeholder `chunks-ui-core@0.0.0` from an empty directory (name, version, description "Placeholder; use 0.1.0 or newer", license, repository): `npm publish --access public`.
- [ ] On npmjs.com, open chunks-ui-core → Settings → Trusted publisher → GitHub Actions: `pawelkrystkiewicz/chunks-ui`, workflow `release-changeset.yml`.
- [ ] After CI publishes 0.1.0: `npm deprecate chunks-ui-core@0.0.0 "Placeholder. Use 0.1.0 or newer."`

Decided as D2. Do the first two steps now: that reserves the name as well, and nothing in the repo depends on it until the Version Packages PR.

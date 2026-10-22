# New Component Task

Scaffold a structured implementation brief for a new component. This is the Layer 2 task overlay — it constrains scope and sets expectations before any code is written.

## Usage

```
/new-component <ComponentName>
```

## Instructions

Given the component name `$ARGUMENTS`, produce a structured task brief in the following format. `$ARGUMENTS_lowercase` means the kebab-case name (`ToggleGroup` → `toggle-group`), matching component folders and docs pages.

---

**Task:** Implement `$ARGUMENTS` component

**Branch:** `feat($ARGUMENTS_lowercase): implement component`

**File scope** (only touch these paths):
- `packages/ui/src/components/$ARGUMENTS_lowercase/`
  - `$ARGUMENTS.tsx` — component implementation (imports its Variants and Labels from `"chunks-ui-core"`)
  - `index.ts` — barrel export (re-exports the public Variants and Labels names from `"chunks-ui-core"`, as `button/index.ts` does)
- `packages/core/src/components/$ARGUMENTS_lowercase/` — a new component's Variants and Labels files go here from day one, not in `packages/ui`
  - `$ARGUMENTS.Variants.ts` — CVA variant definitions (import `cva` from `packages/core/src/lib/cva`)
  - `$ARGUMENTS.Labels.ts` — built-in text and its defaults, only if the component has any
- `packages/core/src/index.ts` — export each new core file (one line each)
- `packages/ui/src/index.ts` — add export (one line only)
- `packages/ui/src/utils.ts` — name the Labels there too, if there is a Labels file

**Out of scope** (do not touch):
- Any other component directory
- `packages/core/src/theme.css` (unless adding new CSS variables required by this component — flag before doing so)
- CI workflows (`.github/`)
- `CLAUDE.md`

**Spec reference:** If `apps/docs/content/components/$ARGUMENTS_lowercase.mdx` exists, it is the spec — quote its props, variants, and behavior. Otherwise, ask the human for a short brief before writing any code:
- Base UI primitive (or "custom")
- Props and variants
- Behavior and animation requirements
- Which of the selection criteria in `CONTRIBUTING.md` ("Component Scope") it meets — at least two

**Pre-flight checklist:**
- [ ] Spec quoted from the docs page, or brief confirmed by the human
- [ ] Not on the "Removed components" list in `CONTRIBUTING.md` — if it is, flag it
- [ ] Check if a Base UI primitive exists for this pattern (`@base-ui/react`)
- [ ] Check `packages/core/src/theme.css` for existing CSS variables to reuse
- [ ] Review an existing similar component for structure reference

**Definition of done:**
- [ ] Component renders with all variants in the spec
- [ ] Fully typed, no TypeScript errors (`bun run check-types`)
- [ ] `$ARGUMENTS.spec.tsx` with jest-axe a11y assertion
- [ ] Exported from `packages/ui/src/index.ts`, and its Variants and Labels files from `packages/core/src/index.ts`
- [ ] Lint passes (`bun run lint`)
- [ ] Tailwind 4.0, the floor, generates every class the installed version does (`bun run check:tailwind`; it builds `chunks-ui` first and needs the network and node)

---

After producing the brief, ask the human to confirm scope before writing any code.

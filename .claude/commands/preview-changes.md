---
description: Preview proposed visual or token changes as throwaway presets on the local /create page, measured and browser-checked, before committing to a solution
argument-hint: <what to preview, e.g. "darker primary", "darken buttons on hover", "Outfit headings", or a TODO item id>
---

# Preview changes

Input: `$ARGUMENTS`

Build a throwaway preview of the proposed change on the local docs `/create` page, so the maintainer can click it in light and dark mode before anything is decided. Nothing from this command is ever committed. When the maintainer decides, the chosen option goes through `/deliver`.

## Rules

- **Never commit, stage or push** preview code. It lives only as uncommitted edits in the main checkout (the checkout the dev server serves). Mark every change `// THROWAWAY (preview-changes: <topic>)`.
- **Never edit `packages/ui`** for a preview. Reproduce the change from the docs app (tokens, scoped CSS), so the library stays untouched until `/deliver`.
- **Don't touch existing presets or defaults.** Add presets; the maintainer's stored theme must keep working.

## 0. Check the checkout

Run every command from the repo root of the **main checkout**, not from a `chunks-ui-worktrees/` worktree:

```bash
cd "$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
git status --porcelain -- apps/docs packages
```

If that prints anything, stop and ask. Those are someone's uncommitted edits, and step 6 would revert them.

## 1. Find or start the dev server

Find a running server whose cwd is this repo's `apps/docs`:

```bash
lsof -nP -iTCP -sTCP:LISTEN | awk 'NR>1{print $2, $9}' | while read pid addr; do
  [ "$(lsof -p "$pid" 2>/dev/null | awk '$4=="cwd"{print $9}')" = "$PWD/apps/docs" ] && echo "$addr"
done
```

If none is running, start one in the background with `cd apps/docs && bun run dev` (it listens on 3005). If 3005 is taken, use `bunx next dev -p <free port>`. Stop it at cleanup if this command started it.

## 2. Build the options

Offer 2–4 distinct options when the input leaves room for a choice, and always keep the current look ("Chunks") available for comparison. Each option is a preset in `PRESETS` in `apps/docs/app/create/theme-model.ts`, built on `DEFAULT_THEME` without `mode`, with a short, clear name.

Pick the mechanism that matches the change:

- **Token values** (colours, foregrounds, ring, muted, radius, fonts): give `Theme` an optional per-mode override such as `colors?: Record<Mode, Record<string, string>>`, and merge it last in `palette()` (`return { ...out, ...t.colors?.[mode] }`). Fonts, radius and spacing already exist as theme fields.
- **Class behaviour** (hover/active states, a component reading a different token): add an optional boolean field to `Theme`. In `ThemeScope.tsx`, when it's set, put a `data-*` attribute on the scope `div` and on the portal layer `div`, and render a `<style>` that targets the library's utility classes, e.g. `[data-x] [class~="hover:bg-primary/90"]:hover { … }`. Unlayered CSS with attribute selectors beats Tailwind's layered utilities.
- **New derived tokens** (e.g. a text shade from a fill): CSS relative colour, e.g. `oklch(from var(--primary) min(l, 0.51) c h)`, declared where it's used so it follows nested overrides.

Plumbing every new `Theme` field needs:

- `sameTheme()` compares it, so only the clicked preset shows as active.
- The sidebar's preset `onClick` resets it, because clicking a preset merges into the current theme: `onChange({ colors: undefined, …preset.theme })`.
- `ThemeScope` reads it, for class-behaviour previews.
- `loadTheme()` drops unknown fields, so a reload falls back to the stored theme. Tell the maintainer this, and that a preset clicked before reload stays in their browser's storage until they click Reset (harmless).

Then validate the throwaway code: `cd apps/docs && bunx tsc --noEmit`, and watch the dev server output and the browser console for compile errors. Biome isn't enforced on throwaway code, because the commit hook never runs, so don't chase formatting.

## 3. Measure

When colours are involved, compute the numbers before showing anything. `apps/docs/app/create/theme-model.ts` already has the OKLCH → sRGB → WCAG math (`contrast()`); import it in a small Bun script in the scratchpad, or write one with gamut clipping. Compute:

- each foreground on its fill, in every state the change touches (rest, hover, `/10` tints);
- coloured text on the background, in both modes;
- APCA Lc when text-on-fill readability is the question. WCAG 2 is the compliance bar; APCA explains how it looks.

Prefer options that pass WCAG 2 AA (4.5:1 for text, 3:1 for non-text), and say plainly when one doesn't.

## 4. Check in a browser

Use the Playwright MCP tools on the dev server's `/create`:

- click each preset, in light and dark mode;
- read settled values with `getComputedStyle` after waiting out transitions (`micro-interactions` runs 300ms). A value read mid-transition is wrong;
- use hover and focus states through `browser_hover` / the keyboard, not by guessing;
- take a screenshot of the affected card for yourself;
- confirm there are no console errors.

Screenshots saved by the maintainer may carry a wide-gamut ICC profile (e.g. Rec. BT.2020). Convert them before judging colour: `sips -m "/System/Library/ColorSync/Profiles/sRGB Profile.icc" in.png --out out.png`.

## 5. Report and wait

Before reporting, confirm `git diff --stat -- packages` is empty and that `git diff | grep -c THROWAWAY` counts every changed hunk you made.

Tell the maintainer:

- where to look: `localhost:<port>/create` › the preset names;
- one line per option: what changes and its numbers;
- the trade-offs, and anything the preview can't show (e.g. the primary picker being overridden, or presets not persisting);
- which throwaway files are uncommitted.

Then wait for the decision. Don't start `/deliver` without the maintainer's go.

## 6. Clean up

When the maintainer has decided, or asks for it:

```bash
git diff HEAD -- apps/docs > <scratchpad>/preview-<topic>.patch   # copy any new untracked files there too
git checkout -- <the throwaway files>                             # and delete any new files you created
git status --porcelain -- apps/docs packages                      # must print nothing
```

If the input was a `TODO.md` item, record the decision there as a ticked checkbox (`- [x]`, no summary sections). Stop the dev server if this command started it.

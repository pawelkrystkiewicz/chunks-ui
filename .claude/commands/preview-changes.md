---
description: Preview proposed visual or token changes as throwaway presets on the local /create page, measured and browser-checked, before committing to a solution
argument-hint: <what to preview, e.g. "darker primary", "darken buttons on hover", "Outfit headings", or a TODO item id>
---

# Preview changes

Input: `$ARGUMENTS`

Build a throwaway preview of the proposed change on the local docs `/create` page, so the maintainer can click it in light and dark mode before anything is decided. Nothing from this command is ever committed. When the maintainer decides, the chosen option goes through `/deliver`.

## Rules

- **Never commit, stage or push** preview code. It lives only as uncommitted edits in the main checkout (the checkout the dev server serves), and every change is marked `// THROWAWAY (preview-changes: <topic>)`.
- **Never edit `packages/ui`** for a preview. The preview must reproduce the change from the docs app (tokens, scoped CSS), so the library stays untouched until `/deliver`.
- **Start from a clean main checkout.** If `git status` shows other uncommitted changes, stop and ask. Don't mix previews with someone's work.
- **Keep the existing presets and the user's stored theme working.** Add presets; never change the defaults.

## 1. Find or start the dev server

Find a running docs server whose cwd is this repo's `apps/docs`:

```bash
lsof -nP -iTCP -sTCP:LISTEN | awk '$1=="node"{print $2, $9}' | while read pid addr; do
  [ "$(lsof -p "$pid" 2>/dev/null | awk '$4=="cwd"{print $9}')" = "$PWD/apps/docs" ] && echo "$addr"
done
```

If none is running, start one in the background (`cd apps/docs && bunx next dev -p <free port>`), and stop it when the preview is cleaned up.

## 2. Build the options

Offer 2–4 distinct options when the input leaves room for a choice, and always keep the current look ("Chunks") available for comparison. Each option is a preset in `PRESETS` in `apps/docs/app/create/theme-model.ts`, built on the default theme (`DEFAULT_THEME` without `mode`), with a short, clear name.

Pick the mechanism that matches the change:

- **Token values** (colours, foregrounds, ring, muted, radius, fonts): give `Theme` an optional per-mode override such as `colors?: Record<Mode, Record<string, string>>`, and merge it last in `palette()` (`return { ...out, ...t.colors?.[mode] }`). Fonts, radius and spacing already exist as theme fields.
- **Class behaviour** (hover/active states, a component reading a different token): gate a scoped `<style>` in `ThemeScope.tsx` behind a `data-*` attribute set on the scope `div` and on the portal layer. Target the library's utility classes with `[data-x] [class~="hover:bg-primary/90"]:hover { … }`. Unlayered CSS with attribute selectors beats Tailwind's layered utilities.
- **New derived tokens** (e.g. a text shade from a fill): CSS relative colour, e.g. `oklch(from var(--primary) min(l, 0.51) c h)`, declared where it is used so it follows nested overrides.

Plumbing that previews need:
- `sameTheme()` compares the new fields, so only the clicked preset shows as active.
- Clicking a preset merges into the current theme, so the sidebar's `onChange` must reset the new fields (`onChange({ colors: undefined, …preset.theme })`).
- `loadTheme()` drops unknown fields, so a reload falls back to the stored theme. Mention that to the maintainer.

## 3. Measure

When colours are involved, compute the numbers before showing anything. Use a small Bun script (OKLCH → linear sRGB with gamut clipping → WCAG 2 relative luminance) for:

- each foreground on its fill, in every state the change touches (rest, hover, `/10` tints);
- coloured text on the background, in both modes;
- APCA Lc when text-on-fill readability is the question. WCAG 2 is the compliance bar; APCA explains how it looks.

Prefer options that pass WCAG 2 AA (4.5:1 for text, 3:1 for non-text), and say plainly when one doesn't.

## 4. Check in a browser

Use the Playwright MCP tools on the dev server's `/create`:

- click each preset, in light and dark mode;
- read settled values with `getComputedStyle` after waiting out transitions (`micro-interactions` runs 300ms). A value read mid-transition is wrong;
- use `:hover` / focus states through `browser_hover` / keyboard, not by guessing;
- take a screenshot of the affected card for yourself;
- confirm there are no console errors.

Screenshots saved by the maintainer may carry a wide-gamut ICC profile (e.g. Rec. BT.2020). Convert them before judging colour: `sips -m "/System/Library/ColorSync/Profiles/sRGB Profile.icc" in.png --out out.png`.

## 5. Report and wait

Tell the maintainer:

- where to look: `localhost:<port>/create` › the preset names;
- one line per option: what changes and its numbers;
- the trade-offs and anything the preview can't show;
- preview limits, e.g. the primary picker being overridden, or the presets not persisting;
- the throwaway files, uncommitted.

Then wait for the decision. Don't start `/deliver` without the maintainer's go.

## 6. Clean up

When the maintainer has decided, or asks for it:

```bash
git diff -- apps/docs > <scratchpad>/preview-<topic>.patch   # keep the preview, in case it's wanted back
git checkout -- <the throwaway files>
git status --short                                            # must be clean
```

Record the decision as a checkbox in `TODO.md` (gitignored; tick `- [x]`, no summary sections), and stop the dev server if this command started it.

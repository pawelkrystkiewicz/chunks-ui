# Animated Components Candidates

## Reference Table

| Component | Animate-UI Docs                                       |
| --------- | ----------------------------------------------------- |
| Accordion | https://animate-ui.com/docs/components/base/accordion |
| Checkbox  | https://animate-ui.com/docs/components/base/checkbox  |
| Dialog    | https://animate-ui.com/docs/components/base/dialog    |
| Menu      | https://animate-ui.com/docs/components/base/menu      |
| Popover   | https://animate-ui.com/docs/components/base/popover   |
| Progress  | https://animate-ui.com/docs/components/base/progress  |
| Radio     | https://animate-ui.com/docs/components/base/radio     |
| Tooltip   | https://animate-ui.com/docs/components/base/tooltip   |

## Current Animation State

Only **Tabs** and **ToggleGroup** currently use Motion with spring physics. All other interactive components rely on CSS transitions via `data-[starting-style]`/`data-[ending-style]` attributes and the `.micro-interactions` class.

## Candidates — Components We Have

### High Impact (overlay/popup components)

#### Dialog ✅ RECOMMENDED

- **Current**: CSS-only — `scale-95 + opacity-0` via `data-[starting-style]`
- **Animate-UI pattern**: Directional entry via `from` prop (`top | bottom | left | right`) with spring `{ stiffness: 150, damping: 25 }`
- **Benefit**: Directional spring entry feels significantly more polished than a static scale-in. Users can choose entry direction contextually.
- **Effort**: Medium — wrap popup with Motion div, add `from` prop, keep CSS fallback

#### Popover ✅ RECOMMENDED

- **Current**: CSS-only — `scale-95 + opacity-0` via `data-[starting-style]`
- **Animate-UI pattern**: Spring `{ stiffness: 300, damping: 25 }` on opacity + scale. Stiffer spring = snappier feel.
- **Benefit**: Spring physics feel more natural than linear CSS easing. Popover is high-frequency, so the polish compounds.
- **Effort**: Low — similar to existing Tabs/ToggleGroup pattern. Our `springs.content` preset is close (stiffness: 300, damping: 30).

#### Tooltip ✅ RECOMMENDED

- **Current**: CSS-only — `scale-95 + opacity-0` via `data-[starting-style]`
- **Animate-UI pattern**: Spring `{ stiffness: 300, damping: 25 }` on opacity + scale. Supports `followCursor`.
- **Benefit**: Tooltips appear constantly — spring physics make them feel alive. `followCursor` is a nice bonus.
- **Effort**: Low — near-identical pattern to Popover

#### Drawer ✅ RECOMMENDED

- **Current**: CSS-only — directional `translate-x/y-full` via `data-[starting-style]`
- **Animate-UI pattern**: Not in animate-ui, but same directional spring pattern as Dialog applies perfectly.
- **Benefit**: Spring slide-in with slight overshoot feels premium. CSS easing currently feels stiff.
- **Effort**: Low — reuse Dialog's directional spring pattern. Our `springs.overlay` preset fits (stiffness: 200, damping: 25).

### Medium Impact (form controls)

#### Checkbox ✅ RECOMMENDED

- **Current**: CSS-only — `micro-interactions` class for state changes
- **Animate-UI pattern**: Motion-wrapped button with spring animation on check indicator (scale, opacity, stroke).
- **Benefit**: Animated checkmark (draw-on SVG stroke or scale-in dot) is a signature micro-interaction. High perceived quality.
- **Effort**: Medium — needs SVG path animation or scale spring on the indicator element

#### Radio ✅ RECOMMENDED

- **Current**: CSS-only — `micro-interactions` class for state changes
- **Animate-UI pattern**: Motion-wrapped button with spring animation on the selection indicator.
- **Benefit**: Scale-in spring on the radio dot mirrors the Checkbox pattern. Consistent form control feel.
- **Effort**: Low — simpler than Checkbox (just scale the inner dot)

#### Switch ⚡ CONSIDER

- **Current**: CSS `data-checked:translate-x-4` for thumb position
- **Animate-UI pattern**: Not listed in animate-ui, but same micro-interaction spring pattern applies.
- **Benefit**: Spring thumb with slight bounce feels tactile. Currently the CSS transition is adequate but could be elevated.
- **Effort**: Low — spring on `x` position of thumb. Use `springs.micro` preset.

### Lower Impact (already functional / less visible)

#### Select ⚡ CONSIDER

- **Current**: CSS-only — `opacity-0` fade via `data-[starting-style]`
- **Animate-UI pattern**: Menu pattern — `{ duration: 0.2 }` on opacity + scale.
- **Benefit**: Consistent popup behavior with Popover/Tooltip. Animate-ui uses a simpler timed transition here (200ms) rather than spring — suggests this is less critical.
- **Effort**: Low — same pattern as Popover

#### Combobox ⚡ CONSIDER

- **Current**: CSS-only — `opacity-0` fade via `data-[starting-style]`
- **Animate-UI pattern**: Same as Select/Menu
- **Benefit**: Same as Select — consistency across dropdown components
- **Effort**: Low — same pattern as Select

## Candidates — Components We Don't Have Yet

These are in the animate-ui reference but we haven't built them:

| Component | Animate-UI Pattern                                        | Notes                                                   |
| --------- | --------------------------------------------------------- | ------------------------------------------------------- |
| Accordion | Spring height + opacity `{ stiffness: 150, damping: 22 }` | Classic expand/collapse. High-value if we build it.     |
| Progress  | Spring counting number `{ stiffness: 80, damping: 20 }`   | Animated number + bar fill. Nice polish for dashboards. |
| Menu      | Timed opacity + scale `{ duration: 0.2 }`                 | Context menus. Similar to Select popup animation.       |

## Recommended Implementation Order

1. **Popover** — low effort, high frequency, validates the pattern
2. **Tooltip** — near-identical to Popover, two-for-one
3. **Dialog** — adds directional entry, medium effort
4. **Drawer** — reuses Dialog pattern
5. **Checkbox** — signature micro-interaction, medium effort
6. **Radio** — mirrors Checkbox, low effort
7. **Switch** — optional spring upgrade
8. **Select / Combobox** — consistency pass

## Shared Patterns From Animate-UI

| Pattern               | Spring Config                     | Used In          | Our Closest Preset    |
| --------------------- | --------------------------------- | ---------------- | --------------------- |
| Popup entrance/exit   | `{ stiffness: 300, damping: 25 }` | Popover, Tooltip | `springs.content`     |
| Overlay entrance/exit | `{ stiffness: 150, damping: 25 }` | Dialog           | `springs.overlay`     |
| Panel expand/collapse | `{ stiffness: 150, damping: 22 }` | Accordion        | `springs.overlay`     |
| Quick menu open       | `{ duration: 0.2 }`               | Menu             | — (timed, not spring) |
| Form indicator        | spring (not exposed)              | Checkbox, Radio  | `springs.micro`       |
| Number counting       | `{ stiffness: 80, damping: 20 }`  | Progress         | — (new preset needed) |

Our existing `springs.*` presets in `motion.ts` map well to most animate-ui configs. We may want to add a `springs.popup` preset with `{ stiffness: 300, damping: 25 }` to distinguish from `springs.content` which has `damping: 30` (zero bounce vs slight bounce).

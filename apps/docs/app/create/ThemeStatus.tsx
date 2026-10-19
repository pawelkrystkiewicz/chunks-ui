"use client";

import { Collapsible, cn, Field, Select, ToggleGroup } from "chunks-ui";
import { ChevronRight, ChevronsUpDown, Redo2, Undo2 } from "lucide-react";
import { type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { PairEditor } from "./PairEditor";
import { countOverrides, type Mode, type Overrides, type Theme } from "./theme-model";
import { minTextPx, targetGoal, targetSizes, typeScale } from "./theme-sizes";
import {
  APCA_LEVELS,
  type ApcaLevel,
  affects,
  type Check,
  DEFAULT_LEVELS,
  formatLc,
  formatRatio,
  type Levels,
  MODE_NAME,
  passApca,
  passWcag,
  themeChecks,
  WCAG_LEVELS,
  type WcagLevel,
} from "./theme-status";
import { EMPTY_TRAIL, nextTrail, redoTrail, undoTrail } from "./undo-trail";

const GROUPS = ["Text", "Controls", "Charts"] as const;
const TH = "py-1.5 pe-3 text-start font-medium";
const CELL = "py-1.5 ps-2 pe-3 transition-colors motion-reduce:transition-none";
// The pairs the open editor's active colour changes
const LIT = "bg-primary/10";
const SEGMENT = "h-[26px] px-2.5 text-[12px] text-foreground";
const LINK = "underline decoration-border underline-offset-2 hover:decoration-current";

/** The table's own settings, kept in this browser */
type Prefs = Levels & { failsOnly: boolean };
const PREFS_KEY = "chunks-create-contrast-v1";
const DEFAULT_PREFS: Prefs = { ...DEFAULT_LEVELS, failsOnly: false };

function loadPrefs(): Prefs {
  try {
    const s = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "null");
    return {
      wcag: WCAG_LEVELS.includes(s?.wcag) ? s.wcag : DEFAULT_PREFS.wcag,
      apca: APCA_LEVELS.includes(s?.apca) ? s.apca : DEFAULT_PREFS.apca,
      failsOnly: s?.failsOnly === true,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

const fails = (c: Check, modes: Mode[]) => modes.some((m) => !passWcag(c, m) || !passApca(c, m));

/** Contrast of the theme in both modes, the previewed mode first, by WCAG 2 and by APCA. */
export function ThemeStatus({
  theme,
  onChange,
}: {
  theme: Theme;
  onChange: (patch: Partial<Theme>) => void;
}) {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  // The open editor: its pair (listed under "Failures only" once it passes), mode and the token
  // whose pairs are highlighted
  const [editing, setEditing] = useState<{ id: string; mode: Mode; token: string | null } | null>(
    null,
  );
  const [trail, setTrail] = useState(EMPTY_TRAIL);
  const own = trail.last === theme.overrides;
  const history = own ? trail.steps : [];
  const undone = own ? (trail.redo ?? []) : [];
  const dragging = useRef(false);
  // The last editor opened stays listed under "Failures only" after it closes, so focus can go
  // back to its swatch even when the pair now passes
  const [pinned, setPinned] = useState<string | null>(null);

  // Read after mount, like the theme: the page is server-rendered
  useEffect(() => setPrefs(loadPrefs()), []);

  const setPref = (patch: Partial<Prefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    if ("failsOnly" in patch) setPinned(null);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {
      // Storage blocked: the settings just won't persist
    }
  };

  const edit = (overrides: Overrides | undefined, drag = false) => {
    const current = theme.overrides;
    const dragged = dragging.current;
    setTrail((t) => nextTrail(t, current, overrides, drag, dragged));
    dragging.current = drag;
    onChange({ overrides });
  };
  const undo = () => {
    if (history.length === 0) return;
    const current = theme.overrides;
    dragging.current = false;
    setTrail((t) => undoTrail(t, current));
    onChange({ overrides: history.at(-1) });
  };
  const redo = () => {
    if (undone.length === 0) return;
    const current = theme.overrides;
    dragging.current = false;
    setTrail((t) => redoTrail(t, current));
    onChange({ overrides: undone.at(-1) });
  };
  // ⌘Z / Ctrl+Z undoes and ⇧⌘Z / Ctrl+Y redoes anywhere in the panel or an open editor, except in a
  // text field's own history
  const onKeyDown = (e: KeyboardEvent) => {
    const typing = e.target instanceof HTMLInputElement && e.target.type === "text";
    const key = e.key.toLowerCase();
    if (typing || !(e.metaKey || e.ctrlKey)) return;
    const action = key === "z" ? (e.shiftKey ? redo : undo) : key === "y" && e.ctrlKey && redo;
    if (!action) return;
    e.preventDefault();
    action();
  };

  const checks = themeChecks(theme, prefs);
  const modes: Mode[] = theme.mode === "light" ? ["light", "dark"] : ["dark", "light"];
  const shown = prefs.failsOnly ? checks.filter((c) => fails(c, modes) || c.id === pinned) : checks;
  const lit = (c: Check, mode: Mode) =>
    !!editing?.token && editing.mode === mode && affects(theme, mode, c, editing.token);
  const pairs = (mode: Mode) => (token: string) =>
    checks.filter((c) => affects(theme, mode, c, token)).length;
  const custom = countOverrides(theme.overrides);
  const goal = targetGoal(prefs.wcag);
  const targets = targetSizes(theme);
  const targetsPassing = targets.filter((x) => x.px >= goal).length;
  const minText = minTextPx(prefs.apca);
  const steps = typeScale(theme);

  return (
    <Collapsible.Root className="border-border border-b">
      {/* The panel's own h3s (Target size, Type scale) sit under this h2 */}
      <h2 className="m-0 font-normal">
        <Collapsible.Trigger className="group min-h-11 flex-wrap gap-x-6 gap-y-1 py-2 pe-4 ps-[18px] text-[13px]">
          <span className="flex items-center gap-1.5 font-semibold">
            <ChevronRight
              aria-hidden
              className="size-3.5 transition-transform group-data-panel-open:rotate-90 motion-reduce:transition-none"
            />
            Accessibility
          </span>
          <span className="flex flex-wrap gap-x-5 gap-y-1 font-normal text-muted-foreground">
            {modes.map((mode) => (
              <span key={mode} className="flex gap-2.5">
                <span className={cn(mode === theme.mode && "font-medium text-foreground")}>
                  {MODE_NAME[mode]}
                </span>
                <span>
                  WCAG {checks.filter((c) => passWcag(c, mode)).length}/{checks.length}
                </span>
                <span>
                  APCA {checks.filter((c) => passApca(c, mode)).length}/{checks.length}
                </span>
              </span>
            ))}
            <span>
              Targets {targetsPassing}/{targets.length}
            </span>
          </span>
        </Collapsible.Trigger>
      </h2>
      <Collapsible.Panel onKeyDown={onKeyDown} className="flex flex-col gap-3 px-[18px] pb-4">
        <p className="max-w-[75ch] text-[12.5px] text-muted-foreground leading-relaxed">
          <strong className="font-medium text-foreground">WCAG 2</strong> is the contrast ratio the
          accessibility standard asks for:{" "}
          <a
            className={LINK}
            href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html"
          >
            text
          </a>{" "}
          needs 4.5:1 at level AA and 7:1 at AAA, large text (24px, or 18.66px bold) 3:1 and 4.5:1,
          and{" "}
          <a
            className={LINK}
            href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html"
          >
            control edges, focus rings and chart marks
          </a>{" "}
          3:1 at either level. <strong className="font-medium text-foreground">APCA</strong> is a
          method proposed for WCAG 3. It weighs lightness the way eyes see it, so on dark
          backgrounds it often asks for more than WCAG 2. It is not a standard yet. Its{" "}
          <a
            className={LINK}
            href="https://www.readtech.org/ARC/tests/visual-readability-contrast/?tn=criterion"
          >
            levels
          </a>{" "}
          differ for text: Bronze asks Lc 75 of body text and Lc 60 of other text; Silver and Gold
          look the target up by each row's size and weight, and Gold needs text of 16px or more.
          Non-text marks need Lc 30. Click a swatch to change its colours; ⌘Z or Ctrl+Z undoes a
          change, and ⇧⌘Z or Ctrl+Y redoes it.
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <ToggleGroup.Root
            aria-label="Pairs shown"
            value={[prefs.failsOnly ? "fails" : "all"]}
            onValueChange={(v) => v[0] && setPref({ failsOnly: v[0] === "fails" })}
            className="rounded-[9px] bg-secondary p-[3px]"
          >
            <ToggleGroup.Item value="all" className={SEGMENT}>
              All pairs
            </ToggleGroup.Item>
            <ToggleGroup.Item value="fails" className={SEGMENT}>
              Failures only
            </ToggleGroup.Item>
          </ToggleGroup.Root>

          <LevelSelect
            label="WCAG level"
            value={prefs.wcag}
            options={WCAG_LEVELS}
            onChange={(wcag: WcagLevel) => setPref({ wcag })}
          />
          <LevelSelect
            label="APCA level"
            value={prefs.apca}
            options={APCA_LEVELS}
            onChange={(apca: ApcaLevel) => setPref({ apca })}
          />

          {/* aria-disabled, not unmounted, when there is nothing to do: focus stays on the button */}
          <button
            type="button"
            aria-disabled={history.length === 0 || undefined}
            onClick={() => history.length > 0 && undo()}
            className="flex items-center gap-1 rounded-sm text-[12px] hover:text-foreground aria-disabled:opacity-50"
          >
            <Undo2 aria-hidden className="size-3.5" />
            Undo
          </button>
          <button
            type="button"
            aria-disabled={undone.length === 0 || undefined}
            onClick={() => undone.length > 0 && redo()}
            className="flex items-center gap-1 rounded-sm text-[12px] hover:text-foreground aria-disabled:opacity-50"
          >
            <Redo2 aria-hidden className="size-3.5" />
            Redo
          </button>
          <span className="flex items-center gap-2 text-[12px] text-muted-foreground">
            {custom > 0 && (
              <>
                <span aria-hidden className="size-2 rounded-full bg-primary" />
                {custom} custom {custom === 1 ? "colour" : "colours"}
              </>
            )}
            <button
              type="button"
              aria-disabled={custom === 0 || undefined}
              onClick={() => custom > 0 && edit(undefined)}
              className={cn("rounded-sm text-foreground aria-disabled:opacity-50", LINK)}
            >
              Reset all
            </button>
          </span>
        </div>

        {shown.length === 0 ? (
          <p className="py-3 text-[12.5px] text-muted-foreground">Every pair passes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-[12.5px]">
              <caption className="sr-only">
                Contrast of each colour pair in light and dark mode
              </caption>
              <colgroup>
                <col />
                <col />
              </colgroup>
              <colgroup span={2} />
              <colgroup span={2} />
              <thead className="text-muted-foreground">
                <tr>
                  <th rowSpan={2} scope="col" className={cn(TH, "align-bottom")}>
                    Pair
                  </th>
                  <th rowSpan={2} scope="col" className={cn(TH, "align-bottom")}>
                    Target
                  </th>
                  {modes.map((mode) => (
                    <th key={mode} colSpan={2} scope="colgroup" className={cn(TH, "ps-2")}>
                      {MODE_NAME[mode]}
                      {mode === theme.mode && " (preview)"}
                    </th>
                  ))}
                </tr>
                <tr>
                  {modes.map((mode) => [
                    <th key={`${mode}-wcag`} scope="col" className={cn(TH, "ps-2 font-normal")}>
                      WCAG 2
                    </th>,
                    <th key={`${mode}-apca`} scope="col" className={cn(TH, "ps-2 font-normal")}>
                      APCA
                    </th>,
                  ])}
                </tr>
              </thead>
              {GROUPS.map((group) => {
                const rows = shown.filter((c) => c.group === group);
                if (rows.length === 0) return null;
                return (
                  <tbody key={group}>
                    <tr>
                      <th
                        colSpan={6}
                        scope="rowgroup"
                        className="pt-3 pb-1 text-start font-semibold text-[11px] text-muted-foreground uppercase tracking-wide"
                      >
                        {group}
                      </th>
                    </tr>
                    {rows.map((check) => (
                      <tr key={check.id} className="border-border border-t">
                        <th scope="row" className={TH}>
                          {check.label}
                          {check.size && (
                            <span className="block font-normal text-[11px] text-muted-foreground">
                              {+check.size.toFixed(1)}px · {check.text?.weight}
                            </span>
                          )}
                        </th>
                        <td className="whitespace-nowrap py-1.5 pe-3 font-mono text-muted-foreground tabular-nums">
                          {check.target.wcag}:1 ·{" "}
                          {Number.isFinite(check.target.apca)
                            ? `Lc ${check.target.apca}`
                            : "text too small"}
                        </td>
                        {modes.map((mode) => [
                          <td key={`${mode}-wcag`} className={cn(CELL, lit(check, mode) && LIT)}>
                            <span className="flex items-center gap-2">
                              <PairEditor
                                check={check}
                                mode={mode}
                                theme={theme}
                                levels={prefs}
                                onEdit={edit}
                                onEditEnd={() => {
                                  dragging.current = false;
                                }}
                                onOpenChange={(open) => {
                                  dragging.current = false;
                                  if (open) setPinned(check.id);
                                  setEditing((cur) => {
                                    if (open) {
                                      const side = [check.fg, check.bg].find((s) => !s.locked);
                                      return { id: check.id, mode, token: side?.token ?? null };
                                    }
                                    // Another editor may have opened first
                                    return cur?.id === check.id && cur.mode === mode ? null : cur;
                                  });
                                }}
                                active={
                                  editing?.id === check.id && editing.mode === mode
                                    ? editing.token
                                    : null
                                }
                                onActive={(token) => setEditing((cur) => cur && { ...cur, token })}
                                pairs={pairs(mode)}
                                side={mode === modes[0] ? "inline-end" : "inline-start"}
                              />
                              <Value pass={passWcag(check, mode)}>
                                {formatRatio(check.wcag[mode])}
                              </Value>
                            </span>
                          </td>,
                          <td key={`${mode}-apca`} className={cn(CELL, lit(check, mode) && LIT)}>
                            <Value pass={passApca(check, mode)}>
                              Lc {formatLc(check.apca[mode])}
                            </Value>
                          </td>,
                        ])}
                      </tr>
                    ))}
                  </tbody>
                );
              })}
            </table>
          </div>
        )}

        <section aria-labelledby="target-size" className="flex flex-col gap-2 pt-4">
          <h3 id="target-size" className="font-semibold text-[13px]">
            Target size
          </h3>
          <p className="max-w-[75ch] text-[12.5px] text-muted-foreground leading-relaxed">
            WCAG asks for tap targets of{" "}
            <a
              className={LINK}
              href="https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html"
            >
              24×24px at AA
            </a>{" "}
            and{" "}
            <a
              className={LINK}
              href="https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html"
            >
              44×44px at AAA
            </a>
            . A smaller control can still pass AA through WCAG's spacing exception, when a 24px
            circle centred on it overlaps no other target, which this table can't measure. The{" "}
            <code className="font-mono text-[11.5px]">touch-target</code> class grows a control's
            area to 44px. Sizes follow Control height and Spacing.
          </p>
          <SizeTable
            heads={["Control", "Size", "Target"]}
            rows={targets
              .filter((x) => !prefs.failsOnly || x.px < goal)
              .map((x) => ({
                key: x.id,
                label: x.label,
                cells: [`${goal}px`],
                value: `${+x.px.toFixed(1)}px`,
                pass: x.px >= goal,
              }))}
            empty="Every target passes."
          />
        </section>

        <section aria-labelledby="type-scale" className="flex flex-col gap-2 pt-4">
          <h3 id="type-scale" className="font-semibold text-[13px]">
            Type scale
          </h3>
          <p className="max-w-[75ch] text-[12.5px] text-muted-foreground leading-relaxed">
            APCA asks for content text of at least 14px at Silver and 16px at Gold; Bronze and WCAG
            2 set no minimum. Sizes follow Base size. Get code writes them in rem, so they grow with
            the browser's font size.
          </p>
          <SizeTable
            heads={["Step", "Size", "Used by"]}
            rows={steps
              .filter((x) => !prefs.failsOnly || x.px < minText)
              .map((x) => ({
                key: x.step,
                label: `text-${x.step}`,
                cells: [x.usedBy ?? "Your content"],
                value: `${+x.px.toFixed(1)}px`,
                pass: minText ? x.px >= minText : undefined,
              }))}
            empty="Every step meets the minimum."
          />
        </section>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

function LevelSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <Field.Root className="flex-row items-center">
      <Field.Label className="text-[12px] text-muted-foreground">{label}</Field.Label>
      <Select.Root value={value} onValueChange={(v) => v && onChange(v as T)}>
        <Select.Trigger className="h-8 w-24 gap-2 rounded-[9px] ps-2.5 pe-2 text-[12.5px] hover:bg-secondary">
          <Select.Value className="flex-1 text-start" />
          <ChevronsUpDown aria-hidden className="size-3.5 text-muted-foreground" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner sideOffset={6} alignItemWithTrigger={false}>
            <Select.Popup className="rounded-[10px] p-1">
              {options.map((o) => (
                <Select.Item
                  key={o}
                  value={o}
                  className="h-8 gap-2 rounded-md px-2 text-[12.5px] data-highlighted:bg-secondary"
                >
                  <Select.ItemText className="flex-1">{o}</Select.ItemText>
                  <Select.ItemIndicator className="static [&_svg]:size-3.5" />
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </Field.Root>
  );
}

/** A size table: label, the measured value with its status (none when no rule applies), more cells */
function SizeTable({
  heads,
  rows,
  empty,
}: {
  heads: [string, string, string];
  rows: { key: string; label: string; value: string; pass?: boolean; cells: string[] }[];
  empty: string;
}) {
  if (rows.length === 0) return <p className="py-1 text-[12.5px] text-muted-foreground">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-[12.5px]">
        <thead className="text-muted-foreground">
          <tr>
            {heads.map((h) => (
              <th key={h} scope="col" className={TH}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-border border-t">
              <th scope="row" className={TH}>
                {row.label}
              </th>
              <td className="py-1.5 pe-3">
                {row.pass === undefined ? (
                  <span className="font-mono tabular-nums">{row.value}</span>
                ) : (
                  <Value pass={row.pass}>{row.value}</Value>
                )}
              </td>
              {row.cells.map((cell) => (
                <td key={cell} className="py-1.5 pe-3 text-muted-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Value({ pass, children }: { pass: boolean; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <span className="font-mono tabular-nums">{children}</span>
      <span className={cn("text-[11.5px]", pass ? "text-success-text" : "text-destructive-text")}>
        {pass ? "Pass" : "Fail"}
      </span>
    </span>
  );
}

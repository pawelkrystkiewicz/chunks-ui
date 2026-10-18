"use client";

import { Button, cn, Input, Popover, Slider } from "chunks-ui";
import { Lock, Pencil } from "lucide-react";
import { useRef, useState } from "react";
import { parseColor, type Rgb, toHex } from "./palette";
import { type Mode, type Oklch, type Overrides, ok, type Theme, withOverride } from "./theme-model";
import {
  type Check,
  formatLc,
  formatRatio,
  isCustom,
  type Levels,
  nudge,
  passApca,
  passWcag,
  type Side,
  sideColor,
} from "./theme-status";

const MODE_NAME: Record<Mode, string> = { light: "Light", dark: "Dark" };
const MAX_CHROMA = 0.37;
const NOTE = "text-[11.5px] text-muted-foreground leading-snug";

const css = ([r, g, b]: Rgb) => `rgb(${r} ${g} ${b})`;
const title = (s: string) => `${s[0]?.toUpperCase()}${s.slice(1)}`;
const stops = (n: number, at: (x: number) => string) =>
  `linear-gradient(to right, ${Array.from({ length: n }, (_, i) => at(i / (n - 1))).join(", ")})`;

type Props = {
  check: Check;
  mode: Mode;
  theme: Theme;
  levels: Levels;
  /** Sets the hand-set colours. `drag` marks a slider move, which undo takes as one step. */
  onEdit: (overrides: Overrides | undefined, drag?: boolean) => void;
  onEditEnd: () => void;
  onOpenChange: (open: boolean) => void;
  /** The token whose pairs the table highlights, while open */
  active: string | null;
  onActive: (token: string) => void;
  /** How many pairs setting a token changes */
  pairs: (token: string) => number;
  /** Where the popover opens: over the other mode's columns, which are never highlighted */
  side: "inline-start" | "inline-end";
};

/** A pair's swatch. Clicking it opens sliders for each colour of the pair that can be set. */
export function PairEditor({ check, mode, theme, onOpenChange, side: placement, ...rest }: Props) {
  const custom = isCustom(theme, mode, check.fg.token) || isCustom(theme, mode, check.bg.token);
  const { fg, bg } = check.color[mode];
  const trigger = useRef<HTMLButtonElement>(null);
  // Clear the mode's own cells, the swatch's and the APCA one after it, so the highlighted ratios
  // stay in view. ponytail: LTR edges; /create has no RTL layout.
  const clearCells = () => {
    const button = trigger.current?.getBoundingClientRect();
    const cell = trigger.current?.closest("td");
    const edge = (
      placement === "inline-end" ? cell?.nextElementSibling : cell
    )?.getBoundingClientRect();
    if (!button || !edge) return 8;
    return (placement === "inline-end" ? edge.right - button.right : button.left - edge.left) + 8;
  };
  const failing = !passWcag(check, mode) || !passApca(check, mode);
  const sides = { check, mode, theme, failing, ...rest };
  return (
    <Popover.Root onOpenChange={onOpenChange}>
      <Popover.Trigger
        ref={trigger}
        aria-label={`Edit colours: ${check.label}, ${MODE_NAME[mode]}${custom ? ", custom colour" : ""}`}
        className="group/edit relative flex shrink-0 items-center gap-1 rounded-md"
      >
        <span
          aria-hidden
          className="grid h-5 w-8 place-items-center rounded-[5px] border border-border font-semibold text-[11px]"
          style={{ background: css(bg), color: css(fg) }}
        >
          {check.group === "Text" ? (
            "Aa"
          ) : (
            <span className="h-1 w-5 rounded-full" style={{ background: css(fg) }} />
          )}
        </span>
        {custom && (
          <span
            aria-hidden
            title="Custom colour"
            className="-start-1 -top-1 absolute size-2 rounded-full bg-primary ring-2 ring-background"
          />
        )}
        <Pencil
          aria-hidden
          className="size-3 text-muted-foreground transition-colors group-hover/edit:text-foreground"
        />
      </Popover.Trigger>
      <Popover.Content
        side={placement}
        sideOffset={clearCells}
        align="start"
        className="flex w-80 flex-col gap-4"
      >
        <div className="flex flex-col gap-0.5">
          <Popover.Title className="font-semibold text-[13px]">{check.label}</Popover.Title>
          <p className={NOTE}>
            {MODE_NAME[mode]} mode · WCAG {formatRatio(check.wcag[mode])}:1 · APCA Lc{" "}
            {formatLc(check.apca[mode])}
          </p>
        </div>
        <SideEditor
          name={check.group === "Text" ? "Text" : "Foreground"}
          side={check.fg}
          {...sides}
        />
        <SideEditor name="Background" side={check.bg} {...sides} />
      </Popover.Content>
    </Popover.Root>
  );
}

function SideEditor({
  name,
  side,
  check,
  mode,
  theme,
  levels,
  failing,
  onEdit,
  onEditEnd,
  active,
  onActive,
  pairs,
}: Omit<Props, "onOpenChange" | "side"> & { name: string; side: Side; failing: boolean }) {
  const [note, setNote] = useState<string | null>(null);
  const color = sideColor(theme, mode, side);
  const custom = isCustom(theme, mode, side.token);
  const from = side.from ? title(side.from) : "";
  const set = (value: Oklch | null, drag?: boolean) =>
    onEdit(withOverride(theme.overrides, mode, side.token, value), drag);
  const nudgeToPass = () => {
    if (!Number.isFinite(check.target.apca)) {
      setNote(`The text is too small for APCA ${levels.apca}. Raise Base size.`);
      return;
    }
    const found = nudge(theme, levels, mode, check.id, side);
    setNote(found ? null : "No lightness of this colour passes both measures.");
    if (found) set(found);
  };

  // Hovering or focusing a side points the table's highlight at the pairs it changes
  const activate = () => !side.locked && onActive(side.token);
  return (
    <section
      aria-label={name}
      onPointerEnter={activate}
      onFocus={activate}
      className="flex flex-col gap-2 border-border border-t pt-3"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex items-baseline gap-2">
          <span className="font-medium text-[12.5px]">{name}</span>
          <code className="font-mono text-[11px] text-muted-foreground">
            --{side.locked ? side.from : side.token}
          </code>
          {!side.locked && (
            <span
              className={cn(
                "rounded px-1 text-[11px] text-muted-foreground",
                active === side.token && "bg-primary/10 text-foreground",
              )}
            >
              {pairs(side.token)} {pairs(side.token) === 1 ? "pair" : "pairs"}
            </span>
          )}
        </span>
        {/* aria-disabled, not unmounted, once reset: focus stays on the button */}
        {!side.locked && (
          <button
            type="button"
            aria-disabled={!custom || undefined}
            onClick={() => custom && set(null)}
            className="rounded-sm text-[11.5px] underline decoration-border underline-offset-2 hover:decoration-current aria-disabled:opacity-50"
          >
            {side.from ? `Follow ${from}` : "Reset"}
          </button>
        )}
      </div>

      {!color ? (
        <p className={`flex gap-1.5 ${NOTE}`}>
          <Lock aria-hidden className="mt-px size-3 shrink-0" />
          Derived: {from} at 90% over the card. Change it in the {from} button row.
        </p>
      ) : (
        <>
          {side.from && !custom && (
            <p className={NOTE}>Follows {from}. Changing it gives it its own colour.</p>
          )}
          <Channel
            label="Lightness"
            name={name}
            value={color.l}
            max={1}
            step={0.005}
            track={stops(5, (x) => ok(x, color.c, color.h))}
            format={(v) => v.toFixed(3)}
            onChange={(l) => set({ ...color, l }, true)}
            onCommit={onEditEnd}
          />
          <Channel
            label="Chroma"
            name={name}
            value={color.c}
            max={MAX_CHROMA}
            step={0.005}
            track={stops(5, (x) => ok(color.l, x * MAX_CHROMA, color.h))}
            format={(v) => v.toFixed(3)}
            onChange={(c) => set({ ...color, c }, true)}
            onCommit={onEditEnd}
          />
          <Channel
            label="Hue"
            name={name}
            value={color.h}
            max={360}
            step={1}
            track={stops(13, (x) => ok(color.l, Math.max(color.c, 0.08), x * 360))}
            format={(v) => `${Math.round(v)}°`}
            onChange={(h) => set({ ...color, h }, true)}
            onCommit={onEditEnd}
          />
          <div className="flex flex-col gap-2">
            <ColorField name={name} color={color} onSet={set} />
            {/* aria-disabled, not unmounted, once the pair passes: focus stays here after a nudge */}
            <Button
              variant="outlined"
              color="secondary"
              aria-disabled={!failing || undefined}
              title={failing ? undefined : "The pair passes"}
              onClick={() => failing && nudgeToPass()}
              className="h-8 self-start px-2.5 text-[12px] aria-disabled:opacity-50"
            >
              Nudge to pass
            </Button>
          </div>
          <p role="status" className={NOTE}>
            {note}
          </p>
        </>
      )}
    </section>
  );
}

/** Takes a typed `#hex` or `oklch()` on Enter or blur; the hex of the current colour sits at its end */
function ColorField({
  name,
  color,
  onSet,
}: {
  name: string;
  color: Oklch;
  onSet: (value: Oklch) => void;
}) {
  const [invalid, setInvalid] = useState(false);
  const value = ok(color.l, color.c, color.h);
  // The draft restarts from the colour whenever it changes elsewhere; adjusted while rendering so
  // the input stays mounted (and focused)
  const [draft, setDraft] = useState(value);
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    setDraft(value);
    setInvalid(false);
  }
  const commit = () => {
    if (draft.trim() === value) return;
    const parsed = parseColor(draft);
    setInvalid(!parsed);
    if (parsed) onSet(parsed);
  };
  return (
    <Input
      aria-label={`${name} colour, hex or oklch()`}
      aria-invalid={invalid || undefined}
      value={draft}
      spellCheck={false}
      onChange={(e) => setDraft(e.currentTarget.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit()}
      endAdornment={
        <span className="font-mono text-[10.5px] text-muted-foreground">{toHex(color)}</span>
      }
      // A function reaches the input itself; a string would style the adornment wrapper
      className={() => "h-8 w-full font-mono text-[11.5px]"}
    />
  );
}

function Channel({
  label,
  name,
  value,
  max,
  step,
  track,
  format,
  onChange,
  onCommit,
}: {
  label: string;
  name: string;
  value: number;
  max: number;
  step: number;
  track: string;
  format: (v: number) => string;
  onChange: (v: number) => void;
  onCommit: () => void;
}) {
  return (
    <div className="grid grid-cols-[64px_1fr_44px] items-center gap-2.5">
      <span className={NOTE}>{label}</span>
      <Slider.Root
        value={value}
        min={0}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v as number)}
        onValueCommitted={onCommit}
      >
        <Slider.Control className="py-0.5">
          <Slider.Track className="h-2" style={{ background: track }}>
            <Slider.Thumb
              getAriaLabel={() => `${name} ${label.toLowerCase()}`}
              className="border-2 border-white shadow-[0_0_0_1px_oklch(0_0_0/0.25)]"
            />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <span className="text-end font-mono text-[11px] tabular-nums">{format(value)}</span>
    </div>
  );
}

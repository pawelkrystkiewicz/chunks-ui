"use client";

import { Button, cn, Field, IconButton, Select, Slider, ToggleGroup } from "chunks-ui";
import { ChevronsUpDown, Code, Moon, RotateCcw, Shuffle, Sun } from "lucide-react";
import type { ReactNode } from "react";
import {
  BASES,
  type ChartId,
  chartList,
  FONTS,
  fontOf,
  type Mode,
  ok,
  PRESETS,
  PRIMARIES,
  palette,
  RADIUS_STOPS,
  type Shadow,
  samePrimary,
  sameTheme,
  type Theme,
} from "./theme-model";

const RING = "shadow-[0_0_0_1.5px_var(--foreground)]";
const TILE =
  "rounded-[9px] border border-border bg-background transition-colors hover:bg-secondary";
const SEGMENTED = "grid gap-[3px] rounded-[9px] bg-secondary p-[3px]";
const SEGMENT = "rounded-[7px] font-medium text-foreground";
const LABEL = "font-medium text-[13px]";
const VALUE = "font-mono text-[11.5px] text-muted-foreground";
const HUE_GRADIENT = `linear-gradient(to right, ${Array.from(
  { length: 13 },
  (_, i) => `oklch(0.66 0.17 ${i * 30})`,
).join(", ")})`;

const CHARTS: { id: ChartId; name: string }[] = [
  { id: "default", name: "Default" },
  { id: "mono", name: "Mono" },
  { id: "vivid", name: "Spectrum" },
];
const SHADOWS: { id: Shadow; name: string }[] = [
  { id: "none", name: "None" },
  { id: "subtle", name: "Subtle" },
  { id: "lifted", name: "Lifted" },
];

export function ThemeSidebar({
  theme,
  onChange,
  onShuffle,
  onReset,
  onGetCode,
}: {
  theme: Theme;
  onChange: (patch: Partial<Theme>) => void;
  onShuffle: () => void;
  onReset: () => void;
  onGetCode: () => void;
}) {
  const p = theme.primary;
  const hueColor = p.c < 0.01 ? ok(0.6048, 0.2165, p.h) : ok(p.l, p.c, p.h);

  return (
    <aside
      aria-label="Theme"
      className="flex w-full max-w-md flex-col overflow-hidden rounded-[14px] border border-border bg-background shadow-[0_1px_2px_oklch(0_0_0/0.04)] lg:sticky lg:top-[72px] lg:max-h-[calc(100vh-88px)] lg:w-80 lg:max-w-none lg:flex-none"
    >
      <div className="flex items-start justify-between gap-3 border-border border-b pt-[18px] pr-4 pb-4 pl-5">
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold text-base leading-tight tracking-[-0.01em]">Theme</h2>
          <p className="text-[12.5px] text-muted-foreground">Saved in this browser.</p>
        </div>
        <div className="flex gap-0.5">
          <IconButton
            variant="text"
            color="secondary"
            title="Shuffle"
            aria-label="Shuffle"
            onClick={onShuffle}
            className="rounded-lg hover:bg-secondary active:scale-95"
          >
            <Shuffle className="size-4" />
          </IconButton>
          <IconButton
            variant="text"
            color="secondary"
            title="Reset to defaults"
            aria-label="Reset to defaults"
            onClick={onReset}
            className="rounded-lg hover:bg-secondary active:scale-95"
          >
            <RotateCcw className="size-4" />
          </IconButton>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Section title="Presets" className="gap-3">
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((preset) => {
              const pal = palette({ ...preset.theme, mode: "light" }, "light");
              const active = sameTheme(theme, preset.theme);
              return (
                <button
                  key={preset.name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange(preset.theme)}
                  className={cn(
                    TILE,
                    "flex h-[66px] flex-col justify-between rounded-[10px] px-2.5 py-[9px] text-left",
                    active && RING,
                  )}
                >
                  <span className="flex w-full items-center justify-between">
                    <span
                      aria-hidden
                      className="h-5 w-[30px] overflow-hidden font-semibold text-base leading-5"
                      style={{ fontFamily: fontOf(preset.theme.fontHeading).stack }}
                    >
                      Aa
                    </span>
                    <span aria-hidden className="flex">
                      <Dot color={pal.primary} />
                      <Dot color={pal["chart-2"]} className="-ml-[3px]" />
                    </span>
                  </span>
                  <span className="whitespace-nowrap font-medium text-xs">{preset.name}</span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Color">
          <ToggleGroup.Root
            aria-label="Preview mode"
            value={[theme.mode]}
            onValueChange={(v) => v[0] && onChange({ mode: v[0] as Mode })}
            className={cn(SEGMENTED, "grid-cols-2")}
          >
            <ToggleGroup.Item
              value="light"
              className={cn(SEGMENT, "h-[30px] gap-[7px] text-[12.5px]")}
            >
              <Sun className="size-3.5" />
              Light
            </ToggleGroup.Item>
            <ToggleGroup.Item
              value="dark"
              className={cn(SEGMENT, "h-[30px] gap-[7px] text-[12.5px]")}
            >
              <Moon className="size-3.5" />
              Dark
            </ToggleGroup.Item>
          </ToggleGroup.Root>

          <div className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between">
              <span className={LABEL}>Primary</span>
              <span className={VALUE}>{palette(theme, "light").primary}</span>
            </div>
            <div className="grid grid-cols-10 gap-1.5">
              {PRIMARIES.map((s) => {
                const active = samePrimary(s, p);
                return (
                  <button
                    key={s.name}
                    type="button"
                    title={s.name}
                    aria-label={s.name}
                    aria-pressed={active}
                    onClick={() => onChange({ primary: { l: s.l, c: s.c, h: s.h } })}
                    className={cn(
                      "aspect-square w-full rounded-full transition-shadow",
                      active
                        ? "shadow-[0_0_0_2px_var(--background),0_0_0_3.5px_var(--foreground)]"
                        : "shadow-[inset_0_0_0_1px_oklch(0_0_0/0.08)]",
                    )}
                    style={{ background: ok(s.l, s.c, s.h) }}
                  />
                );
              })}
            </div>
            <Slider.Root
              value={Math.round(p.h)}
              min={0}
              max={360}
              onValueChange={(v) => {
                const base = p.c < 0.01 ? { l: 0.6048, c: 0.2165 } : p;
                onChange({ primary: { l: base.l, c: base.c, h: v as number } });
              }}
            >
              <Slider.Control className="py-0.5">
                <Slider.Track className="h-2.5" style={{ background: HUE_GRADIENT }}>
                  <Slider.Thumb
                    getAriaLabel={() => "Primary hue"}
                    className="border-[2.5px] border-white shadow-[0_0_0_1px_oklch(0_0_0/0.15),0_1px_3px_oklch(0_0_0/0.2)]"
                    style={{ background: hueColor }}
                  />
                </Slider.Track>
              </Slider.Control>
            </Slider.Root>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className={LABEL}>Base</span>
            <div className="grid grid-cols-5 gap-1.5">
              {BASES.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={b.id === theme.base}
                  onClick={() => onChange({ base: b.id })}
                  className={cn(
                    TILE,
                    "flex h-[54px] flex-col items-center justify-center gap-1.5",
                    b.id === theme.base && RING,
                  )}
                >
                  <span
                    className="size-4 rounded-full"
                    style={{ background: ok(0.62, b.c * 6, b.h) }}
                  />
                  <span className="font-medium text-[11px]">{b.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className={LABEL}>Charts</span>
            <div className="grid grid-cols-3 gap-1.5">
              {CHARTS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={o.id === theme.chart}
                  onClick={() => onChange({ chart: o.id })}
                  className={cn(
                    TILE,
                    "flex h-[54px] flex-col justify-center gap-[7px] px-2.5",
                    o.id === theme.chart && RING,
                  )}
                >
                  <span className="grid h-2.5 grid-cols-5 gap-0.5">
                    {chartList({ ...theme, chart: o.id }, "light").map((c) => (
                      <span key={c} className="rounded-[3px]" style={{ background: c }} />
                    ))}
                  </span>
                  <span className="text-left font-medium text-[11px]">{o.name}</span>
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Typography" className="gap-4">
          <FontPicker
            label="Heading"
            value={theme.fontHeading}
            weight="font-semibold"
            onChange={(fontHeading) => onChange({ fontHeading })}
          />
          <FontPicker
            label="Body"
            value={theme.fontBody}
            weight="font-medium"
            onChange={(fontBody) => onChange({ fontBody })}
          />
          <Knob
            label="Base size"
            valueLabel={`${theme.fontSize}px`}
            value={theme.fontSize}
            min={12}
            max={17}
            onChange={(fontSize) => onChange({ fontSize })}
          />
        </Section>

        <Section title="Shape" className="border-b-0">
          <Knob
            label="Radius"
            valueLabel={`${theme.radius}px`}
            value={theme.radius}
            min={0}
            max={20}
            onChange={(radius) => onChange({ radius })}
          >
            <div className="grid grid-cols-6 gap-1.5">
              {RADIUS_STOPS.map((v) => (
                <button
                  key={v}
                  type="button"
                  title={`${v}px`}
                  aria-label={`Radius ${v}px`}
                  aria-pressed={v === theme.radius}
                  onClick={() => onChange({ radius: v })}
                  className={cn(
                    "flex h-[34px] items-center justify-center rounded-[7px] border border-border transition-colors hover:border-ring",
                    v === theme.radius
                      ? "bg-foreground text-background"
                      : "bg-background text-foreground",
                  )}
                >
                  <span
                    className="size-3.5 border-current border-t-2 border-r-2"
                    style={{ borderTopRightRadius: Math.min(v, 12) }}
                  />
                </button>
              ))}
            </div>
          </Knob>
          <Knob
            label="Control height"
            valueLabel={`${theme.height}px`}
            value={theme.height}
            min={28}
            max={44}
            onChange={(height) => onChange({ height })}
          />
          <Knob
            label="Spacing"
            valueLabel={`${(4 * theme.spacing).toFixed(1).replace(".0", "")}px · ${theme.spacing.toFixed(2)}×`}
            ariaLabel="Spacing scale"
            value={theme.spacing}
            min={0.75}
            max={1.25}
            step={0.05}
            onChange={(v) => onChange({ spacing: +v.toFixed(2) })}
          />
          <div className="flex flex-col gap-2.5">
            <span className={LABEL}>Shadow</span>
            <ToggleGroup.Root
              aria-label="Shadow"
              value={[theme.shadow]}
              onValueChange={(v) => v[0] && onChange({ shadow: v[0] as Shadow })}
              className={cn(SEGMENTED, "grid-cols-3")}
            >
              {SHADOWS.map((o) => (
                <ToggleGroup.Item key={o.id} value={o.id} className={cn(SEGMENT, "h-7 text-xs")}>
                  {o.name}
                </ToggleGroup.Item>
              ))}
            </ToggleGroup.Root>
          </div>
        </Section>
      </div>

      <div className="border-border border-t px-4 py-3.5">
        <Button
          onClick={onGetCode}
          className="h-9 w-full rounded-lg bg-foreground text-[13px] text-background hover:bg-foreground hover:opacity-88 active:scale-[0.97]"
        >
          <Code className="size-[15px]" />
          Get code
        </Button>
      </div>
    </aside>
  );
}

function Section({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-[18px] border-border border-b px-5 pt-[18px] pb-5",
        className,
      )}
    >
      <h3 className="font-semibold text-[13px]">{title}</h3>
      {children}
    </section>
  );
}

function Dot({ color, className }: { color?: string; className?: string }) {
  return (
    <span
      className={cn("size-3 rounded-full shadow-[0_0_0_1.5px_var(--background)]", className)}
      style={{ background: color }}
    />
  );
}

function Knob({
  label,
  valueLabel,
  ariaLabel = label,
  value,
  min,
  max,
  step = 1,
  onChange,
  children,
}: {
  label: string;
  valueLabel: string;
  ariaLabel?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between">
        <span className={LABEL}>{label}</span>
        <span className={VALUE}>{valueLabel}</span>
      </div>
      <Slider.Root
        value={value}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v as number)}
      >
        <Slider.Control className="py-px">
          <Slider.Track className="h-1 bg-secondary">
            <Slider.Indicator className="bg-foreground" />
            <Slider.Thumb
              getAriaLabel={() => ariaLabel}
              className="border-foreground shadow-none"
            />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      {children}
    </div>
  );
}

function FontPicker({
  label,
  value,
  weight,
  onChange,
}: {
  label: string;
  value: string;
  weight: string;
  onChange: (font: string) => void;
}) {
  const font = fontOf(value);
  return (
    <Field.Root className="flex flex-col gap-2">
      <Field.Label className={LABEL}>{label}</Field.Label>
      <Select.Root value={value} onValueChange={(v) => v && onChange(v)}>
        <Select.Trigger className="h-[42px] gap-2.5 rounded-[9px] pr-2.5 pl-1.5 hover:bg-secondary">
          <span
            className={cn(
              "flex size-[30px] flex-none items-center justify-center overflow-hidden rounded-md bg-secondary text-[15px]",
              weight,
            )}
            style={{ fontFamily: font.stack }}
          >
            Aa
          </span>
          <Select.Value className="min-w-0 flex-1 truncate text-left font-medium text-[13px]" />
          <span className="font-mono text-[10.5px] text-muted-foreground">{font.kind}</span>
          <ChevronsUpDown className="size-[15px] text-muted-foreground" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner sideOffset={6} alignItemWithTrigger={false}>
            <Select.Popup className="max-h-[268px] w-(--anchor-width) overflow-y-auto rounded-[10px] p-1 shadow-[0_12px_32px_-8px_oklch(0_0_0/0.18),0_2px_6px_oklch(0_0_0/0.06)]">
              {FONTS.map((f) => (
                <Select.Item
                  key={f.name}
                  value={f.name}
                  className="h-9 gap-2.5 rounded-md px-2 data-highlighted:bg-secondary data-selected:bg-secondary"
                >
                  <Select.ItemText
                    className="min-w-0 flex-1 truncate text-sm"
                    style={{ fontFamily: f.stack }}
                  >
                    {f.name}
                  </Select.ItemText>
                  <span className="font-mono text-[10.5px] text-muted-foreground">{f.kind}</span>
                  <span className="flex w-3.5">
                    <Select.ItemIndicator className="static [&_svg]:size-3.5" />
                  </span>
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </Field.Root>
  );
}

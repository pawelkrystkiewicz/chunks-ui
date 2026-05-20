"use client";

import { Button, Card, Field, Select, Separator, Slider } from "chunks-ui";
import { RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BODY_FONTS,
  CSS_VARS,
  DEFAULT_CONFIG,
  HEADING_FONTS,
  RADIUS_PRESETS,
  type ThemeConfig,
} from "./configurator-constants";
import { FontLoader } from "./FontLoader";
import { KitchenSink } from "./KitchenSink";

export function ThemeConfigurator() {
  const [config, setConfig] = useState<ThemeConfig>(DEFAULT_CONFIG);
  const originalsRef = useRef<Map<string, string>>(new Map());

  const update = useCallback((patch: Partial<ThemeConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  // Apply CSS variable overrides on <html> so portaled popups also pick them up
  useEffect(() => {
    const el = document.documentElement;
    const originals = originalsRef.current;

    // Save originals on first run
    if (originals.size === 0) {
      for (const v of CSS_VARS) {
        originals.set(v, el.style.getPropertyValue(v));
      }
      originals.set("font-size", el.style.fontSize);
    }

    el.style.setProperty("--radius", `${config.radius / 16}rem`);
    el.style.setProperty("--font-sans", `"${config.bodyFont}", sans-serif`);
    el.style.setProperty("--spacing", `${config.spacing / 16}rem`);
    el.style.setProperty("--spacing-ui-height", `${config.componentHeight}px`);
    el.style.fontSize = `${config.fontSize}px`;

    return () => {
      for (const v of CSS_VARS) {
        const orig = originals.get(v) ?? "";
        if (orig) el.style.setProperty(v, orig);
        else el.style.removeProperty(v);
      }
      el.style.fontSize = originals.get("font-size") ?? "";
    };
  }, [config]);

  const isDefault = JSON.stringify(config) === JSON.stringify(DEFAULT_CONFIG);

  return (
    <>
      <FontLoader fonts={[config.bodyFont, config.headingFont]} />

      {config.headingFont !== config.bodyFont && (
        <style>{`
          .configurator-preview h1,
          .configurator-preview h2,
          .configurator-preview h3,
          .configurator-preview h4 {
            font-family: "${config.headingFont}", serif !important;
          }
        `}</style>
      )}

      <div className="mx-auto w-full max-w-[1600px] px-4 py-8">
        <div className="mb-8">
          <h1 className="font-semibold text-3xl tracking-tight">Create</h1>
          <p className="text-muted-foreground">
            Customize design tokens and preview changes in real time.
          </p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Control panel */}
          <aside className="w-full shrink-0 lg:sticky lg:top-20 lg:w-80 lg:self-start">
            <Card.Root>
              <Card.Header>
                <Card.Title>Theme</Card.Title>
                <Card.Description>Adjust tokens to see live changes.</Card.Description>
              </Card.Header>
              <Card.Content className="space-y-5">
                {/* Body Font */}
                <FontSelect
                  label="Body Font"
                  value={config.bodyFont}
                  options={BODY_FONTS}
                  onChange={(v) => update({ bodyFont: v })}
                />

                {/* Heading Font */}
                <FontSelect
                  label="Heading Font"
                  value={config.headingFont}
                  options={HEADING_FONTS}
                  onChange={(v) => update({ headingFont: v })}
                />

                <Separator />

                {/* Radius */}
                <Field.Root>
                  <div className="flex items-center justify-between">
                    <Field.Label>Radius</Field.Label>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {config.radius}px
                    </span>
                  </div>
                  <Slider.Root
                    value={config.radius}
                    onValueChange={(v) => update({ radius: v as number })}
                    min={0}
                    max={20}
                    step={1}
                  >
                    <Slider.Control>
                      <Slider.Track>
                        <Slider.Indicator />
                        <Slider.Thumb />
                      </Slider.Track>
                    </Slider.Control>
                  </Slider.Root>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {RADIUS_PRESETS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => update({ radius: p.value })}
                        className={`rounded border px-2 py-0.5 text-xs ${
                          config.radius === p.value
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </Field.Root>

                <Separator />

                {/* Font Size */}
                <Field.Root>
                  <div className="flex items-center justify-between">
                    <Field.Label>Font Size</Field.Label>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {config.fontSize}px
                    </span>
                  </div>
                  <Slider.Root
                    value={config.fontSize}
                    onValueChange={(v) => update({ fontSize: v as number })}
                    min={12}
                    max={20}
                    step={1}
                  >
                    <Slider.Control>
                      <Slider.Track>
                        <Slider.Indicator />
                        <Slider.Thumb />
                      </Slider.Track>
                    </Slider.Control>
                  </Slider.Root>
                </Field.Root>

                <Separator />

                {/* Spacing */}
                <Field.Root>
                  <div className="flex items-center justify-between">
                    <Field.Label>Spacing</Field.Label>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {config.spacing}px ({(config.spacing / 4).toFixed(2)}x)
                    </span>
                  </div>
                  <Slider.Root
                    value={config.spacing}
                    onValueChange={(v) => update({ spacing: v as number })}
                    min={2}
                    max={6}
                    step={0.5}
                  >
                    <Slider.Control>
                      <Slider.Track>
                        <Slider.Indicator />
                        <Slider.Thumb />
                      </Slider.Track>
                    </Slider.Control>
                  </Slider.Root>
                </Field.Root>

                {/* Component Height */}
                <Field.Root>
                  <div className="flex items-center justify-between">
                    <Field.Label>Component Height</Field.Label>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {config.componentHeight}px
                    </span>
                  </div>
                  <Slider.Root
                    value={config.componentHeight}
                    onValueChange={(v) => update({ componentHeight: v as number })}
                    min={28}
                    max={44}
                    step={1}
                  >
                    <Slider.Control>
                      <Slider.Track>
                        <Slider.Indicator />
                        <Slider.Thumb />
                      </Slider.Track>
                    </Slider.Control>
                  </Slider.Root>
                </Field.Root>

                <Separator />

                <Button
                  variant="outlined"
                  color="secondary"
                  className="w-full"
                  disabled={isDefault}
                  onClick={() => setConfig(DEFAULT_CONFIG)}
                >
                  <RotateCcw className="size-3.5" />
                  Reset to Defaults
                </Button>
              </Card.Content>
            </Card.Root>
          </aside>

          {/* Preview */}
          <main className="min-w-0 flex-1">
            <div className="configurator-preview rounded-xl border border-border">
              <KitchenSink />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

function FontSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <Field.Root>
      <Field.Label>{label}</Field.Label>
      <Select.Root value={value} onValueChange={(v) => v && onChange(v)}>
        <Select.Trigger>
          <Select.Value />
          <Select.Icon />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              {options.map((font) => (
                <Select.Item key={font} value={font}>
                  <Select.ItemText>
                    <span style={{ fontFamily: font }}>{font}</span>
                  </Select.ItemText>
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </Field.Root>
  );
}

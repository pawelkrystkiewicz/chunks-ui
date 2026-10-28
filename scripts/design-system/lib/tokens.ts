/**
 * theme.css → tokens.json, in the shape the Design System page reads: every family a list of
 * {name, value, usage}. Values come from the CSS; usage notes, themes, type styles and shadows
 * from tokens.base.json. A value the page cannot hold (var(), color-mix(), calc(), min()) is skipped
 * and reported, so it stays in bundle.css.
 */

export interface Token {
  name: string;
  value: string | Record<string, string>;
  usage: string;
}

export interface Base {
  name: string;
  version: number;
  themes: { id: string; name: string }[];
  colorUsage: Record<string, string>;
  spacingUsage: Record<string, string>;
  radiusUsage: Record<string, string>;
  zIndexNote: string;
  zIndexUsage: Record<string, string>;
  shadow: { note?: string; tokens: Token[] };
  type: { fonts: unknown[]; displayFamily: string; groups: unknown[] };
  fontFiles: Record<string, string>;
  logos: Record<string, string>;
}

/** A plain colour the page accepts: hex or a colour function with no nested function. */
const COLOR = /^(#[0-9a-f]{3,8}|(rgba?|hsla?|oklch|oklab|lab|lch|color)\([^()]*\))$/i;

/** The `--name: value;` declarations of the first rule whose selector is exactly `selector`. */
export function declarations(css: string, selector: string): Map<string, string> {
  const start = css.indexOf(`\n${selector} {`);
  if (start < 0) throw new Error(`theme.css has no "${selector} {" rule`);
  const end = css.indexOf("\n}", start + 1);
  const body = css.slice(start, end).replace(/\/\*[\s\S]*?\*\//g, "");
  const out = new Map<string, string>();
  for (const m of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    const [, name, value] = m;
    if (name && value) out.set(name, value.trim().replace(/\s+/g, " "));
  }
  return out;
}

const noUsage = (name: string, notes: string[]) => {
  notes.push(`\`${name}\` has no usage note in tokens.base.json`);
  return "New in theme.css: no usage note yet.";
};

export function buildTokens(themeCss: string, docsCss: string, base: Base, notes: string[]) {
  const light = declarations(themeCss, ":root");
  const dark = declarations(themeCss, ".dark");
  const themeInline = declarations(themeCss, "@theme inline");
  const theme = declarations(themeCss, "@theme");
  const [first, second] = base.themes.map((t) => t.id);
  if (!first || !second) throw new Error("tokens.base.json needs two themes");

  const color: Token[] = [];
  for (const [name, value] of light) {
    if (!COLOR.test(value)) {
      if (/^(oklch|#|rgb|hsl)/.test(value) || name === "ring")
        notes.push(`\`--${name}\` is computed (\`${value}\`): kept in bundle.css, not a token`);
      continue;
    }
    const darkValue = dark.get(name) ?? value;
    if (!COLOR.test(darkValue))
      notes.push(`\`--${name}\` in .dark is computed: the dark theme uses the light value`);
    color.push({
      name,
      value: { [first]: value, [second]: COLOR.test(darkValue) ? darkValue : value },
      usage: base.colorUsage[name] ?? noUsage(name, notes),
    });
  }

  const spacing: Token[] = [];
  for (const [name, value] of theme)
    if (name.startsWith("spacing-"))
      spacing.push({ name, value, usage: base.spacingUsage[name] ?? noUsage(name, notes) });

  const radius: Token[] = [];
  const r = light.get("radius");
  if (r)
    radius.push({
      name: "radius",
      value: r,
      usage: base.radiusUsage.radius ?? noUsage("radius", notes),
    });

  const zIndex: Token[] = [];
  for (const [name, value] of themeInline)
    if (name.startsWith("z-index-"))
      zIndex.push({ name, value, usage: base.zIndexUsage[name] ?? noUsage(name, notes) });

  const display = declarations(docsCss, "@theme").get("font-display") ?? base.type.displayFamily;
  const families = {
    sans: theme.get("font-sans") ?? '"Manrope", sans-serif',
    mono: theme.get("font-mono") ?? '"Fira Code", monospace',
    display,
  };

  return {
    name: base.name,
    version: base.version,
    color: { themes: base.themes, tokens: color },
    type: { fonts: base.type.fonts, families, groups: base.type.groups },
    spacing: { tokens: spacing },
    radius: { tokens: radius },
    shadow: base.shadow,
    zIndex: { note: base.zIndexNote, tokens: zIndex },
  };
}

/**
 * theme.css for the previews' stylesheet: the values tokens.json declares are removed (the page
 * writes them as tokens.css, so an edit on the page reaches the previews), and `.dark` also
 * matches `[data-theme="dark"]`, the preview frame's dark theme.
 */
export function themeForPreviews(themeCss: string, sourceDir: string, tokenNames: Set<string>) {
  let css = themeCss.replace('@source "./";', `@source "${sourceDir}";`);
  for (const selector of [":root", ".dark"]) {
    const start = css.indexOf(`\n${selector} {`);
    const end = css.indexOf("\n}", start + 1);
    const block = css
      .slice(start, end)
      .split("\n")
      .filter((line) => {
        const m = /^\s*--([\w-]+):/.exec(line);
        return !(m?.[1] && tokenNames.has(m[1]));
      })
      .join("\n")
      .replace(".dark {", '.dark,\n[data-theme="dark"] {');
    css = css.slice(0, start) + block + css.slice(end);
  }
  return css;
}

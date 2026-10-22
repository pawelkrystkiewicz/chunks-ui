/** The unit a panel declares its size in. */
export type Unit = "px" | "%";

/** A size as a consumer writes it: a number is px, a string carries its unit. */
export type PanelSize = number | `${number}%` | `${number}px`;

export type ParsedSize = { value: number; unit: Unit };

const SIZE = /^\s*(\d+(?:\.\d+)?|\.\d+)\s*(px|%)?\s*$/;

/** Parses a panel size. Returns `undefined` for anything that is not a non-negative size. */
export function parseSize(input: unknown): ParsedSize | undefined {
  if (typeof input === "number") {
    return Number.isFinite(input) && input >= 0 ? { value: input, unit: "px" } : undefined;
  }
  if (typeof input !== "string") return undefined;
  const match = SIZE.exec(input);
  if (!match) return undefined;
  return { value: Number(match[1]), unit: (match[2] ?? "px") as Unit };
}

/**
 * The CSS custom property that holds a panel's size. Everything outside `[a-zA-Z0-9-]` is written
 * as `_`, its hex code and `_`. `_` is escaped too, so the mapping is one to one: `a.b` and `a_2e_b`
 * stay apart.
 */
export function cssVarName(id: string) {
  return `--resizable-${id.replace(/[^a-zA-Z0-9-]/g, (char) => `_${char.charCodeAt(0).toString(16)}_`)}`;
}

/**
 * A size as its custom property holds it. A px panel keeps its unit; a % panel keeps a bare number
 * that its `flex-grow` reads, so % panels share the space px panels leave.
 */
export function formatCssValue(value: number, unit: Unit) {
  return unit === "px" ? `${value}px` : `${value}`;
}

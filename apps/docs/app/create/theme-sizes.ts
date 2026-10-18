// Target sizes and the type scale of a /create theme, from the component classes. Pure maths.

import type { Theme } from "./palette";
import { TEXT_STEPS } from "./theme-model";
import type { ApcaLevel, WcagLevel } from "./theme-status";

/** WCAG 2.5.8 (AA) and 2.5.5 (AAA) target sizes in CSS px */
export const targetGoal = (level: WcagLevel) => (level === "AA" ? 24 : 44);

/**
 * Interactive parts by the shorter side of their box: `h-ui-height` follows Control height, a
 * spacing unit (`size-8`) is 4px × Spacing.
 */
const TARGETS: { id: string; label: string; units?: number }[] = [
  { id: "control", label: "Button, input, select" },
  { id: "pagination", label: "Pagination link", units: 9 },
  { id: "icon-button", label: "Icon button, calendar day", units: 8 },
  { id: "calendar-nav", label: "Calendar month arrows", units: 7 },
  { id: "close", label: "Clear button, toast close", units: 6 },
  { id: "switch", label: "Switch", units: 5 },
  { id: "checkbox", label: "Checkbox, radio, slider thumb", units: 4 },
];

export const targetSizes = (t: Pick<Theme, "height" | "spacing">) =>
  TARGETS.map(({ units, ...target }) => ({
    ...target,
    px: units ? units * 4 * t.spacing : t.height,
  }));

/** Where the components use each text step; the rest only size your own content */
const USED_BY: Partial<Record<keyof typeof TEXT_STEPS, string>> = {
  xs: "Field descriptions and errors, chips, menus, tooltips, toasts",
  sm: "Body text, buttons, inputs, tabs, tables",
  lg: "Card, dialog and drawer titles",
};

export const typeScale = (t: Pick<Theme, "fontSize">) =>
  (Object.entries(TEXT_STEPS) as [keyof typeof TEXT_STEPS, number][]).map(([step, px]) => ({
    step,
    px: (px * t.fontSize) / 14,
    usedBy: USED_BY[step],
  }));

/** The smallest content text APCA allows: 14px at Silver, 16px at Gold; Bronze sets none */
export const minTextPx = (level: ApcaLevel) => ({ Bronze: 0, Silver: 14, Gold: 16 })[level];

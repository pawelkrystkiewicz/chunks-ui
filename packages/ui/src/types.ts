export const ELEMENT_COLOR = ["primary", "destructive", "warning", "success", "secondary"] as const;

export const ELEMENT_BASE_VARIANTS = ["contained", "outlined"] as const;
export const ELEMENT_VARIANTS = [...ELEMENT_BASE_VARIANTS, "text"] as const;

export const ELEMENT_ORIENTATION = ["vertical", "horizontal"] as const;
export const ELEMENT_PLACEMENT_VERTICAL = ["top", "bottom"] as const;
export const ELEMENT_PLACEMENT_HORIZONTAL = ["right", "left"] as const;
export const ELEMENT_POSITION = [
  ...ELEMENT_PLACEMENT_HORIZONTAL,
  ...ELEMENT_PLACEMENT_VERTICAL,
] as const;

export type ElementColor = (typeof ELEMENT_COLOR)[number];
export type ElementOrientation = (typeof ELEMENT_ORIENTATION)[number];
export type ElementVariant = (typeof ELEMENT_VARIANTS)[number];
export type ElementBaseVariant = (typeof ELEMENT_BASE_VARIANTS)[number];
export type ElementPlacementHorizontal = (typeof ELEMENT_PLACEMENT_HORIZONTAL)[number];
export type ElementPlacementVertical = (typeof ELEMENT_PLACEMENT_VERTICAL)[number];
export type ElementPosition = (typeof ELEMENT_POSITION)[number];
export type ElementPlacement = {
  horizontal: ElementPlacementHorizontal;
  vertical: ElementPlacementVertical;
};

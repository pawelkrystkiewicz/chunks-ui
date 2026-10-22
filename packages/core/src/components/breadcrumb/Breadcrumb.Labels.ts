/** The built-in English strings of `Breadcrumb`. */
export type BreadcrumbLabels = {
  /**
   * Name of the `Breadcrumb.Root` navigation landmark.
   * @default "Breadcrumb"
   */
  root: string;
  /**
   * Text of `Breadcrumb.Ellipsis` for screen readers, which read it in place of the three dots.
   * It is visually hidden.
   * @default "More"
   */
  ellipsis: string;
};

export const DEFAULT_BREADCRUMB_LABELS: Readonly<BreadcrumbLabels> = {
  root: "Breadcrumb",
  ellipsis: "More",
};

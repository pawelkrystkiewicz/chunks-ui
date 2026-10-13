/** The built-in English strings of `Pagination`. */
export type PaginationLabels = {
  /**
   * Name of the `Pagination.Root` navigation landmark.
   * @default "pagination"
   */
  root: string;
  /**
   * Text of `Pagination.Previous` when it has no children.
   * @default "Previous"
   */
  previous: string;
  /**
   * Text of `Pagination.Next` when it has no children.
   * @default "Next"
   */
  next: string;
  /**
   * Screen-reader text of `Pagination.Ellipsis`.
   * @default "More pages"
   */
  ellipsis: string;
};

export const DEFAULT_PAGINATION_LABELS: Readonly<PaginationLabels> = {
  root: "pagination",
  previous: "Previous",
  next: "Next",
  ellipsis: "More pages",
};

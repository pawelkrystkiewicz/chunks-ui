import {
  type ComponentProps,
  cloneElement,
  createContext,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useContext,
} from "react";
import { cn } from "../../lib/cn";

type RenderProps = { className?: string; children?: ReactNode; [key: string]: unknown };
type RenderElement = ReactElement<RenderProps>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

export const DEFAULT_BREADCRUMB_LABELS: BreadcrumbLabels = {
  root: "Breadcrumb",
  ellipsis: "More",
};

const BreadcrumbLabelsContext = createContext(DEFAULT_BREADCRUMB_LABELS);

export type BreadcrumbRootProps = ComponentProps<"nav"> & {
  /**
   * Replaces the built-in English strings, e.g. to translate them. Keys you leave out keep the
   * default from `DEFAULT_BREADCRUMB_LABELS`. `aria-label` on Root takes precedence.
   */
  labels?: Partial<BreadcrumbLabels>;
};
export type BreadcrumbListProps = ComponentProps<"ol">;
export type BreadcrumbItemProps = ComponentProps<"li">;
export type BreadcrumbLinkProps = ComponentProps<"a"> & {
  /** Custom link element to render instead of a native `<a>` (e.g. `<Link to="..." />`). */
  render?: RenderElement;
};
export type BreadcrumbPageProps = ComponentProps<"span">;
export type BreadcrumbSeparatorProps = ComponentProps<"li">;
export type BreadcrumbEllipsisProps = ComponentProps<"span">;

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function BreadcrumbRoot({ className, labels, ...props }: BreadcrumbRootProps) {
  const names = { ...DEFAULT_BREADCRUMB_LABELS, ...labels };
  return (
    <BreadcrumbLabelsContext.Provider value={names}>
      <nav aria-label={names.root} className={className} {...props} />
    </BreadcrumbLabelsContext.Provider>
  );
}

function BreadcrumbList({ className, ...props }: BreadcrumbListProps) {
  return (
    <ol
      className={cn(
        "flex flex-wrap items-center gap-1.5 text-muted-foreground text-sm sm:gap-2.5",
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbItem({ className, ...props }: BreadcrumbItemProps) {
  return <li className={cn("inline-flex items-center gap-1.5", className)} {...props} />;
}

function BreadcrumbLink({ className, render, children, ...props }: BreadcrumbLinkProps) {
  const classes = cn("micro-interactions hover:text-foreground", className);

  if (isValidElement(render)) {
    return cloneElement(render, {
      ...props,
      className: cn(classes, render.props.className),
      children: render.props.children ?? children,
    });
  }

  return (
    <a className={classes} {...props}>
      {children}
    </a>
  );
}

function BreadcrumbPage({ className, ...props }: BreadcrumbPageProps) {
  return (
    <span aria-current="page" className={cn("font-medium text-foreground", className)} {...props} />
  );
}

function BreadcrumbSeparator({ className, children, ...props }: BreadcrumbSeparatorProps) {
  return (
    <li
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? (
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      )}
    </li>
  );
}

function BreadcrumbEllipsis({ className, ...props }: BreadcrumbEllipsisProps) {
  const labels = useContext(BreadcrumbLabelsContext);
  return (
    <span className={cn("flex size-9 items-center justify-center", className)} {...props}>
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
      </svg>
      <span className="sr-only">{labels.ellipsis}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const Breadcrumb = {
  Root: BreadcrumbRoot,
  List: BreadcrumbList,
  Item: BreadcrumbItem,
  Link: BreadcrumbLink,
  Page: BreadcrumbPage,
  Separator: BreadcrumbSeparator,
  Ellipsis: BreadcrumbEllipsis,
};

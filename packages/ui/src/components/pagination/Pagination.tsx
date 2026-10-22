import {
  BUTTON_ANIMATION_CLASSES,
  cn,
  DEFAULT_PAGINATION_LABELS,
  FOCUS_RING,
  mergeLabels,
  type PaginationLabels,
} from "chunks-ui-core";
import {
  type ComponentProps,
  cloneElement,
  createContext,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useContext,
} from "react";

type RenderProps = { className?: string; children?: ReactNode; [key: string]: unknown };
type RenderElement = ReactElement<RenderProps>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const PaginationLabelsContext = createContext(DEFAULT_PAGINATION_LABELS);

export type PaginationRootProps = ComponentProps<"nav"> & {
  /**
   * Replaces the built-in English strings, e.g. to translate them. Keys you leave out keep the
   * default from `DEFAULT_PAGINATION_LABELS`. `aria-label` on Root and `children` on Previous
   * and Next take precedence.
   */
  labels?: Partial<PaginationLabels>;
};
export type PaginationContentProps = ComponentProps<"ul">;
export type PaginationItemProps = ComponentProps<"li">;
export type PaginationLinkProps = ComponentProps<"a"> & {
  /**
   * Marks this link as the current page, setting `aria-current="page"`.
   * @default false
   */
  active?: boolean;
  /**
   * Custom React element to render instead of the default `<a>` tag.
   */
  render?: RenderElement;
};
export type PaginationPreviousProps = ComponentProps<"a"> & {
  /**
   * Custom React element to render instead of the default `<a>` tag.
   */
  render?: RenderElement;
};
export type PaginationNextProps = ComponentProps<"a"> & {
  /**
   * Custom React element to render instead of the default `<a>` tag.
   */
  render?: RenderElement;
};
export type PaginationEllipsisProps = ComponentProps<"span">;

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const LINK_CLASSES = [
  "inline-flex size-9 items-center justify-center rounded-md text-sm",
  "hover:bg-accent hover:text-accent-foreground",
  FOCUS_RING,
  "cursor-pointer",
  ...BUTTON_ANIMATION_CLASSES,
];

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function PaginationRoot({ className, labels, ...props }: PaginationRootProps) {
  const names = mergeLabels(DEFAULT_PAGINATION_LABELS, labels);
  return (
    <PaginationLabelsContext.Provider value={names}>
      <nav
        aria-label={names.root}
        className={cn("mx-auto flex w-full justify-center", className)}
        {...props}
      />
    </PaginationLabelsContext.Provider>
  );
}

function PaginationContent({ className, ...props }: PaginationContentProps) {
  return <ul className={cn("flex flex-row items-center gap-1", className)} {...props} />;
}

function PaginationItem({ className, ...props }: PaginationItemProps) {
  return <li className={className} {...props} />;
}

function PaginationLink({ className, active, render, children, ...props }: PaginationLinkProps) {
  const classes = cn(LINK_CLASSES, active && "border border-border bg-background", className);

  if (isValidElement(render)) {
    return cloneElement(render, {
      ...props,
      "aria-current": active ? "page" : undefined,
      className: cn(classes, render.props.className),
      children: render.props.children ?? children,
    });
  }

  return (
    <a aria-current={active ? "page" : undefined} className={classes} {...props}>
      {children}
    </a>
  );
}

function PaginationPrevious({ className, render, children, ...props }: PaginationPreviousProps) {
  const labels = useContext(PaginationLabelsContext);
  const classes = cn(LINK_CLASSES, "gap-1 px-2.5", className);

  const content = (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
      <span>{children ?? labels.previous}</span>
    </>
  );

  if (isValidElement(render)) {
    return cloneElement(render, {
      ...props,
      className: cn(classes, render.props.className),
      children: render.props.children ?? content,
    });
  }

  return (
    <a className={classes} {...props}>
      {content}
    </a>
  );
}

function PaginationNext({ className, render, children, ...props }: PaginationNextProps) {
  const labels = useContext(PaginationLabelsContext);
  const classes = cn(LINK_CLASSES, "gap-1 px-2.5", className);

  const content = (
    <>
      <span>{children ?? labels.next}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </>
  );

  if (isValidElement(render)) {
    return cloneElement(render, {
      ...props,
      className: cn(classes, render.props.className),
      children: render.props.children ?? content,
    });
  }

  return (
    <a className={classes} {...props}>
      {content}
    </a>
  );
}

// Children replace the dots; the hidden label stays beside them (#564)
function PaginationEllipsis({ className, children, ...props }: PaginationEllipsisProps) {
  const labels = useContext(PaginationLabelsContext);
  return (
    <span className={cn("flex size-9 items-center justify-center", className)} {...props}>
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
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      )}
      <span className="sr-only">{labels.ellipsis}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const Pagination = {
  Root: PaginationRoot,
  Content: PaginationContent,
  Item: PaginationItem,
  Link: PaginationLink,
  Previous: PaginationPrevious,
  Next: PaginationNext,
  Ellipsis: PaginationEllipsis,
};

import {
  type ComponentProps,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "../../lib/cn";
import { BUTTON_ANIMATION_CLASSES } from "../shared";

type RenderProps = { className?: string; children?: ReactNode; [key: string]: unknown };
type RenderElement = ReactElement<RenderProps>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PaginationRootProps = ComponentProps<"nav">;
export type PaginationContentProps = ComponentProps<"ul">;
export type PaginationItemProps = ComponentProps<"li">;
export type PaginationLinkProps = ComponentProps<"a"> & {
  active?: boolean;
  render?: RenderElement;
};
export type PaginationPreviousProps = ComponentProps<"a"> & {
  render?: RenderElement;
};
export type PaginationNextProps = ComponentProps<"a"> & {
  render?: RenderElement;
};
export type PaginationEllipsisProps = ComponentProps<"span">;

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const LINK_CLASSES = [
  "inline-flex size-9 items-center justify-center rounded-md text-sm",
  "hover:bg-accent hover:text-accent-foreground",
  "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
  "cursor-pointer",
  ...BUTTON_ANIMATION_CLASSES,
];

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function PaginationRoot({ className, ...props }: PaginationRootProps) {
  return (
    <nav
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
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
      <span>{children ?? "Previous"}</span>
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
  const classes = cn(LINK_CLASSES, "gap-1 px-2.5", className);

  const content = (
    <>
      <span>{children ?? "Next"}</span>
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

function PaginationEllipsis({ className, ...props }: PaginationEllipsisProps) {
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
      <span className="sr-only">More pages</span>
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

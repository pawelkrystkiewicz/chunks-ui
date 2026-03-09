import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EmptyRootProps = ComponentProps<"div">;
export type EmptyMediaProps = ComponentProps<"div">;
export type EmptyTitleProps = ComponentProps<"h3">;
export type EmptyDescriptionProps = ComponentProps<"p">;
export type EmptyActionsProps = ComponentProps<"div">;

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function EmptyRoot({ className, ...props }: EmptyRootProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-4 py-12 text-center", className)}
      {...props}
    />
  );
}

function EmptyMedia({ className, ...props }: EmptyMediaProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center text-muted-foreground [&>svg]:size-12",
        className,
      )}
      {...props}
    />
  );
}

function EmptyTitle({ className, ...props }: EmptyTitleProps) {
  return <h3 className={cn("font-semibold text-lg", className)} {...props} />;
}

function EmptyDescription({ className, ...props }: EmptyDescriptionProps) {
  return <p className={cn("max-w-md text-muted-foreground text-sm", className)} {...props} />;
}

function EmptyActions({ className, ...props }: EmptyActionsProps) {
  return <div className={cn("flex items-center gap-2", className)} {...props} />;
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const Empty = {
  Root: EmptyRoot,
  Media: EmptyMedia,
  Title: EmptyTitle,
  Description: EmptyDescription,
  Actions: EmptyActions,
};

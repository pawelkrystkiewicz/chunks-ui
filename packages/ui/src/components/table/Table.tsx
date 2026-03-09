import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type TableProps = ComponentProps<"table">;

function TableRoot({ className, ...props }: TableProps) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

export type TableHeaderProps = ComponentProps<"thead">;

function TableHeader({ className, ...props }: TableHeaderProps) {
  return (
    <thead className={cn("border-border bg-muted/50 [&_tr]:border-b", className)} {...props} />
  );
}

export type TableBodyProps = ComponentProps<"tbody">;

function TableBody({ className, ...props }: TableBodyProps) {
  return <tbody className={cn("border-border [&_tr:last-child]:border-0", className)} {...props} />;
}

export type TableFooterProps = ComponentProps<"tfoot">;

function TableFooter({ className, ...props }: TableFooterProps) {
  return (
    <tfoot
      className={cn(
        "border-border border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

export type TableRowProps = ComponentProps<"tr">;

function TableRow({ className, ...props }: TableRowProps) {
  return (
    <tr
      className={cn(
        "micro-interactions border-border border-b transition-colors! hover:bg-muted/50 data-[state=selected]:bg-muted",
        className,
      )}
      {...props}
    />
  );
}

export type TableHeadProps = ComponentProps<"th">;

function TableHead({ className, ...props }: TableHeadProps) {
  return (
    <th
      className={cn(
        "h-ui-height whitespace-nowrap border-border px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

export type TableCellProps = ComponentProps<"td">;

function TableCell({ className, ...props }: TableCellProps) {
  return (
    <td
      className={cn(
        "whitespace-nowrap p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

export type TableCaptionProps = ComponentProps<"caption">;

function TableCaption({ className, ...props }: TableCaptionProps) {
  return <caption className={cn("mt-4 text-muted-foreground text-sm", className)} {...props} />;
}

export const Table = {
  Root: TableRoot,
  Header: TableHeader,
  Body: TableBody,
  Footer: TableFooter,
  Row: TableRow,
  Head: TableHead,
  Cell: TableCell,
  Caption: TableCaption,
};

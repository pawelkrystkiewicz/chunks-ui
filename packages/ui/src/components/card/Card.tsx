import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type CardProps = ComponentProps<"div">;

function CardRoot({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export type CardHeaderProps = ComponentProps<"div">;

function CardHeader({ className, ...props }: CardHeaderProps) {
  return <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />;
}

export type CardTitleProps = ComponentProps<"h3">;

function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
  );
}

export type CardDescriptionProps = ComponentProps<"p">;

function CardDescription({ className, ...props }: CardDescriptionProps) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export type CardContentProps = ComponentProps<"div">;

function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export type CardFooterProps = ComponentProps<"div">;

function CardFooter({ className, ...props }: CardFooterProps) {
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}

export const Card = {
  Root: CardRoot,
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Content: CardContent,
  Footer: CardFooter,
};

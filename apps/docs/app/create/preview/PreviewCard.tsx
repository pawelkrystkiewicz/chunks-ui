import { Card, cn } from "chunks-ui";
import type { ComponentProps } from "react";

/** Masonry card shell. The Shadow knob drives `--preview-shadow` on the scope. */
export function PreviewCard({ className, ...props }: ComponentProps<"div">) {
  return (
    <Card.Root
      className={cn(
        "mb-5 flex break-inside-avoid flex-col gap-5 p-6 shadow-[var(--preview-shadow)]",
        className,
      )}
      {...props}
    />
  );
}

export function PreviewCardHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Card.Title>{title}</Card.Title>
      {description && <Card.Description>{description}</Card.Description>}
    </div>
  );
}

import { PreviewCard } from "./PreviewCard";

export function TypographyCard({
  fontHeading,
  fontBody,
}: {
  fontHeading: string;
  fontBody: string;
}) {
  return (
    <PreviewCard>
      <div className="flex items-end justify-between gap-4">
        <div className="font-heading text-[5em] font-semibold leading-[0.9] tracking-[-0.04em]">
          Aa
        </div>
        <div className="flex flex-col items-end gap-1.5 pb-1 text-muted-foreground text-xs">
          <span>
            Heading · <strong className="font-semibold text-foreground">{fontHeading}</strong>
          </span>
          <span>
            Body · <strong className="font-semibold text-foreground">{fontBody}</strong>
          </span>
        </div>
      </div>
      <div className="h-px bg-border" />
      <div className="flex flex-col gap-2">
        <div className="text-balance font-heading text-[1.57em] font-semibold leading-[1.2] tracking-[-0.02em]">
          Composed, not configured.
        </div>
        <div className="text-pretty text-muted-foreground text-sm leading-[1.6]">
          One component, one job. Conventional APIs with minimal indirection, readable by humans and
          language models alike.
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <code className="rounded-sm bg-muted px-2 py-0.5 font-mono text-foreground text-xs">
          variant="outlined"
        </code>
        <code className="rounded-sm bg-muted px-2 py-0.5 font-mono text-foreground text-xs">
          size="sm"
        </code>
      </div>
    </PreviewCard>
  );
}

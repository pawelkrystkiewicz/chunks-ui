import { Button, IconButton } from "chunks-ui";
import { MoreHorizontal, Plus, Settings } from "lucide-react";
import { PreviewCard, PreviewCardHeading } from "./PreviewCard";

export function ButtonsCard() {
  return (
    <PreviewCard>
      <PreviewCardHeading title="Buttons" description="Contained, outlined and text." />
      <div className="flex flex-wrap gap-2">
        <Button>Primary</Button>
        <Button color="secondary">Secondary</Button>
        <Button color="destructive">Delete</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outlined">Outlined</Button>
        <Button variant="text">Text</Button>
        <Button disabled>Disabled</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button startIcon={<Plus size={16} />} className="pl-3">
          New task
        </Button>
        <IconButton
          variant="outlined"
          aria-label="Settings"
          className="size-ui-height text-foreground"
        >
          <Settings size={16} />
        </IconButton>
        <IconButton aria-label="More" className="size-ui-height text-foreground">
          <MoreHorizontal size={16} />
        </IconButton>
      </div>
    </PreviewCard>
  );
}

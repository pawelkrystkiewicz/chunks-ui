import { Button } from "chunks-ui";
import { NewTaskDrawer } from "./overlays/NewTaskDrawer";
import { ProjectActionsDialog } from "./overlays/ProjectActionsDialog";
import { SettingsDrawer } from "./overlays/SettingsDrawer";
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
        <NewTaskDrawer />
        <SettingsDrawer />
        <ProjectActionsDialog />
      </div>
    </PreviewCard>
  );
}

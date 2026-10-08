import { Button, Field, Input, Select, Switch } from "chunks-ui";
import { PreviewCard, PreviewCardHeading } from "./PreviewCard";

const FRAMEWORKS = ["Next.js", "Remix", "Astro", "Vite"];

export function NewProjectCard() {
  return (
    <PreviewCard className="gap-6">
      <PreviewCardHeading title="New project" description="Deploy an app from a Git repository." />
      <div className="flex flex-col gap-4">
        <Field.Root className="gap-2">
          <Field.Label>Project name</Field.Label>
          <Input defaultValue="acme-dashboard" />
        </Field.Root>
        <Field.Root className="gap-2">
          <Field.Label>Framework</Field.Label>
          <Select.Root defaultValue="Next.js">
            <Select.Trigger>
              <Select.Value />
              <Select.Icon />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner sideOffset={5} alignItemWithTrigger={false}>
                <Select.Popup>
                  {FRAMEWORKS.map((f) => (
                    <Select.Item key={f} value={f}>
                      <Select.ItemText>{f}</Select.ItemText>
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </Field.Root>
        {/* biome-ignore lint/a11y/noLabelWithoutControl: wraps Base UI Switch (button-based control) */}
        <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
          <span className="flex flex-col gap-0.5">
            <span className="font-medium text-sm">Private repository</span>
            <span className="text-muted-foreground text-xs">Only invited members can view.</span>
          </span>
          <Switch.Root defaultChecked>
            <Switch.Thumb />
          </Switch.Root>
        </label>
      </div>
      <div className="flex justify-between gap-2">
        <Button variant="outlined" color="secondary">
          Cancel
        </Button>
        <Button>Deploy</Button>
      </div>
    </PreviewCard>
  );
}

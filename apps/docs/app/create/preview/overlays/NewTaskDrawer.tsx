import { Button, Drawer, Field, Input, Textarea } from "chunks-ui";
import { Plus } from "lucide-react";
import { OverlayHeader, SelectField } from "./parts";

export function NewTaskDrawer() {
  return (
    <Drawer.Root>
      <Drawer.Trigger render={<Button startIcon={<Plus size={16} />} className="pl-3" />}>
        New task
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop />
        <Drawer.Popup className="flex flex-col gap-6 overflow-y-auto">
          <OverlayHeader title="New task" description="Add a task to Sprint 14." />
          <div className="flex flex-col gap-4">
            <Field.Root className="gap-2">
              <Field.Label>Title</Field.Label>
              <Input placeholder="What needs doing?" />
            </Field.Root>
            <Field.Root className="gap-2">
              <Field.Label>Description</Field.Label>
              <Textarea placeholder="Add details…" className="min-h-24 resize-none" />
            </Field.Root>
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Assignee" items={["Alice", "Bob", "Eve"]} />
              <SelectField label="Priority" items={["Medium", "High", "Low"]} />
            </div>
          </div>
          <div className="mt-auto flex justify-end gap-2">
            <Drawer.Close render={<Button variant="outlined" color="secondary" />}>
              Cancel
            </Drawer.Close>
            <Drawer.Close render={<Button />}>Create task</Drawer.Close>
          </div>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

"use client";

import { Button, Dialog, Field, Input, Select, Textarea } from "chunks-ui";
import { Plus } from "lucide-react";
import { PRIORITY_OPTIONS, STATUS_OPTIONS, TEAM } from "./data";

export function CreateTaskDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <Button startIcon={<Plus className="size-4" />}>New Task</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup className="max-w-lg">
          <Dialog.Title>Create Task</Dialog.Title>
          <Dialog.Description>Add a new task to the project board.</Dialog.Description>
          <form className="mt-4 space-y-4" onSubmit={(e) => e.preventDefault()}>
            <Field.Root>
              <Field.Label>Title</Field.Label>
              <Input placeholder="What needs to be done?" />
            </Field.Root>

            <Field.Root>
              <Field.Label>Description</Field.Label>
              <Textarea placeholder="Add details..." rows={3} />
            </Field.Root>

            <div className="grid grid-cols-2 gap-3">
              <Field.Root>
                <Field.Label>Status</Field.Label>
                <Select.Root defaultValue="backlog">
                  <Select.Trigger>
                    <Select.Value placeholder="Status" />
                    <Select.Icon />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Positioner sideOffset={5} alignItemWithTrigger={false}>
                      <Select.Popup>
                        {STATUS_OPTIONS.map((opt) => (
                          <Select.Item key={opt.value} value={opt.value}>
                            <Select.ItemText>{opt.label}</Select.ItemText>
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Popup>
                    </Select.Positioner>
                  </Select.Portal>
                </Select.Root>
              </Field.Root>

              <Field.Root>
                <Field.Label>Priority</Field.Label>
                <Select.Root defaultValue="medium">
                  <Select.Trigger>
                    <Select.Value placeholder="Priority" />
                    <Select.Icon />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Positioner sideOffset={5} alignItemWithTrigger={false}>
                      <Select.Popup>
                        {PRIORITY_OPTIONS.map((opt) => (
                          <Select.Item key={opt.value} value={opt.value}>
                            <Select.ItemText>{opt.label}</Select.ItemText>
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Popup>
                    </Select.Positioner>
                  </Select.Portal>
                </Select.Root>
              </Field.Root>
            </div>

            <Field.Root>
              <Field.Label>Assignee</Field.Label>
              <Select.Root>
                <Select.Trigger>
                  <Select.Value placeholder="Assign to..." />
                  <Select.Icon />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Positioner sideOffset={5} alignItemWithTrigger={false}>
                    <Select.Popup>
                      {TEAM.map((m) => (
                        <Select.Item key={m.id} value={m.id}>
                          <Select.ItemText>{m.name}</Select.ItemText>
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Popup>
                  </Select.Positioner>
                </Select.Portal>
              </Select.Root>
            </Field.Root>

            <Field.Root>
              <Field.Label>Due Date</Field.Label>
              <Input type="date" />
            </Field.Root>

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close>
                <Button variant="outlined" color="secondary">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit">Create Task</Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

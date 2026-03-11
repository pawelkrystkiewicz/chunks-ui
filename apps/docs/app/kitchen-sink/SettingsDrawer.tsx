"use client";

import { Button, Drawer, Field, Input, Radio, Separator, Slider, Switch } from "chunks-ui";
import { Settings } from "lucide-react";

export function SettingsDrawer() {
  return (
    <Drawer.Root>
      <Drawer.Trigger>
        <Button variant="outlined" color="secondary" aria-label="Settings">
          <Settings className="size-4" />
        </Button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop />
        <Drawer.Popup>
          <Drawer.Title>Project Settings</Drawer.Title>
          <Drawer.Description>Configure project preferences and notifications.</Drawer.Description>

          <div className="mt-6 space-y-6">
            <Field.Root>
              <Field.Label>Project Name</Field.Label>
              <Input defaultValue="Acme Dashboard" />
            </Field.Root>

            <Separator />

            <div className="space-y-4">
              <p className="font-medium text-sm">Notifications</p>
              <Field.Root>
                <div className="flex items-center justify-between">
                  <Field.Label>Email notifications</Field.Label>
                  <Switch.Root defaultChecked>
                    <Switch.Thumb />
                  </Switch.Root>
                </div>
                <Field.Description>Receive updates via email</Field.Description>
              </Field.Root>
              <Field.Root>
                <div className="flex items-center justify-between">
                  <Field.Label>Slack integration</Field.Label>
                  <Switch.Root>
                    <Switch.Thumb />
                  </Switch.Root>
                </div>
                <Field.Description>Post updates to #project channel</Field.Description>
              </Field.Root>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="font-medium text-sm">Default View</p>
              <Radio.Group defaultValue="board">
                <Radio.Item value="board">Board</Radio.Item>
                <Radio.Item value="list">List</Radio.Item>
                <Radio.Item value="timeline">Timeline</Radio.Item>
              </Radio.Group>
            </div>

            <Separator />

            <Field.Root>
              <Field.Label>Task Limit per Sprint</Field.Label>
              <Slider.Root defaultValue={15} min={5} max={30}>
                <Slider.Control>
                  <Slider.Track>
                    <Slider.Indicator />
                    <Slider.Thumb />
                  </Slider.Track>
                </Slider.Control>
                <Slider.Value />
              </Slider.Root>
            </Field.Root>
          </div>

          <div className="mt-8 flex justify-end gap-2">
            <Drawer.Close>
              <Button variant="outlined" color="secondary">
                Cancel
              </Button>
            </Drawer.Close>
            <Button>Save Changes</Button>
          </div>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

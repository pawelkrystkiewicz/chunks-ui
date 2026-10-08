import { Button, Drawer, Field, IconButton, Switch } from "chunks-ui";
import { Settings } from "lucide-react";
import { OverlayHeader, SelectField } from "./parts";

const SWITCHES = [
  { title: "Email digests", desc: "A summary every Monday", on: true },
  { title: "Show weekends", desc: "In board and timeline views", on: false },
  { title: "Compact rows", desc: "Fit more tasks on screen", on: false },
];

export function SettingsDrawer() {
  return (
    <Drawer.Root>
      <Drawer.Trigger
        render={
          <IconButton
            variant="outlined"
            aria-label="Settings"
            className="size-ui-height text-foreground"
          />
        }
      >
        <Settings size={16} />
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop />
        <Drawer.Popup className="flex flex-col gap-6 overflow-y-auto">
          <OverlayHeader title="Settings" description="Preferences for the Acme workspace." />
          <div className="flex flex-col gap-4">
            <SelectField label="Default view" items={["Board", "List", "Timeline"]} />
            <SelectField label="Week starts on" items={["Monday", "Sunday"]} />
          </div>
          <div className="flex flex-col">
            {SWITCHES.map((item, i) => (
              <Field.Root
                key={item.title}
                className={`flex-row items-center justify-between gap-4 py-3 ${i > 0 ? "border-border border-t" : ""}`}
              >
                <div className="flex flex-col gap-0.5">
                  <Field.Label className="leading-normal">{item.title}</Field.Label>
                  <Field.Description>{item.desc}</Field.Description>
                </div>
                <Switch.Root aria-label={item.title} defaultChecked={item.on}>
                  <Switch.Thumb />
                </Switch.Root>
              </Field.Root>
            ))}
          </div>
          <div className="mt-auto flex justify-end gap-2">
            <Drawer.Close render={<Button variant="outlined" color="secondary" />}>
              Cancel
            </Drawer.Close>
            <Drawer.Close render={<Button />}>Save</Drawer.Close>
          </div>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

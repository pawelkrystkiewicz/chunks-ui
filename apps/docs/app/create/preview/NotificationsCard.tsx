import { Field, Switch } from "chunks-ui";
import { PreviewCard, PreviewCardHeading } from "./PreviewCard";

const ITEMS = [
  { title: "Deployments", desc: "When a build finishes or fails", on: true },
  { title: "Mentions", desc: "When someone tags you", on: true },
  { title: "Weekly digest", desc: "A summary every Monday", on: false },
];

export function NotificationsCard() {
  return (
    <PreviewCard>
      <PreviewCardHeading title="Notifications" description="Choose what you hear about." />
      <div className="flex flex-col">
        {ITEMS.map((item, i) => (
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
    </PreviewCard>
  );
}

import { Avatar, Button, Input, Select } from "chunks-ui";
import { PreviewCard, PreviewCardHeading } from "./PreviewCard";

const MEMBERS = [
  { name: "Alice Chen", email: "alice@acme.dev", role: "Owner" },
  { name: "Bob Rivera", email: "bob@acme.dev", role: "Editor" },
  { name: "Carl Zhang", email: "carl@acme.dev", role: "Editor" },
  { name: "Eve Nakamura", email: "eve@acme.dev", role: "Viewer" },
];
const ROLES = ["Editor", "Viewer"];

export function TeamCard() {
  return (
    <PreviewCard>
      <PreviewCardHeading title="Team" description="Invite collaborators to this project." />
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="name@company.com"
          aria-label="Email address"
          className="min-w-0 flex-1"
        />
        <Button color="secondary">Invite</Button>
      </div>
      <div className="flex flex-col gap-4">
        {MEMBERS.map((m, i) => (
          <div key={m.email} className="flex items-center gap-3">
            <Avatar
              alt={m.name}
              size={36}
              className={
                i === 0
                  ? "bg-[color-mix(in_oklch,var(--primary)_14%,var(--card))] text-primary-text"
                  : "bg-muted text-muted-foreground"
              }
            />
            <span className="flex min-w-0 flex-1 flex-col gap-px">
              <span className="font-medium text-sm">{m.name}</span>
              <span className="text-muted-foreground text-xs">{m.email}</span>
            </span>
            {m.role === "Owner" ? (
              <span className="text-muted-foreground text-xs">Owner</span>
            ) : (
              <Select.Root defaultValue={m.role}>
                <Select.Trigger
                  aria-label={`Role for ${m.name}`}
                  className="h-[calc(var(--spacing-ui-height)-7px)] w-auto gap-1 pr-2 pl-3 text-xs"
                >
                  <Select.Value />
                  <Select.Icon />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Positioner sideOffset={5} alignItemWithTrigger={false}>
                    <Select.Popup>
                      {ROLES.map((r) => (
                        <Select.Item key={r} value={r}>
                          <Select.ItemText>{r}</Select.ItemText>
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Popup>
                  </Select.Positioner>
                </Select.Portal>
              </Select.Root>
            )}
          </div>
        ))}
      </div>
    </PreviewCard>
  );
}

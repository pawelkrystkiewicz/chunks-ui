import { Avatar, Button, Input, Select } from "chunks-ui";
import { PreviewCard, PreviewCardHeading } from "./PreviewCard";

const MEMBERS = [
  { name: "Alice Chen", initials: "AC", email: "alice@acme.dev", role: "Owner" },
  { name: "Bob Rivera", initials: "BR", email: "bob@acme.dev", role: "Editor" },
  { name: "Carl Zhang", initials: "CZ", email: "carl@acme.dev", role: "Editor" },
  { name: "Eve Nakamura", initials: "EN", email: "eve@acme.dev", role: "Viewer" },
];
const ROLES = ["Editor", "Viewer"];

export function TeamCard() {
  return (
    <PreviewCard>
      <PreviewCardHeading title="Team" description="Invite collaborators to this project." />
      <div className="flex gap-2">
        {/* A short placeholder: in the narrowest column, with text spacing overridden, the field
            shows about 120px of text, and an address such as name@acme.dev is wider */}
        <Input
          type="email"
          placeholder="Email"
          aria-label="Email address"
          className="min-w-0 flex-1"
        />
        <Button color="secondary">Invite</Button>
      </div>
      <div className="flex flex-col gap-4">
        {MEMBERS.map((m, i) => (
          <div key={m.email} className="flex items-center gap-3">
            <Avatar
              fallback={m.initials}
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
                  className="h-[calc(var(--spacing-ui-height)-7px)] w-auto gap-1 pe-2 ps-3 text-xs"
                >
                  <Select.Value />
                  <Select.Icon />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Positioner
                    className="w-auto min-w-[var(--anchor-width)]"
                    sideOffset={5}
                    alignItemWithTrigger={false}
                  >
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

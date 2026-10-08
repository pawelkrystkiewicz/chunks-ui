import { CreditCard, LayoutDashboard, Plus, Search, Terminal, User } from "lucide-react";
import type { ReactNode } from "react";
import { PreviewCard } from "./PreviewCard";

function Item({
  icon,
  label,
  shortcut,
  active,
}: {
  icon: ReactNode;
  label: string;
  shortcut?: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex h-[calc(var(--spacing-ui-height)-3px)] items-center gap-3 rounded-sm px-2 text-sm [&_svg]:size-4 ${active ? "bg-accent text-accent-foreground" : "hover:bg-accent"}`}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {shortcut && (
        <span className="font-mono text-[0.7857em] text-muted-foreground">{shortcut}</span>
      )}
    </div>
  );
}

function Group({ children }: { children: string }) {
  return (
    <span className="px-2 pt-2 pb-1 font-semibold text-[0.7857em] text-muted-foreground">
      {children}
    </span>
  );
}

export function CommandCard() {
  return (
    <PreviewCard className="gap-0 overflow-hidden bg-popover p-0 text-popover-foreground">
      <div className="flex h-[calc(var(--spacing-ui-height)+12px)] items-center gap-2 border-border border-b px-4 text-muted-foreground">
        <Search className="size-4" />
        <span className="flex-1 text-sm">Type a command…</span>
        <span className="rounded-sm border border-border px-1.5 py-px font-mono text-[0.7857em]">
          ⌘K
        </span>
      </div>
      <div className="flex flex-col gap-px p-2">
        <Group>Suggestions</Group>
        <Item active icon={<LayoutDashboard />} label="Dashboard" />
        <Item icon={<Plus />} label="New task" shortcut="⌘N" />
        <Item icon={<Terminal />} label="Open terminal" shortcut="⌘J" />
        <div className="-mx-2 my-1 h-px bg-border" />
        <Group>Account</Group>
        <Item icon={<User />} label="Profile" shortcut="⌘P" />
        <Item icon={<CreditCard />} label="Billing" />
      </div>
    </PreviewCard>
  );
}

"use client";

import { Menu, Toast, ToggleGroup } from "chunks-ui";
import {
  Download,
  FileText,
  Kanban,
  LayoutGrid,
  List,
  MoreHorizontal,
  Share2,
  Trash2,
} from "lucide-react";

function ActionsMenu() {
  const { add } = Toast.useToast();

  return (
    <Menu.Root>
      <Menu.Trigger>
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="More actions"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </Menu.Trigger>
      <Menu.Content>
        <Menu.Group>
          <Menu.GroupLabel>Export</Menu.GroupLabel>
          <Menu.Item
            onClick={() => add({ title: "Exported", description: "Tasks exported as CSV." })}
          >
            <Download className="mr-2 size-4" />
            Export CSV
          </Menu.Item>
          <Menu.Item
            onClick={() => add({ title: "Exported", description: "Report generated as PDF." })}
          >
            <FileText className="mr-2 size-4" />
            Export PDF
          </Menu.Item>
        </Menu.Group>
        <Menu.Separator />
        <Menu.Group>
          <Menu.GroupLabel>Actions</Menu.GroupLabel>
          <Menu.Item
            onClick={() =>
              add({ title: "Link copied", description: "Shareable link is on your clipboard." })
            }
          >
            <Share2 className="mr-2 size-4" />
            Share Board
          </Menu.Item>
          <Menu.Item className="text-destructive">
            <Trash2 className="mr-2 size-4" />
            Archive Project
          </Menu.Item>
        </Menu.Group>
      </Menu.Content>
    </Menu.Root>
  );
}

function ViewToggle() {
  return (
    <ToggleGroup.Root defaultValue={["list"]}>
      <ToggleGroup.Item value="list" aria-label="List view">
        <List className="size-4" />
      </ToggleGroup.Item>
      <ToggleGroup.Item value="board" aria-label="Board view">
        <Kanban className="size-4" />
      </ToggleGroup.Item>
      <ToggleGroup.Item value="grid" aria-label="Grid view">
        <LayoutGrid className="size-4" />
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  );
}

export function QuickActions() {
  return (
    <div className="flex items-center gap-2">
      <ViewToggle />
      <ActionsMenu />
    </div>
  );
}

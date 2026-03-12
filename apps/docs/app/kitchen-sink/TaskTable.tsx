"use client";

import { Avatar, Button, Checkbox, Chip, Input, Select, Table, Tooltip } from "chunks-ui";
import { ArrowUpDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Task, TaskPriority, TaskStatus } from "./data";
import { STATUS_OPTIONS, TASKS } from "./data";

const priorityColors: Record<TaskPriority, string> = {
  low: "text-muted-foreground",
  medium: "text-foreground",
  high: "text-warning",
  critical: "text-destructive",
};

const statusColors: Record<TaskStatus, string> = {
  backlog: "bg-muted text-muted-foreground",
  "in-progress": "bg-warning/15 text-warning",
  "in-review": "bg-primary/15 text-primary",
  done: "bg-success/15 text-success",
};

const statusLabels: Record<TaskStatus, string> = {
  backlog: "Backlog",
  "in-progress": "In Progress",
  "in-review": "In Review",
  done: "Done",
};

type SortKey = "title" | "priority" | "dueDate";
type SortDir = "asc" | "desc";

const priorityOrder: Record<TaskPriority, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

export function TaskTable() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("dueDate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    let result: Task[] = [...TASKS];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)),
      );
    }
    if (statusFilter) {
      result = result.filter((t) => t.status === statusFilter);
    }
    result.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "title") return a.title.localeCompare(b.title) * dir;
      if (sortKey === "priority")
        return (priorityOrder[a.priority] - priorityOrder[b.priority]) * dir;
      return a.dueDate.localeCompare(b.dueDate) * dir;
    });
    return result;
  }, [search, statusFilter, sortKey, sortDir]);

  const allSelected = filtered.length > 0 && filtered.every((t) => selected.has(t.id));

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(filtered.map((t) => t.id)));
    } else {
      setSelected(new Set());
    }
  };

  const toggleRow = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          startAdornment={<Search className="size-4 text-muted-foreground" />}
          className="sm:max-w-xs"
        />
        <Select.Root
          value={statusFilter ?? undefined}
          onValueChange={(val) => setStatusFilter(val || null)}
        >
          <Select.Trigger className="w-40">
            <Select.Value placeholder="All statuses" />
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
        {selected.size > 0 && (
          <span className="text-muted-foreground text-sm">{selected.size} selected</span>
        )}
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head className="w-10">
                <Checkbox.Root
                  checked={allSelected}
                  onCheckedChange={(c) => toggleAll(!!c)}
                  aria-label="Select all"
                >
                  <Checkbox.Indicator />
                </Checkbox.Root>
              </Table.Head>
              <Table.Head className="w-24">ID</Table.Head>
              <Table.Head>
                <Button
                  variant="text"
                  color="secondary"
                  onClick={() => toggleSort("title")}
                  className="!px-0"
                >
                  Title
                  <ArrowUpDown className="ml-1 size-3" />
                </Button>
              </Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head>
                <Button
                  variant="text"
                  color="secondary"
                  onClick={() => toggleSort("priority")}
                  className="!px-0"
                >
                  Priority
                  <ArrowUpDown className="ml-1 size-3" />
                </Button>
              </Table.Head>
              <Table.Head>Assignee</Table.Head>
              <Table.Head>
                <Button
                  variant="text"
                  color="secondary"
                  onClick={() => toggleSort("dueDate")}
                  className="!px-0"
                >
                  Due
                  <ArrowUpDown className="ml-1 size-3" />
                </Button>
              </Table.Head>
              <Table.Head>Tags</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filtered.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No tasks match your filters.
                </Table.Cell>
              </Table.Row>
            ) : (
              filtered.map((task) => (
                <Table.Row
                  key={task.id}
                  data-state={selected.has(task.id) ? "selected" : undefined}
                >
                  <Table.Cell>
                    <Checkbox.Root
                      checked={selected.has(task.id)}
                      onCheckedChange={(c) => toggleRow(task.id, !!c)}
                      aria-label={`Select ${task.title}`}
                    >
                      <Checkbox.Indicator />
                    </Checkbox.Root>
                  </Table.Cell>
                  <Table.Cell className="font-mono text-muted-foreground text-xs">
                    {task.id}
                  </Table.Cell>
                  <Table.Cell className="font-medium">{task.title}</Table.Cell>
                  <Table.Cell>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[task.status]}`}
                    >
                      {statusLabels[task.status]}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className={`text-sm capitalize ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <Tooltip.Root>
                      <Tooltip.Trigger>
                        <div className="flex items-center gap-2">
                          <Avatar src={task.assignee.avatar} alt={task.assignee.name} size={24} />
                          <span className="text-sm">{task.assignee.name.split(" ")[0]}</span>
                        </div>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Positioner>
                          <Tooltip.Popup>
                            {task.assignee.name} &mdash; {task.assignee.role}
                          </Tooltip.Popup>
                        </Tooltip.Positioner>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Table.Cell>
                  <Table.Cell className="text-muted-foreground text-sm">
                    {new Date(task.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-1">
                      {task.tags.map((tag) => (
                        <Chip key={tag}>{tag}</Chip>
                      ))}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>
      </div>
    </div>
  );
}

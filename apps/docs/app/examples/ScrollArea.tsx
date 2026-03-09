"use client";

import { ScrollArea } from "chunks-ui";
import { Container } from "@/components";

const notifications = [
  { id: 1, title: "Pull request merged", body: "feat(tabs): add animated indicator" },
  { id: 2, title: "Build succeeded", body: "All 21 tests passed in 1.4s" },
  { id: 3, title: "New comment", body: "Looks good, left a few style notes" },
  { id: 4, title: "Dependency update", body: "tailwindcss bumped to 4.1.2" },
  { id: 5, title: "Review requested", body: "feat(number-field): add scrub area" },
  { id: 6, title: "Deploy complete", body: "docs.chunks-ui.dev updated" },
  { id: 7, title: "Issue closed", body: "fix(combobox): keyboard navigation" },
  { id: 8, title: "Release published", body: "chunks-ui v0.8.0 on npm" },
];

export function ScrollAreaBasicExample() {
  return (
    <Container>
      <ScrollArea.Root className="h-64 w-full max-w-sm rounded border border-border">
        <ScrollArea.Viewport>
          <ScrollArea.Content className="divide-y divide-border">
            {notifications.map((n) => (
              <div key={n.id} className="px-4 py-3">
                <p className="font-medium text-foreground text-sm">{n.title}</p>
                <p className="text-muted-foreground text-xs">{n.body}</p>
              </div>
            ))}
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical">
          <ScrollArea.Thumb />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </Container>
  );
}

const columns = Array.from({ length: 12 }, (_, i) => `Column ${i + 1}`);
const rows = Array.from({ length: 8 }, (_, i) => `Row ${i + 1}`);

export function ScrollAreaHorizontalExample() {
  return (
    <Container>
      <ScrollArea.Root className="w-full max-w-sm rounded border border-border">
        <ScrollArea.Viewport>
          <ScrollArea.Content>
            <table className="min-w-max text-sm">
              <thead>
                <tr className="border-border border-b bg-muted/50">
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="whitespace-nowrap px-4 py-2 text-left font-medium text-muted-foreground"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row} className="border-border border-b last:border-0">
                    {columns.map((col) => (
                      <td key={col} className="whitespace-nowrap px-4 py-2 text-foreground">
                        {row} / {col}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="horizontal">
          <ScrollArea.Thumb />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </Container>
  );
}

export function ScrollAreaBothExample() {
  return (
    <Container>
      <ScrollArea.Root className="h-48 w-full max-w-sm rounded border border-border">
        <ScrollArea.Viewport>
          <ScrollArea.Content>
            <table className="min-w-max text-sm">
              <thead>
                <tr className="border-border border-b bg-muted/50">
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="whitespace-nowrap px-4 py-2 text-left font-medium text-muted-foreground"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row} className="border-border border-b last:border-0">
                    {columns.map((col) => (
                      <td key={col} className="whitespace-nowrap px-4 py-2 text-foreground">
                        {row} / {col}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical">
          <ScrollArea.Thumb />
        </ScrollArea.Scrollbar>
        <ScrollArea.Scrollbar orientation="horizontal">
          <ScrollArea.Thumb />
        </ScrollArea.Scrollbar>
        <ScrollArea.Corner />
      </ScrollArea.Root>
    </Container>
  );
}

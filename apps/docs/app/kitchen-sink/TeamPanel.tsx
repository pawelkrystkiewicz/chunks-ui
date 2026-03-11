"use client";

import { Avatar, Button, Card, Progress } from "chunks-ui";
import { Mail } from "lucide-react";
import { TEAM } from "./data";

export function TeamPanel() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {TEAM.map((member) => {
        const pct = Math.round((member.tasksCompleted / member.tasksTotal) * 100);
        return (
          <Card.Root key={member.id}>
            <Card.Content className="p-4">
              <div className="flex items-start gap-3">
                <Avatar alt={member.name} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{member.name}</p>
                  <p className="truncate text-muted-foreground text-xs">{member.role}</p>
                </div>
                <Button variant="text" color="secondary" aria-label={`Email ${member.name}`}>
                  <Mail className="size-4" />
                </Button>
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Tasks</span>
                  <span>
                    {member.tasksCompleted}/{member.tasksTotal}
                  </span>
                </div>
                <Progress.Root value={pct} max={100}>
                  <Progress.Track>
                    <Progress.Indicator />
                  </Progress.Track>
                </Progress.Root>
              </div>
            </Card.Content>
          </Card.Root>
        );
      })}
    </div>
  );
}

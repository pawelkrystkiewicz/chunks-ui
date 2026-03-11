"use client";

import { Avatar, Separator } from "chunks-ui";
import { ACTIVITIES, TEAM } from "./data";

const avatarByName = new Map(TEAM.map((m) => [m.name, m.avatar]));

export function ActivityFeed() {
  return (
    <div className="space-y-0">
      {ACTIVITIES.map((activity, i) => (
        <div key={activity.id}>
          <div className="flex items-start gap-3 py-3">
            <Avatar
              src={avatarByName.get(activity.user)}
              alt={activity.user}
              size={28}
              className="mt-0.5 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm">
                <span className="font-medium">{activity.user}</span>{" "}
                <span className="text-muted-foreground">{activity.action}</span>{" "}
                <span className="font-medium">{activity.target}</span>
              </p>
              <p className="mt-0.5 text-muted-foreground text-xs">{activity.time}</p>
            </div>
          </div>
          {i < ACTIVITIES.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  );
}

// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { TeamCard } from "../create/preview/TeamCard";
import { ActivityFeed } from "./ActivityFeed";
import { TEAM } from "./data";
import { TaskTable } from "./TaskTable";
import { TeamPanel } from "./TeamPanel";

// Each avatar sits next to the person's visible name, so it must not name them again
describe.each<[string, () => ReactElement]>([
  ["TeamPanel", () => <TeamPanel />],
  ["TaskTable", () => <TaskTable />],
  ["ActivityFeed", () => <ActivityFeed />],
  ["TeamCard", () => <TeamCard />],
])("%s avatars", (_, ui) => {
  it("show initials without naming the person", () => {
    render(ui());
    for (const { name } of TEAM) {
      expect(screen.queryAllByRole("img", { name })).toHaveLength(0);
    }
    expect(screen.getAllByText("AC").length).toBeGreaterThan(0);
  });
});

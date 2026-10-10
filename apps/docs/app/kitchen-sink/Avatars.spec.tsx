// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { TeamCard } from "../create/preview/TeamCard";
import { ActivityFeed } from "./ActivityFeed";
import { TEAM } from "./data";
import { TaskTable } from "./TaskTable";
import { TeamPanel } from "./TeamPanel";

beforeAll(() => {
  // jsdom lacks both: popups measure their parts, useReducedMotion queries media.
  // Motion below 12.20.4 subscribes with the deprecated addListener.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  window.matchMedia ??= (media) =>
    ({
      matches: false,
      media,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
    }) as never;
});

afterEach(cleanup);

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

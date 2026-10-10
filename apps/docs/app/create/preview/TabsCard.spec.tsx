// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, expect, it } from "vitest";
import { TabsCard } from "./TabsCard";

beforeAll(() => {
  // jsdom lacks it, and useReducedMotion queries media
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

// The spring and the panel change need layout and frames, which jsdom lacks; the visual
// check on /create covers them. These pin the structure they run on.
it("draws the active pill with the tabs indicator", () => {
  render(<TabsCard />);
  const list = screen.getByRole("tablist");
  // Base UI's indicator is a presentation span in the list; with no layout it stays hidden
  expect(within(list).queryByRole("presentation", { hidden: true })).not.toBeNull();
});

it.each([
  { tab: "Activity", content: () => screen.getByText("12 minutes ago") },
  { tab: "Notes", content: () => screen.getByRole("textbox", { name: "Note" }) },
  { tab: "Overview", content: () => screen.getByRole("progressbar", { name: "Sprint 14" }) },
])("switching to $tab shows its panel, labelled by its tab", ({ tab, content }) => {
  render(<TabsCard />);
  fireEvent.click(screen.getByRole("tab", { name: "Notes" }));
  fireEvent.click(screen.getByRole("tab", { name: tab }));

  expect(screen.getByRole("tab", { name: tab }).getAttribute("aria-selected")).toBe("true");
  const panel = screen.getByRole("tabpanel", { name: tab });
  expect(panel.contains(content())).toBe(true);
});

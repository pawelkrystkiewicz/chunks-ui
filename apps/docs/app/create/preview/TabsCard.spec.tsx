// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

// The spring and the panel change need layout and frames, which jsdom lacks, so the motion was
// checked by hand in a browser on /create. These cover the panel switching.
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

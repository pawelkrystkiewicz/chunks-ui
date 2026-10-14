// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { TabsCard } from "./TabsCard";

// The spring and the slide need layout and frames, which jsdom lacks, so the motion was checked
// by hand in a browser on /create. These cover the panel switching.
it.each([
  { tab: "Activity", content: () => screen.getByText("12 minutes ago") },
  { tab: "Notes", content: () => screen.getByRole("textbox", { name: "Note" }) },
  { tab: "Overview", content: () => screen.getByRole("progressbar", { name: "Sprint 14" }) },
])(
  "switching to $tab shows its panel, labelled by its tab, and hides the others",
  ({ tab, content }) => {
    render(<TabsCard />);
    fireEvent.click(screen.getByRole("tab", { name: "Notes" }));
    fireEvent.click(screen.getByRole("tab", { name: tab }));

    expect(screen.getByRole("tab", { name: tab }).getAttribute("aria-selected")).toBe("true");
    const panel = screen.getByRole("tabpanel", { name: tab });
    expect(panel.contains(content())).toBe(true);
    // Tabs.Contents keeps every panel mounted. Its wrapper hides an inactive one with display:none
    // (CSS fallback) or inert (Motion), whichever path the spec is on when Motion's lazy load lands.
    const active = panel.parentElement;
    expect(active).toBeTruthy();
    expect(active?.style.display).not.toBe("none");
    expect(active?.hasAttribute("inert")).toBe(false);
    const panels = screen.getAllByRole("tabpanel", { hidden: true });
    expect(panels).toHaveLength(3);
    for (const other of panels.filter((p) => p !== panel)) {
      const wrapper = other.parentElement;
      expect(wrapper?.style.display === "none" || wrapper?.hasAttribute("inert")).toBe(true);
    }
  },
);

it("draws the Note field's focus ring inside the field, so the slide track cannot clip it", () => {
  render(<TabsCard />);
  expect(screen.getByRole("textbox", { name: "Note" }).className).toContain(
    "focus-visible:-outline-offset-2",
  );
});

// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { TaskTable } from "./TaskTable";

/** Opens the popup from the trigger, then clicks the option. */
async function pick(trigger: HTMLElement, option: string) {
  await act(async () => {
    fireEvent.click(trigger);
  });
  const item = await screen.findByRole("option", { name: option });
  // Base UI's SelectItem ignores a mouse click that did not start on the item
  await act(async () => {
    fireEvent.pointerDown(item, { pointerType: "mouse" });
    fireEvent.click(item);
  });
}

// Without `items` on Select.Root, these triggers show the raw value ("in-progress", "u1") (#591)
describe("kitchen sink Selects", () => {
  it("the task table's status filter shows the picked status's label", async () => {
    // Base UI reports a Select switching from uncontrolled to controlled through console.error
    const error = vi.spyOn(console, "error");
    try {
      render(<TaskTable />);
      const trigger = screen.getByRole("combobox", { name: "Status" });
      expect(trigger.textContent).toBe("All statuses");

      await pick(trigger, "In Progress");

      expect(trigger.textContent).toBe("In Progress");
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });

  describe("the create-task dialog", () => {
    async function open() {
      render(<CreateTaskDialog />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "New Task" }));
      });
      await screen.findByRole("dialog", { name: "Create Task" });
    }

    it.each([
      ["Status", "Backlog"],
      ["Priority", "Medium"],
    ])("shows the default %s's label", async (name, label) => {
      await open();

      expect(screen.getByRole("combobox", { name }).textContent).toBe(label);
    });

    it("shows the picked assignee's name", async () => {
      await open();
      const trigger = screen.getByRole("combobox", { name: "Assignee" });
      expect(trigger.textContent).toBe("Assign to...");

      await pick(trigger, "Bob Rivera");

      expect(trigger.textContent).toBe("Bob Rivera");
    });
  });
});

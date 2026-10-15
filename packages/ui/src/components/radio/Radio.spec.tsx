import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Field } from "../field";
import { Radio } from "./Radio";

afterEach(cleanup);

describe("Radio", () => {
  it("renders a radio group", () => {
    render(
      <Radio.Group data-testid="group">
        <Radio.Root value="a">
          <Radio.Indicator />
        </Radio.Root>
      </Radio.Group>,
    );
    expect(screen.getByTestId("group")).toBeInTheDocument();
    expect(screen.getByRole("radio")).toBeInTheDocument();
  });

  it("merges custom className on Group", () => {
    render(<Radio.Group className="custom" data-testid="group" />);
    expect(screen.getByTestId("group")).toHaveClass("custom");
  });

  it("merges custom className on Root", () => {
    render(
      <Radio.Group>
        <Radio.Root value="a" className="custom" />
      </Radio.Group>,
    );
    expect(screen.getByRole("radio")).toHaveClass("custom");
  });

  it("renders Indicator with custom className", () => {
    render(
      <Radio.Group defaultValue="a">
        <Radio.Root value="a">
          <Radio.Indicator data-testid="ind" className="custom" />
        </Radio.Root>
      </Radio.Group>,
    );
    expect(screen.getByTestId("ind")).toHaveClass("custom");
  });

  it("renders Item with label", () => {
    render(
      <Radio.Group aria-label="Options">
        <Radio.Item value="a">Option A</Radio.Item>
      </Radio.Group>,
    );
    expect(screen.getByText("Option A")).toBeInTheDocument();
    expect(screen.getByRole("radio")).toBeInTheDocument();
  });

  // The item's label dims and shows a not-allowed cursor when the radio inside it carries Base
  // UI's `data-disabled`, whichever disables it. The opacity itself is measured in Radio.visual.spec.
  const ITEM_DISABLED_CLASSES = [
    "has-[>[data-disabled]]:cursor-not-allowed",
    "has-[>[data-disabled]]:opacity-50",
  ];

  it("marks an Item disabled by its prop, its group or a Field.Root, and ignores clicks on it", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <>
        <Radio.Group aria-label="Plan" onValueChange={onValueChange}>
          <Radio.Item value="a" disabled>
            By prop
          </Radio.Item>
          <Radio.Item value="b">Enabled</Radio.Item>
        </Radio.Group>
        <Radio.Group aria-label="Tier" disabled onValueChange={onValueChange}>
          <Radio.Item value="c">By group</Radio.Item>
        </Radio.Group>
        <Field.Root disabled>
          <Radio.Group aria-label="Billing" onValueChange={onValueChange}>
            <Radio.Item value="d">By field, in a group</Radio.Item>
          </Radio.Group>
          <Radio.Item value="e">By field, no group</Radio.Item>
        </Field.Root>
      </>,
    );
    const item = (text: string) => {
      const label = screen.getByText(text).closest("label");
      if (!label) throw new Error(`no label for ${text}`);
      return { label, radio: within(label).getByRole("radio") };
    };
    for (const text of ["By prop", "By group", "By field, in a group", "By field, no group"]) {
      const { label, radio } = item(text);
      expect(radio).toHaveAttribute("data-disabled");
      expect(label).toHaveClass(...ITEM_DISABLED_CLASSES);
      await user.click(label);
      // The group's spy cannot see an item outside a group: check the radio itself
      expect(radio).toHaveAttribute("aria-checked", "false");
    }
    expect(onValueChange).not.toHaveBeenCalled();
    expect(item("Enabled").radio).not.toHaveAttribute("data-disabled");
    await user.click(item("Enabled").label);
    expect(onValueChange).toHaveBeenCalledWith("b", expect.anything());
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <Radio.Group defaultValue="a" aria-label="Options">
        <Radio.Root value="a" aria-label="Option A">
          <Radio.Indicator />
        </Radio.Root>
      </Radio.Group>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("keeps Indicator mounted when unchecked in motion mode", async () => {
    // No defaultValue → radio is unchecked.
    // CSS fallback: Indicator unmounts when unchecked (no keepMounted).
    // Motion mode: keepMounted keeps it in the DOM.
    render(
      <Radio.Group>
        <Radio.Root value="a">
          <Radio.Indicator data-testid="ind" />
        </Radio.Root>
      </Radio.Group>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("ind")).toBeInTheDocument();
    });
  });
});

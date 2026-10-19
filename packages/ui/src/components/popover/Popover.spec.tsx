import { Popover as BasePopover } from "@base-ui/react/popover";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { configureAxe } from "jest-axe";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { undecided } from "../../AxeTest.utils";
import { Popover } from "./Popover";

afterEach(cleanup);

// aria-hidden-focus skips Base UI's focus guards, aria-hidden spans that hand focus on when Tab
// reaches them. A browser's axe leaves them for review, as it takes the open popover, a dialog,
// for a modal. Here axe runs while the popup is still at opacity 0, and so is Base UI's
// positioner around it, so axe finds no modal and flags them. The rule still checks every other
// aria-hidden node. Were axe to find a modal, it would leave a stray one in `incomplete`, which
// toHaveNoViolations() does not read, so the audit also checks that the rule left nothing there
const axe = configureAxe({
  globalOptions: {
    rules: [
      { id: "aria-hidden-focus", selector: '[aria-hidden="true"]:not([data-base-ui-focus-guard])' },
    ],
  },
});

describe("Popover", () => {
  it("renders Content with custom className", () => {
    render(
      <Popover.Root open>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content className="custom" data-testid="content">
          Content
        </Popover.Content>
      </Popover.Root>,
    );
    expect(screen.getByTestId("content")).toHaveClass("custom");
  });

  it("renders Arrow with custom className", () => {
    render(
      <Popover.Root open>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <Popover.Arrow className="custom" data-testid="arrow" />
        </Popover.Content>
      </Popover.Root>,
    );
    expect(screen.getByTestId("arrow")).toHaveClass("custom");
  });

  it("leaves the arrow's padding to Base UI where there is no layout", async () => {
    // jsdom has no layout: the arrow's computed width is "", which must not become a NaN padding
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <Popover.Root open>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <Popover.Arrow data-testid="arrow" />
        </Popover.Content>
      </Popover.Root>,
    );
    const arrow = screen.getByTestId("arrow");
    await waitFor(() => expect(arrow).toHaveAttribute("data-side"));
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it("renders Title with custom className", () => {
    render(
      <Popover.Root open>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <Popover.Title className="custom" data-testid="title">
            Heading
          </Popover.Title>
        </Popover.Content>
      </Popover.Root>,
    );
    expect(screen.getByTestId("title")).toHaveClass("custom");
  });

  it("renders Description with custom className", () => {
    render(
      <Popover.Root open>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <Popover.Description className="custom" data-testid="desc">
            Info
          </Popover.Description>
        </Popover.Content>
      </Popover.Root>,
    );
    expect(screen.getByTestId("desc")).toHaveClass("custom");
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <Popover.Root open>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <Popover.Title>Title</Popover.Title>
        </Popover.Content>
      </Popover.Root>,
    );
    // The popup is portalled out of the container RTL hands back, so audit the body
    expect(container).not.toContainElement(screen.getByRole("dialog"));
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
    expect(undecided(results, "aria-hidden-focus")).toEqual([]);
  });
});

// Base UI 1.9 closes a popup that is already closing, as "focus-out"; Popover drops a close while
// the popup is not open, and keeps every other
describe("Popover onOpenChange reports", () => {
  const popover = (props: Parameters<typeof Popover.Root>[0]) => (
    <Popover.Root {...props}>
      <Popover.Trigger>Open</Popover.Trigger>
      <Popover.Content>Content</Popover.Content>
    </Popover.Root>
  );

  it("a close that comes in the batch of an open, on a controlled popover", () => {
    const handle = BasePopover.createHandle();
    const onOpenChange = vi.fn();
    render(
      <Popover.Root open={false} handle={handle} onOpenChange={onOpenChange}>
        <Popover.Content>Content</Popover.Content>
      </Popover.Root>,
    );
    render(<Popover.Trigger handle={handle} id="t1" />);
    act(() => {
      handle.open("t1");
      handle.close();
    });
    expect(onOpenChange.mock.calls.map(([open]) => open)).toEqual([true, false]);
  });

  it("a close that comes in the batch of an open, with a stateful controlled parent", () => {
    const handle = BasePopover.createHandle();
    const onOpenChange = vi.fn();
    function Parent() {
      const [open, setOpen] = useState(false);
      return (
        <Popover.Root
          open={open}
          handle={handle}
          onOpenChange={(next, details) => {
            onOpenChange(next, details.reason);
            setOpen(next);
          }}
        >
          <Popover.Content>Content</Popover.Content>
        </Popover.Root>
      );
    }
    render(<Parent />);
    render(<Popover.Trigger handle={handle} id="t1" />);
    act(() => {
      handle.open("t1");
      handle.close();
    });
    expect(onOpenChange.mock.calls.map(([open]) => open)).toEqual([true, false]);
    expect(handle.isOpen).toBe(false);
  });

  it("no close, after a controlled parent refused an open", () => {
    const handle = BasePopover.createHandle();
    const onOpenChange = vi.fn();
    // A new element each time, as a parent's re-render makes: the same one would bail out
    const root = () => (
      <Popover.Root open={false} handle={handle} onOpenChange={onOpenChange}>
        <Popover.Content>Content</Popover.Content>
      </Popover.Root>
    );
    const { rerender } = render(root());
    render(<Popover.Trigger handle={handle} id="t1" />);
    act(() => handle.open("t1"));
    rerender(root());
    act(() => handle.close());
    expect(onOpenChange.mock.calls.map(([open]) => open)).toEqual([true]);
  });

  it("the next Escape, after a handler cancelled the first", async () => {
    const onOpenChange = vi.fn((_open: boolean, details: { cancel: () => void }) => {
      if (onOpenChange.mock.calls.length === 1) details.cancel();
    });
    render(popover({ defaultOpen: true, onOpenChange }));
    await screen.findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledTimes(2);
    expect(onOpenChange.mock.calls.map(([open]) => open)).toEqual([false, false]);
  });

  it("the next close, after a controlled parent ignored the first", async () => {
    const onOpenChange = vi.fn();
    render(popover({ open: true, onOpenChange }));
    await screen.findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    await userEvent.keyboard("{Escape}");
    expect(onOpenChange.mock.calls.map(([open]) => open)).toEqual([false, false]);
  });
});

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { reloadMotion } from "../../lib/use-motion";
import { Popover } from "./Popover";

afterEach(cleanup);

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
    expect(
      await axe(container, {
        rules: {
          // Base UI focus-guard spans with role="button" are internal implementation details
          "aria-command-name": { enabled: false },
        },
      }),
    ).toHaveNoViolations();
  });
});

// Last, since Motion stays loaded for the tests that follow
describe("Popover.Content with Motion loaded", () => {
  function renderContent(renderProp?: ReactElement) {
    render(
      <Popover.Root open>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content render={renderProp} data-testid="content">
          Content
        </Popover.Content>
      </Popover.Root>,
    );
    return screen.getByTestId("content");
  }

  it("animates the default element with Motion, not CSS", async () => {
    await reloadMotion();
    expect(renderContent()).not.toHaveClass("micro-interactions");
  });

  // A consumer's `render` replaces the animated element, so the spring cannot attach to it
  it("keeps the CSS transition on the element a render prop gives it", async () => {
    await reloadMotion();
    const el = renderContent(<section />);
    expect(el.tagName).toBe("SECTION");
    expect(el).toHaveClass("micro-interactions", "data-starting-style:opacity-0");
  });
});

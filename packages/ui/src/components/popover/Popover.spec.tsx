import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
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

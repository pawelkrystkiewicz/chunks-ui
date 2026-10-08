import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Popover } from "../components/popover";
import { Select } from "../components/select";
import { PortalContainerProvider } from "./portal-container";

afterEach(cleanup);

describe("PortalContainerProvider", () => {
  it("renders popups into the provided container", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    render(
      <PortalContainerProvider value={container}>
        <Popover.Root open>
          <Popover.Trigger>Open</Popover.Trigger>
          <Popover.Content data-testid="popover">Content</Popover.Content>
        </Popover.Root>
        <Select.Root open defaultValue="a">
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup data-testid="select">
                <Select.Item value="a">A</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </PortalContainerProvider>,
    );
    expect(container).toContainElement(screen.getByTestId("popover"));
    expect(container).toContainElement(screen.getByTestId("select"));
    container.remove();
  });

  it("falls back to document.body without a provider", () => {
    const { container } = render(
      <Popover.Root open>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content data-testid="popover">Content</Popover.Content>
      </Popover.Root>,
    );
    const popover = screen.getByTestId("popover");
    expect(container).not.toContainElement(popover);
    expect(document.body).toContainElement(popover);
  });
});

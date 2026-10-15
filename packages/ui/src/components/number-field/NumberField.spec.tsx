import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PortalContainerProvider } from "../../lib/portal-container";
import { NumberField } from "./NumberField";
import { DEFAULT_NUMBER_FIELD_LABELS } from "./NumberField.Labels";

afterEach(cleanup);

// Base UI NumberField renders the input as role="textbox" with aria-roledescription="Number field"
function BasicNumberField(props: Partial<React.ComponentProps<typeof NumberField.Root>> = {}) {
  return (
    <NumberField.Root defaultValue={0} {...props}>
      <NumberField.Group>
        <NumberField.Decrement aria-label="Decrement" />
        <NumberField.Input />
        <NumberField.Increment aria-label="Increment" />
      </NumberField.Group>
    </NumberField.Root>
  );
}

describe("NumberField", () => {
  it("renders all sub-components", () => {
    render(<BasicNumberField />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decrement" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Increment" })).toBeInTheDocument();
  });

  it("displays the default value", () => {
    render(<BasicNumberField defaultValue={42} />);
    expect(screen.getByRole("textbox")).toHaveValue("42");
  });

  it("merges custom className on Root", () => {
    render(<BasicNumberField className="custom" data-testid="root" />);
    expect(screen.getByTestId("root")).toHaveClass("custom");
  });

  it("merges custom className on Group", () => {
    render(
      <NumberField.Root defaultValue={0}>
        <NumberField.Group className="custom" data-testid="group">
          <NumberField.Decrement aria-label="Decrement" />
          <NumberField.Input />
          <NumberField.Increment aria-label="Increment" />
        </NumberField.Group>
      </NumberField.Root>,
    );
    expect(screen.getByTestId("group")).toHaveClass("custom");
  });

  it("increments value when Increment button is clicked", async () => {
    const user = userEvent.setup();
    render(<BasicNumberField defaultValue={5} />);
    await user.click(screen.getByRole("button", { name: "Increment" }));
    expect(screen.getByRole("textbox")).toHaveValue("6");
  });

  it("decrements value when Decrement button is clicked", async () => {
    const user = userEvent.setup();
    render(<BasicNumberField defaultValue={5} />);
    await user.click(screen.getByRole("button", { name: "Decrement" }));
    expect(screen.getByRole("textbox")).toHaveValue("4");
  });

  it("calls onValueChange when value changes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<BasicNumberField defaultValue={0} onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: "Increment" }));
    expect(onValueChange).toHaveBeenCalled();
  });

  it("renders ScrubArea when provided", () => {
    render(
      <NumberField.Root defaultValue={0}>
        <NumberField.ScrubArea data-testid="scrub">
          <NumberField.ScrubAreaCursor />
        </NumberField.ScrubArea>
        <NumberField.Group>
          <NumberField.Decrement aria-label="Decrement" />
          <NumberField.Input />
          <NumberField.Increment aria-label="Increment" />
        </NumberField.Group>
      </NumberField.Root>,
    );
    expect(screen.getByTestId("scrub")).toBeInTheDocument();
  });

  describe("ScrubAreaCursor", () => {
    // jsdom has no Pointer Lock API. Base UI asks for the lock when a mouse scrub starts and
    // drops the virtual cursor when the request fails, so grant it.
    beforeEach(() => {
      document.body.requestPointerLock = () => Promise.resolve();
      document.exitPointerLock = () => {};
    });
    afterEach(() => {
      Reflect.deleteProperty(document.body, "requestPointerLock");
      Reflect.deleteProperty(document, "exitPointerLock");
    });

    function ScrubField({
      cursor,
      render: renderCursor,
    }: {
      cursor?: React.ReactNode;
      render?: React.ComponentProps<typeof NumberField.ScrubAreaCursor>["render"];
    }) {
      return (
        <NumberField.Root defaultValue={0}>
          <NumberField.ScrubArea>
            <span>Amount</span>
            <NumberField.ScrubAreaCursor data-testid="cursor" render={renderCursor}>
              {cursor}
            </NumberField.ScrubAreaCursor>
          </NumberField.ScrubArea>
          <NumberField.Group>
            <NumberField.Input aria-label="Amount" />
          </NumberField.Group>
        </NumberField.Root>
      );
    }

    function startScrub() {
      fireEvent.pointerDown(screen.getByText("Amount"), { pointerType: "mouse", button: 0 });
    }

    it("renders nothing until a scrub starts", () => {
      render(<ScrubField />);
      expect(screen.queryByTestId("cursor")).not.toBeInTheDocument();
    });

    it("shows a default cursor icon while scrubbing", async () => {
      render(<ScrubField />);
      startScrub();
      const cursor = await screen.findByTestId("cursor");
      expect(cursor).toBeVisible();
      expect(cursor.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });

    it("renders custom children in place of the default icon", async () => {
      render(<ScrubField cursor={<span>drag</span>} />);
      startScrub();
      const cursor = await screen.findByTestId("cursor");
      expect(cursor).toHaveTextContent("drag");
      expect(cursor.querySelector("svg")).toBeNull();
    });

    it("adds no default icon to a render element, which may be a void element", async () => {
      render(<ScrubField render={<img alt="" src="data:," />} />);
      startScrub();
      const cursor = await screen.findByTestId("cursor");
      expect(cursor.tagName).toBe("IMG");
    });

    it("removes the cursor when the scrub ends", async () => {
      render(<ScrubField />);
      startScrub();
      await screen.findByTestId("cursor");
      fireEvent.pointerUp(window);
      await waitFor(() => expect(screen.queryByTestId("cursor")).not.toBeInTheDocument());
    });

    // Base UI portals the cursor to <body>, so a theme scoped to the provider's element would
    // not reach it there
    describe("inside a PortalContainerProvider", () => {
      let container: HTMLElement;
      beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
      });
      afterEach(() => container.remove());

      it("renders inside the provider's element and leaves when the scrub ends", async () => {
        render(
          <PortalContainerProvider value={container}>
            <ScrubField />
          </PortalContainerProvider>,
        );
        startScrub();
        const cursor = await screen.findByTestId("cursor");
        expect(container.contains(cursor)).toBe(true);
        // Base UI positions the cursor through its ref, which must reach the re-portalled element
        expect(cursor.style.transform).toMatch(/translate3d/);
        fireEvent.pointerUp(window);
        await waitFor(() => expect(screen.queryByTestId("cursor")).not.toBeInTheDocument());
      });

      it("keeps a render element and its children inside the provider's element", async () => {
        render(
          <PortalContainerProvider value={container}>
            <ScrubField cursor={<span>drag</span>} render={<em />} />
          </PortalContainerProvider>,
        );
        startScrub();
        const cursor = await screen.findByTestId("cursor");
        expect(cursor.tagName).toBe("EM");
        expect(cursor).toHaveTextContent("drag");
        expect(container.contains(cursor)).toBe(true);
      });

      it("renders in <body> while the provider's element is still null", async () => {
        render(
          <PortalContainerProvider value={null}>
            <ScrubField />
          </PortalContainerProvider>,
        );
        startScrub();
        expect((await screen.findByTestId("cursor")).parentElement).toBe(document.body);
      });
    });
  });

  it("respects max constraint (does not increment beyond max)", async () => {
    const user = userEvent.setup();
    render(<BasicNumberField defaultValue={10} max={10} />);
    await user.click(screen.getByRole("button", { name: "Increment" }));
    expect(screen.getByRole("textbox")).toHaveValue("10");
  });

  it("keeps input editable when value equals min (regression: boundary should not disable whole control)", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = React.useState<number | null>(0);
      return (
        <NumberField.Root min={0} max={15} value={value} onValueChange={setValue}>
          <NumberField.Group data-testid="group">
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField.Root>
      );
    }
    render(<Controlled />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input).not.toBeDisabled();
    expect(input).not.toHaveAttribute("aria-disabled", "true");
    await user.clear(input);
    await user.type(input, "5");
    await user.tab();
    expect(input).toHaveValue("5");
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <NumberField.Root defaultValue={0}>
        <NumberField.Group>
          <NumberField.Decrement aria-label="Decrement" />
          <NumberField.Input aria-label="Quantity" />
          <NumberField.Increment aria-label="Increment" />
        </NumberField.Group>
      </NumberField.Root>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("NumberField labels", () => {
  function UnnamedNumberField(props: Partial<React.ComponentProps<typeof NumberField.Root>> = {}) {
    return (
      <NumberField.Root defaultValue={0} {...props}>
        <NumberField.Group>
          <NumberField.Decrement />
          <NumberField.Input aria-label="Quantity" />
          <NumberField.Increment />
        </NumberField.Group>
      </NumberField.Root>
    );
  }

  it("uses DEFAULT_NUMBER_FIELD_LABELS", () => {
    render(<UnnamedNumberField />);
    const { increment, decrement, roleDescription } = DEFAULT_NUMBER_FIELD_LABELS;
    expect(screen.getByRole("button", { name: increment })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: decrement })).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-roledescription", roleDescription);
  });

  it("takes every string from labels on Root", () => {
    render(
      <UnnamedNumberField
        labels={{ increment: "Zwiększ", decrement: "Zmniejsz", roleDescription: "Pole liczbowe" }}
      />,
    );
    expect(screen.getByRole("button", { name: "Zwiększ" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zmniejsz" })).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-roledescription", "Pole liczbowe");
  });

  it("prefers aria-label and aria-roledescription on a part over labels", () => {
    render(
      <NumberField.Root defaultValue={0} labels={{ increment: "Zwiększ", roleDescription: "Pole" }}>
        <NumberField.Input aria-label="Quantity" aria-roledescription="Counter" />
        <NumberField.Increment aria-label="Add one" />
      </NumberField.Root>,
    );
    expect(screen.getByRole("button", { name: "Add one" })).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-roledescription", "Counter");
  });
});

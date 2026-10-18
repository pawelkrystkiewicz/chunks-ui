import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { reloadMotion } from "../../lib/use-motion";
import { FOCUS_RING } from "../shared";
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

  it("draws the dot without children", () => {
    render(
      <Radio.Group defaultValue="a">
        <Radio.Root value="a" aria-label="A">
          <Radio.Indicator data-testid="ind" />
        </Radio.Root>
      </Radio.Group>,
    );
    expect(screen.getByTestId("ind").firstElementChild).toHaveClass("rounded-full", "bg-primary");
  });

  it("renders the children of Indicator in place of the dot", () => {
    render(
      <Radio.Group defaultValue="a">
        <Radio.Root value="a" aria-label="A">
          <Radio.Indicator data-testid="ind">★</Radio.Indicator>
        </Radio.Root>
      </Radio.Group>,
    );
    const indicator = screen.getByTestId("ind");
    expect(indicator).toHaveTextContent(/^★$/);
    expect(indicator.children).toHaveLength(0);
  });

  it("renders no dot in a render element", () => {
    render(
      <Radio.Group defaultValue="a">
        <Radio.Root value="a" aria-label="A">
          <Radio.Indicator render={<span data-testid="ind" />} />
        </Radio.Root>
      </Radio.Group>,
    );
    expect(screen.getByTestId("ind")).toBeEmptyDOMElement();
  });

  it("mounts a void render element on Indicator without an error", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <Radio.Group defaultValue="a">
        <Radio.Root value="a" aria-label="A">
          <Radio.Indicator render={<img alt="" src="data:," data-testid="ind" />} />
        </Radio.Root>
      </Radio.Group>,
    );
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
    expect(screen.getByTestId("ind").tagName).toBe("IMG");
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

  // The item's dimmed, not-allowed look is measured in Radio.visual.spec
  it("marks a disabled Item and ignores clicks on it", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Radio.Group aria-label="Plan" onValueChange={onValueChange}>
        <Radio.Item value="a" disabled>
          Disabled
        </Radio.Item>
        <Radio.Item value="b">Enabled</Radio.Item>
      </Radio.Group>,
    );
    const disabled = screen.getByRole("radio", { name: "Disabled" });
    expect(disabled).toHaveAttribute("data-disabled");
    await user.click(screen.getByText("Disabled"));
    expect(disabled).toHaveAttribute("aria-checked", "false");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("radio", { name: "Enabled" })).not.toHaveAttribute("data-disabled");
    await user.click(screen.getByText("Enabled"));
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

/** Runs `count` animation frames, in which Motion writes its values */
const frames = (count: number) =>
  act(async () => {
    for (let i = 0; i < count; i++) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  });

/** Radios "A" and "B", "A" selected, with a ★ in each indicator */
function StarredGroup() {
  return (
    <Radio.Group defaultValue="a">
      <Radio.Root value="a" aria-label="A">
        <Radio.Indicator data-testid="ind-a">★</Radio.Indicator>
      </Radio.Root>
      <Radio.Root value="b" aria-label="B">
        <Radio.Indicator data-testid="ind-b">★</Radio.Indicator>
      </Radio.Root>
    </Radio.Group>
  );
}

describe.each([
  // Motion never arrives: the CSS fallback renders
  ["without Motion", () => void reloadMotion(new Promise(() => {}))],
  ["with Motion", () => reloadMotion()],
])("Radio.Indicator children %s", (_case, loadMotion) => {
  beforeAll(loadMotion);
  afterAll(() => reloadMotion());

  it("shows the children in place of the dot, with no error or warning", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<StarredGroup />);
    expect(screen.getByTestId("ind-a")).toHaveTextContent(/^★$/);
    await user.click(screen.getByRole("radio", { name: "B" }));
    await frames(10);

    expect(screen.getByTestId("ind-b")).toHaveTextContent(/^★$/);
    expect(screen.getByTestId("ind-b").children).toHaveLength(0);
    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();
    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });
});

describe("Radio.Indicator children with Motion", () => {
  beforeAll(() => reloadMotion());

  it("springs the children out and keeps them mounted, as it does the dot", async () => {
    const user = userEvent.setup();
    render(<StarredGroup />);
    const indicator = screen.getByTestId("ind-a");
    // Motion drives the indicator once it has written its resting values
    await waitFor(() => expect(indicator.style.opacity).toBe("1"));
    await user.click(screen.getByRole("radio", { name: "B" }));
    const opacities: number[] = [];
    for (let frame = 0; frame < 30; frame++) {
      await frames(1);
      opacities.push(Number(indicator.style.opacity));
    }
    // In-between values on the way out, not a jump to 0
    expect(opacities.some((opacity) => opacity > 0 && opacity < 1)).toBe(true);
    expect(opacities.at(-1)).toBeCloseTo(0, 1);
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveTextContent(/^★$/);
  });
});

describe("Radio focus ring", () => {
  it("draws the library focus ring on Root", () => {
    render(
      <Radio.Group>
        <Radio.Root value="a" />
      </Radio.Group>,
    );
    expect(screen.getByRole("radio")).toHaveClass(FOCUS_RING);
  });
});

import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FOCUS_RING } from "chunks-ui-core";
import { axe } from "jest-axe";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { reloadMotion } from "../../lib/use-motion";
import { Checkbox } from "./Checkbox";

afterEach(cleanup);

describe("Checkbox", () => {
  it("renders Root as a checkbox", () => {
    render(<Checkbox.Root />);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("merges custom className on Root", () => {
    render(<Checkbox.Root className="custom" />);
    expect(screen.getByRole("checkbox")).toHaveClass("custom");
  });

  it("renders Indicator inside Root", () => {
    render(
      <Checkbox.Root defaultChecked>
        <Checkbox.Indicator data-testid="ind" />
      </Checkbox.Root>,
    );
    expect(screen.getByTestId("ind")).toBeInTheDocument();
  });

  it("renders Indicator with custom className", () => {
    render(
      <Checkbox.Root defaultChecked>
        <Checkbox.Indicator data-testid="ind" className="custom" />
      </Checkbox.Root>,
    );
    expect(screen.getByTestId("ind")).toHaveClass("custom");
  });

  it.each([
    ["the check", false, "M4,12 L9,17 L20,6"],
    ["the minus when indeterminate", true, "M4,12 L12,12 L20,12"],
  ])("draws %s without children", (_case, indeterminate, d) => {
    render(
      <Checkbox.Root aria-label="Accept" defaultChecked indeterminate={indeterminate}>
        <Checkbox.Indicator data-testid="ind" />
      </Checkbox.Root>,
    );
    const glyph = screen.getByTestId("ind").querySelector("svg");
    expect(glyph).toHaveAttribute("aria-hidden", "true");
    expect(glyph?.querySelector("path")).toHaveAttribute("d", d);
  });

  it("renders no check in a void render element, without an error", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <Checkbox.Root aria-label="Accept" defaultChecked>
        <Checkbox.Indicator render={<img alt="" src="data:," data-testid="ind" />} />
      </Checkbox.Root>,
    );
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
    expect(screen.getByTestId("ind").tagName).toBe("IMG");
    expect(screen.getByTestId("ind")).toBeEmptyDOMElement();
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <Checkbox.Root aria-label="Accept terms">
        <Checkbox.Indicator />
      </Checkbox.Root>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Checkbox focus ring", () => {
  it("draws the library focus ring on Root", () => {
    render(<Checkbox.Root />);
    expect(screen.getByRole("checkbox")).toHaveClass(FOCUS_RING);
  });
});

/** Runs `count` animation frames, in which Motion writes its values */
const frames = (count: number) =>
  act(async () => {
    for (let i = 0; i < count; i++) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  });

// Motion springs the indicator's scale and opacity, and morphs the check's path into the minus.
// Children replace the path, so its animation runs on an element that never mounts.
describe.each([
  // Motion never arrives: the CSS fallback renders
  ["without Motion", () => void reloadMotion(new Promise(() => {}))],
  ["with Motion", () => reloadMotion()],
])("Checkbox.Indicator children %s", (_case, loadMotion) => {
  beforeAll(loadMotion);
  afterAll(() => reloadMotion());

  it("shows the children in place of the check and the minus, with no error or warning", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const user = userEvent.setup();
    const ui = (indeterminate: boolean) => (
      <Checkbox.Root aria-label="Starred" defaultChecked indeterminate={indeterminate}>
        <Checkbox.Indicator data-testid="ind">★</Checkbox.Indicator>
      </Checkbox.Root>
    );
    const { rerender } = render(ui(false));
    expect(screen.getByTestId("ind")).toHaveTextContent(/^★$/);
    rerender(ui(true));
    expect(screen.getByTestId("ind")).toHaveTextContent(/^★$/);
    rerender(ui(false));
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("checkbox"));
    // Motion's hand-off and spring run over these
    await frames(10);

    expect(screen.getByTestId("ind")).toHaveTextContent(/^★$/);
    expect(document.querySelector("svg")).toBeNull();
    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();
    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });
});

describe("Checkbox.Indicator children with Motion", () => {
  beforeAll(() => reloadMotion());

  it("springs the children out and keeps them mounted, as it does the check", async () => {
    const user = userEvent.setup();
    render(
      <Checkbox.Root aria-label="Starred" defaultChecked>
        <Checkbox.Indicator data-testid="ind">★</Checkbox.Indicator>
      </Checkbox.Root>,
    );
    const indicator = screen.getByTestId("ind");
    // Motion drives the indicator once it has written its resting values
    await waitFor(() => expect(indicator.style.opacity).toBe("1"));
    await user.click(screen.getByRole("checkbox"));
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

describe("Checkbox.Indicator default glyph with Motion", () => {
  beforeAll(() => reloadMotion());

  it("draws the minus, not a stale check, when children go away on an indeterminate box", async () => {
    const ui = (indeterminate: boolean, children?: string) => (
      <Checkbox.Root aria-label="Starred" defaultChecked indeterminate={indeterminate}>
        <Checkbox.Indicator data-testid="ind">{children}</Checkbox.Indicator>
      </Checkbox.Root>
    );
    const { rerender } = render(ui(false, "★"));
    await frames(10);
    rerender(ui(true, "★"));
    await frames(10);
    rerender(ui(true));
    await frames(10);

    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "mixed");
    expect(document.querySelector("path")).toHaveAttribute("d", "M4,12 L12,12 L20,12");
  });
});

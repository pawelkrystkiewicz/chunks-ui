import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeAll, describe, expect, expectTypeOf, it, vi } from "vitest";
import { CopyButton, type CopyButtonLabels, DEFAULT_COPY_BUTTON_LABELS } from "./CopyButton";

beforeAll(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
    configurable: true,
  });
});

afterEach(cleanup);

describe("CopyButton", () => {
  it("renders a button", () => {
    render(<CopyButton value="test" aria-label="Copy" />);
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  it("shows copied state after click", async () => {
    const user = userEvent.setup();
    render(<CopyButton value="test" />);
    expect(screen.getByRole("button", { name: "Copy to clipboard" })).toBeInTheDocument();
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
  });

  it("renders custom children with copied state", async () => {
    const user = userEvent.setup();
    render(
      <CopyButton value="test">
        {({ copied }) => <span>{copied ? "Done" : "Copy"}</span>}
      </CopyButton>,
    );
    expect(screen.getByText("Copy")).toBeInTheDocument();
    await user.click(screen.getByRole("button"));
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("has type=button", () => {
    render(<CopyButton value="test" />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("merges custom className", () => {
    render(<CopyButton value="test" className="custom" />);
    expect(screen.getByRole("button")).toHaveClass("custom");
  });

  it("calls onClick handler", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<CopyButton value="test" onClick={onClick} />);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("still calls onClick when the Clipboard API is missing (insecure context)", async () => {
    const clipboard = navigator.clipboard;
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    try {
      // fireEvent, not userEvent: `userEvent.setup()` installs its own clipboard stub
      const onClick = vi.fn();
      render(<CopyButton value="test" onClick={onClick} />);
      fireEvent.click(screen.getByRole("button"));
      expect(onClick).toHaveBeenCalledOnce();
      expect(screen.getByRole("button", { name: "Copy to clipboard" })).toBeInTheDocument();
    } finally {
      Object.defineProperty(navigator, "clipboard", { value: clipboard, configurable: true });
    }
  });

  it("has no a11y violations", async () => {
    const { container } = render(<CopyButton value="test" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("CopyButton labels", () => {
  it("types DEFAULT_COPY_BUTTON_LABELS as read-only", () => {
    expectTypeOf(DEFAULT_COPY_BUTTON_LABELS).toEqualTypeOf<Readonly<CopyButtonLabels>>();
  });

  it("is named by DEFAULT_COPY_BUTTON_LABELS before and after a copy", async () => {
    const user = userEvent.setup();
    render(<CopyButton value="test" />);
    await user.click(screen.getByRole("button", { name: DEFAULT_COPY_BUTTON_LABELS.copy }));
    expect(
      screen.getByRole("button", { name: DEFAULT_COPY_BUTTON_LABELS.copied }),
    ).toBeInTheDocument();
  });

  it("takes both names from labels", async () => {
    const user = userEvent.setup();
    render(<CopyButton value="test" labels={{ copy: "Kopiuj", copied: "Skopiowano" }} />);
    await user.click(screen.getByRole("button", { name: "Kopiuj" }));
    expect(screen.getByRole("button", { name: "Skopiowano" })).toBeInTheDocument();
  });

  it("keeps the default for a key labels leaves out", async () => {
    const user = userEvent.setup();
    render(<CopyButton value="test" labels={{ copied: "Skopiowano" }} />);
    await user.click(screen.getByRole("button", { name: "Copy to clipboard" }));
    expect(screen.getByRole("button", { name: "Skopiowano" })).toBeInTheDocument();
  });

  it("prefers aria-label over labels", async () => {
    const user = userEvent.setup();
    render(<CopyButton value="test" aria-label="Copy link" labels={{ copy: "Kopiuj" }} />);
    await user.click(screen.getByRole("button", { name: "Copy link" }));
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
  });
});

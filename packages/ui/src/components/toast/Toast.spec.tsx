import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
import { createToastManager, Toast } from "./Toast";

afterEach(cleanup);

function ToastHarness() {
  const toast = Toast.useToast();
  return (
    <button
      type="button"
      onClick={() => toast.add({ title: "Saved", description: "Changes have been saved." })}
    >
      Show toast
    </button>
  );
}

function WrappedToastHarness() {
  return (
    <Toast.Provider>
      <ToastHarness />
      <Toast.Viewport data-testid="viewport" />
    </Toast.Provider>
  );
}

function TypedToastHarness({
  type,
  title = "Notification",
  description,
}: {
  type: string;
  title?: string;
  description?: string;
}) {
  const toast = Toast.useToast();
  return (
    <button type="button" onClick={() => toast.add({ type, title, description })}>
      Show {type} toast
    </button>
  );
}

describe("Toast", () => {
  it("renders Provider and Viewport without error", () => {
    render(
      <Toast.Provider>
        <Toast.Viewport data-testid="viewport" />
      </Toast.Provider>,
    );
    expect(screen.getByTestId("viewport")).toBeInTheDocument();
  });

  it("merges className on Viewport", () => {
    render(
      <Toast.Provider>
        <Toast.Viewport className="custom" data-testid="viewport" />
      </Toast.Provider>,
    );
    expect(screen.getByTestId("viewport")).toHaveClass("custom");
  });

  it("Viewport has aria-live region for accessibility", () => {
    render(
      <Toast.Provider>
        <Toast.Viewport data-testid="viewport" />
      </Toast.Provider>,
    );
    const viewport = screen.getByTestId("viewport");
    expect(viewport).toHaveAttribute("aria-live");
    expect(viewport).toHaveAttribute("role", "region");
  });

  it("shows a toast after calling toast.add", async () => {
    const user = userEvent.setup();
    render(<WrappedToastHarness />);
    await user.click(screen.getByRole("button", { name: "Show toast" }));
    expect(await screen.findByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("Changes have been saved.")).toBeInTheDocument();
  });

  it("renders an icon and data-type for a success toast", async () => {
    const user = userEvent.setup();
    render(
      <Toast.Provider>
        <TypedToastHarness type="success" title="Done" description="All good." />
        <Toast.Viewport data-testid="viewport" />
      </Toast.Provider>,
    );
    await user.click(screen.getByRole("button", { name: "Show success toast" }));
    await screen.findByText("Done");
    const icon = screen.getByTestId("toast-icon");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("text-success");
    expect(screen.getByTestId("viewport").querySelector("[data-type='success']")).not.toBeNull();
  });

  it("renders an icon and data-type for an error toast", async () => {
    const user = userEvent.setup();
    render(
      <Toast.Provider>
        <TypedToastHarness type="error" title="Oops" description="Something failed." />
        <Toast.Viewport data-testid="viewport" />
      </Toast.Provider>,
    );
    await user.click(screen.getByRole("button", { name: "Show error toast" }));
    await screen.findByText("Oops");
    expect(screen.getByTestId("toast-icon")).toHaveClass("text-destructive");
    expect(screen.getByTestId("viewport").querySelector("[data-type='error']")).not.toBeNull();
  });

  it("renders an icon and data-type for a warning toast", async () => {
    const user = userEvent.setup();
    render(
      <Toast.Provider>
        <TypedToastHarness type="warning" title="Careful" description="Check inputs." />
        <Toast.Viewport data-testid="viewport" />
      </Toast.Provider>,
    );
    await user.click(screen.getByRole("button", { name: "Show warning toast" }));
    await screen.findByText("Careful");
    expect(screen.getByTestId("toast-icon")).toHaveClass("text-warning");
    expect(screen.getByTestId("viewport").querySelector("[data-type='warning']")).not.toBeNull();
  });

  it("renders an icon and data-type for an info toast", async () => {
    const user = userEvent.setup();
    render(
      <Toast.Provider>
        <TypedToastHarness type="info" title="Heads up" description="FYI." />
        <Toast.Viewport data-testid="viewport" />
      </Toast.Provider>,
    );
    await user.click(screen.getByRole("button", { name: "Show info toast" }));
    await screen.findByText("Heads up");
    expect(screen.getByTestId("toast-icon")).toHaveClass("text-primary");
    expect(screen.getByTestId("viewport").querySelector("[data-type='info']")).not.toBeNull();
  });

  it("falls back to muted style for unknown toast types", async () => {
    const user = userEvent.setup();
    render(
      <Toast.Provider>
        <TypedToastHarness type="totally-custom" title="Custom" />
        <Toast.Viewport data-testid="viewport" />
      </Toast.Provider>,
    );
    await user.click(screen.getByRole("button", { name: "Show totally-custom toast" }));
    await screen.findByText("Custom");
    expect(screen.getByTestId("toast-icon")).toHaveClass("text-muted-foreground");
  });

  it("renders a title-only toast without an empty description node", async () => {
    const user = userEvent.setup();
    render(
      <Toast.Provider>
        <TypedToastHarness type="success" title="Only title" />
        <Toast.Viewport data-testid="viewport" />
      </Toast.Provider>,
    );
    await user.click(screen.getByRole("button", { name: "Show success toast" }));
    await screen.findByText("Only title");
    // Base UI renders Description as a <p>; confirm none exist inside the viewport.
    expect(screen.getByTestId("viewport").querySelector("p")).toBeNull();
  });

  it("renders a description-only toast without an empty title node", async () => {
    const user = userEvent.setup();

    function DescOnlyHarness() {
      const toast = Toast.useToast();
      return (
        <button
          type="button"
          onClick={() => toast.add({ type: "info", description: "Only description" })}
        >
          Show desc
        </button>
      );
    }

    render(
      <Toast.Provider>
        <DescOnlyHarness />
        <Toast.Viewport data-testid="viewport" />
      </Toast.Provider>,
    );
    await user.click(screen.getByRole("button", { name: "Show desc" }));
    await screen.findByText("Only description");
    // Base UI renders Title as an <h2>; confirm none exist inside the viewport.
    expect(screen.getByTestId("viewport").querySelector("h2")).toBeNull();
  });

  it("exposes createToastManager as a top-level named export", () => {
    expect(typeof createToastManager).toBe("function");
    const manager = createToastManager();
    expect(typeof manager.add).toBe("function");
    expect(typeof manager.close).toBe("function");
    expect(typeof manager.update).toBe("function");
    expect(typeof manager.promise).toBe("function");
  });

  it("still exposes createToastManager on the compound (compat)", () => {
    expect(typeof Toast.createToastManager).toBe("function");
  });

  it("has no a11y violations with provider and viewport", async () => {
    const { container } = render(
      <Toast.Provider>
        <Toast.Viewport />
      </Toast.Provider>,
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

  it("has no a11y violations with a visible toast", async () => {
    const user = userEvent.setup();
    const { container } = render(<WrappedToastHarness />);
    await user.click(screen.getByRole("button", { name: "Show toast" }));
    await screen.findByText("Saved");
    expect(
      await axe(container, {
        rules: {
          "aria-command-name": { enabled: false },
        },
      }),
    ).toHaveNoViolations();
  });
});

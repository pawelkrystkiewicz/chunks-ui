import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FOCUS_RING } from "../shared";
import { createToastManager, Toast, type ToastCloseProps } from "./Toast";
import { DEFAULT_TOAST_LABELS } from "./Toast.Labels";

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

  it("sets data-type on the root for a success toast", async () => {
    const user = userEvent.setup();
    render(
      <Toast.Provider>
        <TypedToastHarness type="success" title="Done" description="All good." />
        <Toast.Viewport data-testid="viewport" />
      </Toast.Provider>,
    );
    await user.click(screen.getByRole("button", { name: "Show success toast" }));
    await screen.findByText("Done");
    expect(screen.getByTestId("viewport").querySelector("[data-type='success']")).not.toBeNull();
  });

  it("sets data-type on the root for a destructive toast", async () => {
    const user = userEvent.setup();
    render(
      <Toast.Provider>
        <TypedToastHarness type="destructive" title="Oops" description="Something failed." />
        <Toast.Viewport data-testid="viewport" />
      </Toast.Provider>,
    );
    await user.click(screen.getByRole("button", { name: "Show destructive toast" }));
    await screen.findByText("Oops");
    expect(
      screen.getByTestId("viewport").querySelector("[data-type='destructive']"),
    ).not.toBeNull();
  });

  it("sets data-type on the root for a warning toast", async () => {
    const user = userEvent.setup();
    render(
      <Toast.Provider>
        <TypedToastHarness type="warning" title="Careful" description="Check inputs." />
        <Toast.Viewport data-testid="viewport" />
      </Toast.Provider>,
    );
    await user.click(screen.getByRole("button", { name: "Show warning toast" }));
    await screen.findByText("Careful");
    expect(screen.getByTestId("viewport").querySelector("[data-type='warning']")).not.toBeNull();
  });

  it("sets data-type on the root for an info toast", async () => {
    const user = userEvent.setup();
    render(
      <Toast.Provider>
        <TypedToastHarness type="info" title="Heads up" description="FYI." />
        <Toast.Viewport data-testid="viewport" />
      </Toast.Provider>,
    );
    await user.click(screen.getByRole("button", { name: "Show info toast" }));
    await screen.findByText("Heads up");
    expect(screen.getByTestId("viewport").querySelector("[data-type='info']")).not.toBeNull();
  });

  it("renders a caller-provided icon component in the leading slot", async () => {
    const user = userEvent.setup();

    function IconHarness() {
      const toast = Toast.useToast();
      return (
        <button
          type="button"
          onClick={() =>
            toast.add({
              title: "With icon",
              icon: ({ className }) => (
                <span data-testid="caller-icon" className={className}>
                  ★
                </span>
              ),
            })
          }
        >
          Show icon toast
        </button>
      );
    }

    render(
      <Toast.Provider>
        <IconHarness />
        <Toast.Viewport data-testid="viewport" />
      </Toast.Provider>,
    );
    await user.click(screen.getByRole("button", { name: "Show icon toast" }));
    await screen.findByText("With icon");
    const icon = screen.getByTestId("caller-icon");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveTextContent("★");
    // Library passes default sizing via className
    expect(icon).toHaveClass("size-5");
    expect(icon).toHaveClass("shrink-0");
    expect(icon).toHaveClass("self-start");
  });

  it("merges iconClassName onto the icon's className", async () => {
    const user = userEvent.setup();

    function IconClassHarness() {
      const toast = Toast.useToast();
      return (
        <button
          type="button"
          onClick={() =>
            toast.add({
              title: "Colored icon",
              icon: ({ className }) => <span data-testid="colored-icon" className={className} />,
              iconClassName: "text-success",
            })
          }
        >
          Show colored
        </button>
      );
    }

    render(
      <Toast.Provider>
        <IconClassHarness />
        <Toast.Viewport data-testid="viewport" />
      </Toast.Provider>,
    );
    await user.click(screen.getByRole("button", { name: "Show colored" }));
    await screen.findByText("Colored icon");
    const icon = screen.getByTestId("colored-icon");
    expect(icon).toHaveClass("size-5");
    expect(icon).toHaveClass("text-success");
  });

  it("merges className onto Toast.Root", async () => {
    const user = userEvent.setup();

    function RootClassHarness() {
      const toast = Toast.useToast();
      return (
        <button
          type="button"
          onClick={() =>
            toast.add({
              title: "With accent",
              className: "border-l-4 border-success",
            })
          }
        >
          Show accented
        </button>
      );
    }

    render(
      <Toast.Provider>
        <RootClassHarness />
        <Toast.Viewport data-testid="viewport" />
      </Toast.Provider>,
    );
    await user.click(screen.getByRole("button", { name: "Show accented" }));
    const title = await screen.findByText("With accent");
    // Title is nested inside the leading-slot div inside Toast.Root — climb two levels.
    const root = title.closest("[class*='rounded-']");
    expect(root).not.toBeNull();
    expect(root).toHaveClass("border-l-4");
    expect(root).toHaveClass("border-success");
  });

  it("renders no leading-slot content when the caller omits the icon prop", async () => {
    const user = userEvent.setup();
    render(
      <Toast.Provider>
        <TypedToastHarness type="success" title="No icon" />
        <Toast.Viewport data-testid="viewport" />
      </Toast.Provider>,
    );
    await user.click(screen.getByRole("button", { name: "Show success toast" }));
    await screen.findByText("No icon");
    expect(screen.queryByTestId("caller-icon")).toBeNull();
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
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no a11y violations with a visible toast", async () => {
    const user = userEvent.setup();
    const { container } = render(<WrappedToastHarness />);
    await user.click(screen.getByRole("button", { name: "Show toast" }));
    await screen.findByText("Saved");
    // The viewport renders in place, not in a portal, so the container audit sees the toast
    expect(container).toContainElement(screen.getByText("Saved"));
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no a11y violations once F6 has moved focus into the viewport", async () => {
    const user = userEvent.setup();
    const { container } = render(<WrappedToastHarness />);
    await user.click(screen.getByRole("button", { name: "Show toast" }));
    await screen.findByText("Saved");
    await user.keyboard("{F6}");
    expect(screen.getByTestId("viewport")).toHaveFocus();
    // Base UI renders the viewport's focus guards (aria-hidden, tabindex 0) only after F6
    const guards = container.querySelectorAll("[data-base-ui-focus-guard]");
    expect(guards.length).toBeGreaterThan(0);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    // The toast's role="dialog" counts as an open modal for axe, so aria-hidden-focus leaves
    // focusable aria-hidden nodes in `incomplete`. Only the guards may be there
    const undecided = results.incomplete
      .filter((rule) => rule.id === "aria-hidden-focus")
      .flatMap((rule) => rule.nodes);
    expect(undecided).toHaveLength(guards.length);
    for (const node of undecided) expect(node.html).toContain("data-base-ui-focus-guard");
  });
});

describe("Toast labels", () => {
  function DismissibleHarness() {
    const toast = Toast.useToast();
    return (
      <button type="button" onClick={() => toast.add({ title: "Saved", dismissible: true })}>
        Show toast
      </button>
    );
  }

  it("uses DEFAULT_TOAST_LABELS", async () => {
    const user = userEvent.setup();
    render(
      <Toast.Provider>
        <DismissibleHarness />
        <Toast.Viewport />
      </Toast.Provider>,
    );
    expect(screen.getByRole("region", { name: DEFAULT_TOAST_LABELS.viewport })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show toast" }));
    // Base UI aria-hides the close button until the toast is focused or hovered, which empties
    // its computed name, so find it by its label
    expect(
      await screen.findByLabelText(DEFAULT_TOAST_LABELS.close, { selector: "button" }),
    ).toBeInTheDocument();
  });

  it("draws the default close icon inline, hidden from assistive tech", async () => {
    const user = userEvent.setup();
    render(
      <Toast.Provider>
        <DismissibleHarness />
        <Toast.Viewport />
      </Toast.Provider>,
    );
    await user.click(screen.getByRole("button", { name: "Show toast" }));
    const close = await screen.findByLabelText(DEFAULT_TOAST_LABELS.close, { selector: "button" });
    const icon = close.querySelector("svg");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    const shapes = [...(icon?.querySelectorAll("path") ?? [])].map((path) =>
      path.getAttribute("d"),
    );
    expect(shapes).toEqual(["M18 6 6 18", "m6 6 12 12"]);
  });

  it("takes every string from labels on Viewport", async () => {
    const user = userEvent.setup();
    render(
      <Toast.Provider>
        <DismissibleHarness />
        <Toast.Viewport labels={{ viewport: "Powiadomienia", close: "Zamknij" }} />
      </Toast.Provider>,
    );
    expect(screen.getByRole("region", { name: "Powiadomienia" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show toast" }));
    expect(await screen.findByLabelText("Zamknij", { selector: "button" })).toBeInTheDocument();
  });

  it("prefers aria-label on Viewport over labels", () => {
    render(
      <Toast.Provider>
        <Toast.Viewport aria-label="Alerts" labels={{ viewport: "Powiadomienia" }} />
      </Toast.Provider>,
    );
    expect(screen.getByRole("region", { name: "Alerts" })).toBeInTheDocument();
  });
});

describe("Toast focus ring", () => {
  /** Shows a dismissible toast with an "Undo" action, `action` in the action's className */
  async function showToast(action?: string) {
    const manager = createToastManager();
    render(
      <Toast.Provider toastManager={manager}>
        <Toast.Viewport />
      </Toast.Provider>,
    );
    act(() => {
      manager.add({
        title: "Saved",
        dismissible: true,
        actionProps: { children: "Undo", className: action },
      });
    });
    await screen.findByText("Saved");
  }

  it("draws the library focus ring on Close", async () => {
    await showToast();
    // Base UI aria-hides the close button until the toast is focused or hovered, so by its label
    const close = screen.getByLabelText(DEFAULT_TOAST_LABELS.close, { selector: "button" });
    expect(close).toHaveClass(...FOCUS_RING.split(" "));
  });

  // Both offsets are in one tailwind-merge group under the same variant: the consumer's wins
  it("keeps a flush ring on Action with focus-visible:outline-offset-0 in className", async () => {
    await showToast("focus-visible:outline-offset-0");
    const action = screen.getByRole("button", { name: "Undo" });
    expect(action).toHaveClass(
      "focus-visible:outline-offset-0",
      "focus-visible:outline-2",
      "focus-visible:outline-ring",
    );
    expect(action).not.toHaveClass("focus-visible:outline-offset-2");
  });
});

type AddOptions = Parameters<ReturnType<typeof createToastManager>["add"]>[0];

describe("Toast closeProps", () => {
  /** Renders a viewport labelled "Zamknij" and adds a toast titled "Saved" with the given options */
  async function addToast(options: AddOptions) {
    const manager = createToastManager();
    render(
      <Toast.Provider toastManager={manager}>
        <Toast.Viewport labels={{ close: "Zamknij" }} />
      </Toast.Provider>,
    );
    let id = "";
    act(() => {
      id = manager.add({ title: "Saved", ...options });
    });
    await screen.findByText("Saved");
    return { manager, id };
  }

  /** Shows a dismissible toast titled "Saved" with `closeProps` on its built-in close button */
  async function showToast(closeProps: ToastCloseProps, onClose?: () => void) {
    await addToast({ dismissible: true, closeProps, onClose });
    // Base UI aria-hides the close button until the toast is focused or hovered, so by its label
    return screen.getByLabelText(closeProps["aria-label"] ?? "Zamknij", { selector: "button" });
  }

  // Both offsets are in one tailwind-merge group under the same variant: the consumer's wins
  it("merges closeProps.className after the library classes", async () => {
    const close = await showToast({ className: "focus-visible:outline-offset-0" });
    expect(close).toHaveClass(
      "focus-visible:outline-offset-0",
      "focus-visible:outline-2",
      "focus-visible:outline-ring",
    );
    expect(close).not.toHaveClass("focus-visible:outline-offset-2");
  });

  it("prefers closeProps aria-label over labels.close", async () => {
    await showToast({ "aria-label": "Dismiss" });
    expect(screen.getByLabelText("Dismiss", { selector: "button" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Zamknij", { selector: "button" })).toBeNull();
  });

  it("falls back to labels.close when closeProps sets aria-label to undefined", async () => {
    await showToast({ "aria-label": undefined });
    expect(screen.getByLabelText("Zamknij", { selector: "button" })).toBeInTheDocument();
  });

  it("renders no close button for closeProps alone", async () => {
    await addToast({ closeProps: { className: "x" } });
    expect(screen.queryByLabelText("Zamknij", { selector: "button" })).toBeNull();
  });

  it("renders the close button for onClose alone", async () => {
    await addToast({ onClose: vi.fn() });
    expect(screen.getByLabelText("Zamknij", { selector: "button" })).toBeInTheDocument();
  });

  it("renders no close button for dismissible: false, even with onClose", async () => {
    await addToast({ dismissible: false, onClose: vi.fn() });
    expect(screen.queryByLabelText("Zamknij", { selector: "button" })).toBeNull();
  });

  it("runs closeProps.onClick and onClose once each, with no argument, and closes the toast", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onClose = vi.fn();
    const close = await showToast({ onClick }, onClose);
    await user.click(close);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith();
    expect(screen.queryByText("Saved")).toBeNull();
  });

  it("keeps the toast open when closeProps.onClick calls preventBaseUIHandler", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const close = await showToast({ onClick: (event) => event.preventBaseUIHandler() }, onClose);
    await user.click(close);
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose once when manager.close closes the toast", async () => {
    const onClose = vi.fn();
    const { manager, id } = await addToast({ onClose });
    act(() => {
      manager.close(id);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

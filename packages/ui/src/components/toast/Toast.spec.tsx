import { Toast as BaseToast } from "@base-ui/react/toast";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { type ComponentPropsWithoutRef, createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectOnlyFocusGuardsUndecided, undecided } from "../../AxeTest.utils";
import { FOCUS_RING } from "../shared";
import {
  createToastManager,
  Toast,
  type ToastActionProps,
  type ToastCloseProps,
  type ToastRootProps,
  type ToastViewportProps,
} from "./Toast";
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

type AddOptions = Parameters<ReturnType<typeof createToastManager>["add"]>[0];

/** Renders a viewport with `viewportProps` and adds a toast titled "Saved" with `options` */
async function addToast(options: AddOptions, viewportProps?: ToastViewportProps) {
  const manager = createToastManager();
  const { container } = render(
    <Toast.Provider toastManager={manager}>
      <Toast.Viewport {...viewportProps} />
    </Toast.Provider>,
  );
  let id = "";
  act(() => {
    id = manager.add({ title: "Saved", ...options });
  });
  // By the heading: Base UI repeats a high-priority toast's title in a visually hidden alert
  await screen.findByText("Saved", { selector: "h2" });
  return { container, manager, id };
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
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    // The toast's role="dialog" counts as an open modal for axe, so aria-hidden-focus leaves
    // focusable aria-hidden nodes in `incomplete`
    expectOnlyFocusGuardsUndecided(results);
  });

  it("has no a11y violations once F6 has moved focus into the viewport", async () => {
    const user = userEvent.setup();
    const manager = createToastManager();
    const { container } = render(
      <Toast.Provider toastManager={manager}>
        <Toast.Viewport data-testid="viewport" />
      </Toast.Provider>,
    );
    act(() => {
      manager.add({
        title: "Saved",
        description: "Changes have been saved.",
        dismissible: true,
        actionProps: { children: "Undo" },
      });
    });
    await screen.findByText("Saved");
    await user.keyboard("{F6}");
    expect(screen.getByTestId("viewport")).toHaveFocus();
    // Base UI aria-hides the close button until the viewport expands, which F6 does, and renders
    // the focus guards only after F6. So this is the one state in which axe can audit them: check
    // that the audit reaches the close button, the action and the guards
    const close = screen.getByLabelText(DEFAULT_TOAST_LABELS.close, { selector: "button" });
    expect(close).not.toHaveAttribute("aria-hidden", "true");
    expect(container).toContainElement(close);
    expect(container).toContainElement(screen.getByRole("button", { name: "Undo" }));
    const guards = container.querySelectorAll("[data-base-ui-focus-guard]");
    expect(guards.length).toBeGreaterThan(0);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    // The toast's role="dialog" counts as an open modal for axe, so aria-hidden-focus leaves
    // focusable aria-hidden nodes in `incomplete`. Only the guards may be there, all of them
    expectOnlyFocusGuardsUndecided(results);
    expect(undecided(results, "aria-hidden-focus")).toHaveLength(guards.length);
  });

  // See the ponytail comment in Toast.tsx (#685). Alone on purpose: next to a toast of the default
  // `low` priority (a role="dialog", which axe takes for an open modal) a stray tab stop lands in
  // `incomplete`
  it("keeps a lone high-priority toast and its buttons out of the tab order while aria-hidden", async () => {
    const user = userEvent.setup();
    const { container } = await addToast({
      priority: "high",
      dismissible: true,
      actionProps: { children: "Retry now" },
    });
    // aria-hidden, so only a query with `hidden` finds it
    const toast = screen.getByRole("alertdialog", { hidden: true });
    const action = screen.getByRole("button", { name: "Retry now", hidden: true });
    const close = screen.getByLabelText(DEFAULT_TOAST_LABELS.close, { selector: "button" });
    expect(toast).toHaveAttribute("aria-hidden", "true");
    expect([toast, action, close].map((el) => el.tabIndex)).toEqual([-1, -1, -1]);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    expect(undecided(results, "aria-hidden-focus")).toEqual([]);

    // F6 moves focus into the viewport: Base UI shows the toast, and its tab stops come back
    await user.keyboard("{F6}");
    expect(toast).not.toHaveAttribute("aria-hidden");
    expect([toast, action, close].map((el) => el.tabIndex)).toEqual([0, 0, 0]);
  });

  // See the ponytail comment in Toast.tsx (#685). Only the close button is aria-hidden: the toast
  // of the default `low` priority and its action keep their tab stops
  it("keeps only the close button of a default-priority toast out of the tab order while collapsed", async () => {
    const user = userEvent.setup();
    await addToast({ dismissible: true, actionProps: { children: "Undo" } });
    const toast = screen.getByRole("dialog");
    const action = screen.getByRole("button", { name: "Undo" });
    const close = screen.getByLabelText(DEFAULT_TOAST_LABELS.close, { selector: "button" });
    expect(close).toHaveAttribute("aria-hidden", "true");
    expect([toast, action, close].map((el) => el.tabIndex)).toEqual([0, 0, -1]);

    // The pointer over the viewport expands the toasts: Base UI shows the close button again
    await user.hover(screen.getByRole("region", { name: DEFAULT_TOAST_LABELS.viewport }));
    expect(close).not.toHaveAttribute("aria-hidden", "true");
    expect([toast, action, close].map((el) => el.tabIndex)).toEqual([0, 0, 0]);
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
    await addToast({ dismissible: true, actionProps: { children: "Undo", className: action } });
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

describe("Toast actionProps", () => {
  /** Shows a toast with an "Undo" action that takes `actionProps`, and returns the action */
  async function showToast(actionProps: ComponentPropsWithoutRef<"button">) {
    await addToast({ actionProps: { children: "Undo", ...actionProps } });
    return screen.getByRole("button", { name: "Undo" });
  }

  // Base UI's Toast.Action merges the toast's actionProps itself: handing them to it as props too
  // ran every handler twice, so an "Undo" undid twice (0.2.0 shipped this)
  it("runs onClick once per click", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    await user.click(await showToast({ onClick }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("keeps the label and the other props on the button", async () => {
    const action = await showToast({ title: "Put it back", className: "custom" });
    expect(action).toHaveAttribute("title", "Put it back");
    expect(action).toHaveClass("custom");
  });

  it("does not run onClick of a disabled action", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const action = await showToast({ disabled: true, onClick });
    expect(action).toBeDisabled();
    await user.click(action);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("Toast closeProps", () => {
  // A close label that is not the default, so a test can tell where the button's name came from
  const viewport = { labels: { close: "Zamknij" } };

  /** Shows a dismissible toast titled "Saved" with `closeProps` on its built-in close button */
  async function showToast(closeProps: ToastCloseProps, onClose?: () => void) {
    await addToast({ dismissible: true, closeProps, onClose }, viewport);
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

  it("renders closeProps children in place of the X, under the same name", async () => {
    const close = await showToast({ children: <svg data-testid="custom" aria-hidden="true" /> });
    expect(close.children).toHaveLength(1);
    expect(close.firstElementChild).toBe(screen.getByTestId("custom"));
  });

  it("renders no X in a void closeProps render element, without an error", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    await addToast(
      {
        dismissible: true,
        closeProps: { nativeButton: false, render: <img alt="" src="data:," /> },
      },
      viewport,
    );
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
    expect(screen.getByLabelText("Zamknij", { selector: "img" })).toBeEmptyDOMElement();
  });

  it("renders no close button for closeProps alone", async () => {
    await addToast({ closeProps: { className: "x" } }, viewport);
    expect(screen.queryByLabelText("Zamknij", { selector: "button" })).toBeNull();
  });

  it("renders the close button for onClose alone", async () => {
    await addToast({ onClose: vi.fn() }, viewport);
    expect(screen.getByLabelText("Zamknij", { selector: "button" })).toBeInTheDocument();
  });

  it("renders no close button for dismissible: false, even with onClose", async () => {
    await addToast({ dismissible: false, onClose: vi.fn() }, viewport);
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
    const { manager, id } = await addToast({ onClose }, viewport);
    act(() => {
      manager.close(id);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // The close button leaves the tab order with a high-priority toast that Base UI aria-hides, a
  // `render` element included, and a `tabIndex` in closeProps goes with it. A `tabIndex` on the
  // `render` element stays (the docs: Compound parts). The row without a tabIndex is there because
  // Base UI gives a non-native button `tabIndex: 0`, so the "0" row alone would pass without the -1
  it.each<{ kind: string; closeProps: ToastCloseProps; selector: string; expected: string }>([
    {
      kind: "a tabIndex in closeProps",
      closeProps: { tabIndex: 0 },
      selector: "button",
      expected: "-1",
    },
    {
      kind: "a render element without a tabIndex",
      closeProps: { nativeButton: false, render: <span /> },
      selector: "span",
      expected: "-1",
    },
    {
      kind: "a tabIndex on its render element",
      closeProps: { render: <button type="button" tabIndex={0} /> },
      selector: "button",
      expected: "0",
    },
  ])(
    "puts tabindex $expected on the close button of a hidden high-priority toast with $kind",
    async ({ closeProps, selector, expected }) => {
      await addToast({ priority: "high", dismissible: true, closeProps }, viewport);
      expect(screen.getByLabelText("Zamknij", { selector })).toHaveAttribute("tabindex", expected);
    },
  );
});

// Toast.Root renders its element in a render function of its own, to read Base UI's aria-hidden
// (#685). A `render` you pass still replaces the element, with Base UI's props, state and ref.
describe("Toast.Root render", () => {
  /** Shows a high-priority toast on a root with the given `render` prop and props, and returns it */
  async function showRoot(renderProp?: ToastRootProps["render"], rootProps?: { tabIndex: number }) {
    const manager = createToastManager();
    render(
      <Toast.Provider toastManager={manager}>
        <BaseToast.Viewport>
          <Roots render={renderProp} {...rootProps} />
        </BaseToast.Viewport>
      </Toast.Provider>,
    );
    act(() => {
      manager.add({ title: "Connection lost", priority: "high", type: "error" });
    });
    // aria-hidden, so only a query with `hidden` finds it
    return screen.findByRole("alertdialog", { hidden: true });
  }

  it("renders a div without a render prop", async () => {
    const toast = await showRoot();
    expect(toast.tagName).toBe("DIV");
    expect(toast).toHaveClass("Toast");
  });

  it.each<{ kind: string; renderProp: ToastRootProps["render"]; marker: string }>([
    // Keeps its own props
    { kind: "an element", renderProp: <section data-marker="element" />, marker: "element" },
    // Gets the root's state too: `type` is set on the toast, so it is there only if the state is
    {
      kind: "a function",
      renderProp: (props, state) => <section {...props} data-marker={state.type} />,
      marker: "error",
    },
  ])("renders the root through $kind", async ({ renderProp, marker }) => {
    const user = userEvent.setup();
    const toast = await showRoot(renderProp);
    expect(toast.tagName).toBe("SECTION");
    expect(toast).toHaveClass("Toast");
    expect(toast).toHaveAttribute("data-marker", marker);
    expect(toast).toHaveAttribute("tabindex", "-1");
    // Escape closes the toast only when Base UI's ref finds focus inside it
    toast.focus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog", { hidden: true })).toBeNull();
  });

  // A `tabIndex` you pass goes with the -1 of a hidden toast. One on the `render` element stays
  // (the docs: Compound parts)
  it.each<{
    kind: string;
    renderProp?: ToastRootProps["render"];
    rootProps?: { tabIndex: number };
    expected: string;
  }>([
    { kind: "a tabIndex prop", rootProps: { tabIndex: 0 }, expected: "-1" },
    {
      kind: "a tabIndex on its render element",
      // biome-ignore lint/a11y/noNoninteractiveTabindex: the tabIndex of the element is the case
      renderProp: <section tabIndex={0} />,
      expected: "0",
    },
  ])(
    "puts tabindex $expected on a hidden root with $kind",
    async ({ renderProp, rootProps, expected }) => {
      expect(await showRoot(renderProp, rootProps)).toHaveAttribute("tabindex", expected);
    },
  );

  function Roots({
    render: renderProp,
    ...rootProps
  }: {
    render: ToastRootProps["render"];
    tabIndex?: number;
  }) {
    return (
      <>
        {Toast.useToast().toasts.map((toast) => (
          <Toast.Root key={toast.id} toast={toast} render={renderProp} {...rootProps} />
        ))}
      </>
    );
  }
});

describe("Toast.Action render", () => {
  type Options = ToastActionProps & {
    priority?: "high";
    /** The `actionProps` of the toast, which Base UI's action merges over the props it gets */
    toastActionProps?: { tabIndex?: number };
  };

  /** Shows a toast on a custom root whose action takes the options, and returns once it is up */
  async function showAction({ priority, toastActionProps = {}, ...actionProps }: Options = {}) {
    const manager = createToastManager();
    function Actions() {
      return Toast.useToast().toasts.map((toast) => (
        <Toast.Root key={toast.id} toast={toast}>
          <Toast.Action className="mine" data-testid="action" {...actionProps}>
            {actionProps.render ? undefined : "Undo"}
          </Toast.Action>
        </Toast.Root>
      ));
    }
    render(
      <Toast.Provider toastManager={manager}>
        <BaseToast.Viewport>
          <Actions />
        </BaseToast.Viewport>
      </Toast.Provider>,
    );
    act(() => {
      manager.add({ title: "Saved", type: "info", priority, actionProps: toastActionProps });
    });
    await screen.findByRole(priority ? "alertdialog" : "dialog", { hidden: true });
  }

  it.each<{ kind: string; renderProp: ToastActionProps["render"] }>([
    { kind: "an element", renderProp: <a href="/x">Docs</a> },
    {
      kind: "a function",
      renderProp: (props) => (
        <a {...props} href="/y">
          Docs
        </a>
      ),
    },
  ])("renders the label of $kind that carries its own", async ({ renderProp }) => {
    await showAction({ render: renderProp, nativeButton: false });
    const action = screen.getByTestId("action");
    expect(action.tagName).toBe("A");
    expect(action).toHaveTextContent("Docs");
    expect(action).toHaveClass("mine");
  });

  it("renders a button without a render prop, with the library classes and the consumer's", async () => {
    await showAction();
    const action = screen.getByTestId("action");
    expect(action.tagName).toBe("BUTTON");
    expect(action).toHaveTextContent("Undo");
    expect(action).toHaveClass("mine", "inline-flex");
    expect(action).toHaveAttribute("data-type");
  });

  it("runs onClick once and passes the ref to the element", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    await showAction({ onClick, ref });
    await user.click(screen.getByTestId("action"));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(ref.current).toBe(screen.getByTestId("action"));
  });

  it("takes a hidden high-priority toast's action out of the tab order", async () => {
    await showAction({ priority: "high" });
    expect(screen.getByTestId("action")).toHaveAttribute("tabindex", "-1");
  });

  // An action with a `render` (a link, say) leaves the tab order too (#763): Base UI gives a
  // non-native button `tabIndex: 0`, and the -1 of chunks-ui goes over it only while hidden
  it("takes a hidden high-priority toast's action with a render out of the tab order, and back in once F6 shows the toast", async () => {
    const user = userEvent.setup();
    await showAction({ priority: "high", render: <a href="/x">Docs</a>, nativeButton: false });
    // aria-hidden, so only a query with `hidden` finds it
    const toast = screen.getByRole("alertdialog", { hidden: true });
    const action = screen.getByTestId("action");
    expect(action.tagName).toBe("A");
    expect(toast).toHaveAttribute("aria-hidden", "true");
    expect(action).toHaveAttribute("tabindex", "-1");

    // F6 moves focus into the viewport: Base UI shows the toast, and the tab stop comes back
    await user.keyboard("{F6}");
    expect(toast).not.toHaveAttribute("aria-hidden");
    expect(action.tabIndex).toBe(0);
  });

  // What a hidden toast does with a `tabIndex` you pass (the docs: Compound parts, and the note
  // under Props). The default action ends in a button of its own that sets the -1 last. With a
  // `render`, Base UI merges the toast's `actionProps` and then the props of the render element
  // over the -1. The `actionProps` row pins the limit that the ponytail comment in ToastAction
  // names, and a fix of it flips that row. The render element row pins the rule in the docs
  it.each<{ kind: string; options: Options; expected: string }>([
    { kind: "a default action with a tabIndex prop", options: { tabIndex: 0 }, expected: "-1" },
    {
      kind: "a default action, actionProps.tabIndex",
      options: { toastActionProps: { tabIndex: 0 } },
      expected: "-1",
    },
    {
      kind: "a render action with a tabIndex prop",
      options: { render: <a href="/x">Docs</a>, nativeButton: false, tabIndex: 0 },
      expected: "-1",
    },
    {
      kind: "a render action, actionProps.tabIndex",
      options: {
        render: <a href="/x">Docs</a>,
        nativeButton: false,
        toastActionProps: { tabIndex: 0 },
      },
      expected: "0",
    },
    {
      kind: "a render element with a tabIndex",
      options: {
        render: (
          <a href="/x" tabIndex={0}>
            Docs
          </a>
        ),
        nativeButton: false,
      },
      expected: "0",
    },
  ])(
    "puts tabindex $expected on the action of a hidden high-priority toast: $kind",
    async ({ options, expected }) => {
      await showAction({ priority: "high", ...options });
      expect(screen.getByTestId("action")).toHaveAttribute("tabindex", expected);
    },
  );
});

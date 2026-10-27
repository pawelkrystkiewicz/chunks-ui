import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
import { expectOnlyFocusGuardsUndecided, undecided } from "./AxeTest.utils";

afterEach(cleanup);

/*
 * axe's aria-hidden-focus fails an element that is hidden from assistive tech but takes focus
 * from Tab. Without the document.elementFromPoint stub in vitest.setup.ts it threw in jsdom, and
 * an errored rule lands in `incomplete`, which toHaveNoViolations() does not read.
 *
 * While a dialog is visible, the rule leaves such a node in `incomplete`, in a browser too: axe
 * counts any visible `dialog`, `[role=dialog]` or `[aria-modal=true]` as an open modal, whose
 * focus trap may keep focus off the node. An audit taken with a dialog open checks `incomplete`
 * with expectOnlyFocusGuardsUndecided() from AxeTest.utils.ts.
 */
it("fails toHaveNoViolations() on a focusable aria-hidden node", async () => {
  const { container } = render(
    // biome-ignore lint/a11y/noAriaHiddenOnFocusable lint/a11y/noNoninteractiveTabindex: the node axe must fail
    <span aria-hidden="true" tabIndex={0}>
      Stray
    </span>,
  );
  const results = await axe(container);
  expect(results.violations.map((rule) => rule.id)).toEqual(["aria-hidden-focus"]);
  expect(results).not.toHaveNoViolations();
});

describe("expectOnlyFocusGuardsUndecided", () => {
  /** A visible dialog with a focus guard as Base UI renders it, and the stray node if `stray` */
  function OpenDialog({ stray = false }: { stray?: boolean }) {
    return (
      <div role="dialog" aria-label="Edit">
        {/* biome-ignore lint/a11y/noAriaHiddenOnFocusable lint/a11y/noNoninteractiveTabindex: Base UI's focus guard */}
        <span data-base-ui-focus-guard="" aria-hidden="true" tabIndex={0} />
        <button type="button">Save</button>
        {stray && (
          // biome-ignore lint/a11y/noAriaHiddenOnFocusable lint/a11y/noNoninteractiveTabindex: the node the helper must fail
          <span aria-hidden="true" tabIndex={0} data-testid="stray">
            Stray
          </span>
        )}
      </div>
    );
  }

  it("passes when the focus guards are the only undecided nodes", async () => {
    const { container } = render(<OpenDialog />);
    const results = await axe(container);
    expect(undecided(results, "aria-hidden-focus")).toEqual([
      container.querySelector("[data-base-ui-focus-guard]"),
    ]);
    expectOnlyFocusGuardsUndecided(results);
  });

  it("fails on a focusable aria-hidden node that toHaveNoViolations() lets through", async () => {
    const { container } = render(<OpenDialog stray />);
    const results = await axe(container);
    // The open dialog leaves the node in `incomplete`
    expect(results).toHaveNoViolations();
    expect(undecided(results, "aria-hidden-focus")).toContain(screen.getByTestId("stray"));
    expect(() => expectOnlyFocusGuardsUndecided(results)).toThrow('data-testid="stray"');
  });

  it("fails when aria-hidden-focus errored, which axe files under `incomplete` with the error", async () => {
    // As before #565: with no elementFromPoint in jsdom, the rule throws
    const elementFromPoint = document.elementFromPoint;
    Reflect.deleteProperty(document, "elementFromPoint");
    try {
      const { container } = render(
        // biome-ignore lint/a11y/noAriaHiddenOnFocusable lint/a11y/noNoninteractiveTabindex: a node for the rule to check
        <span aria-hidden="true" tabIndex={0}>
          Stray
        </span>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
      // axe 4.12 also files the node it reached under an error-occurred check; 4.10 left none
      expect(results.incomplete.find((rule) => rule.id === "aria-hidden-focus")).toHaveProperty(
        "error.message",
        expect.stringContaining("elementFromPoint"),
      );
      expect(() => undecided(results, "aria-hidden-focus")).toThrow(
        "axe rule aria-hidden-focus errored",
      );
      expect(() => expectOnlyFocusGuardsUndecided(results)).toThrow(
        "axe rule aria-hidden-focus errored",
      );
    } finally {
      document.elementFromPoint = elementFromPoint;
    }
  });
});

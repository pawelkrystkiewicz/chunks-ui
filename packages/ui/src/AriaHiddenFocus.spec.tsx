import { cleanup, render } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, expect, it } from "vitest";

afterEach(cleanup);

/*
 * axe's aria-hidden-focus fails an element that is hidden from assistive tech but takes focus
 * from Tab. Without the document.elementFromPoint stub in vitest.setup.ts it threw in jsdom, and
 * an errored rule lands in `incomplete`, which toHaveNoViolations() does not read.
 *
 * While a dialog is visible, the rule leaves such a node in `incomplete`, in a browser too: axe
 * counts any visible `dialog`, `[role=dialog]` or `[aria-modal=true]` as an open modal, whose
 * focus trap may keep focus off the node. The Drawer audit (Drawer.spec.tsx), the open
 * DatePicker audit (DatePicker.spec.tsx) and a toast of the default `low` priority, which is a
 * `role="dialog"`, each show one; to check a node there, read `incomplete` as the F6 audit in
 * Toast.spec.tsx does.
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

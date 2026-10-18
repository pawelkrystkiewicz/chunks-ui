import type { axe } from "jest-axe";
import { expect } from "vitest";

type AxeResults = Awaited<ReturnType<typeof axe>>;
type AxeNode = AxeResults["incomplete"][number]["nodes"][number];

/** Base UI's focus guards: aria-hidden spans around an open popup that hand focus on from Tab */
const FOCUS_GUARD = "[data-base-ui-focus-guard]";

/** The element axe reported, found again by its selector; throws if it is no longer there */
function elementOf(node: AxeNode): Element {
  const [selector, ...nested] = node.target;
  // A target with more than one part is in an iframe or a shadow root, which the specs don't use
  const element =
    typeof selector === "string" && nested.length === 0 ? document.querySelector(selector) : null;
  if (!element) throw new Error(`axe reported a node that is not in the document: ${node.html}`);
  return element;
}

/**
 * The elements that the axe rule `ruleId` left in `incomplete`, as it could not decide them.
 * toHaveNoViolations() reads only `violations`, so it passes whatever is here.
 */
export function undecided(results: AxeResults, ruleId: string): Element[] {
  return results.incomplete
    .filter((rule) => rule.id === ruleId)
    .flatMap((rule) => rule.nodes)
    .map(elementOf);
}

/**
 * Asserts that every node aria-hidden-focus left in `incomplete` is a Base UI focus guard.
 *
 * While a dialog is visible, axe takes it for an open modal and leaves every focusable aria-hidden
 * node in `incomplete`, so toHaveNoViolations() passes a stray one. Base UI's focus guards are
 * such nodes by design and land there too. Call this next to toHaveNoViolations() in an audit
 * taken with a dialog open. In an audit that skips the guards, assert that
 * `undecided(results, "aria-hidden-focus")` is empty instead.
 */
export function expectOnlyFocusGuardsUndecided(results: AxeResults): void {
  const stray = undecided(results, "aria-hidden-focus").filter(
    (element) => !element.matches(FOCUS_GUARD),
  );
  // The message names each node by its tag alone; the diff under it shows the whole node
  const tags = stray.map((element) => (element.cloneNode(false) as Element).outerHTML);
  expect(stray, `focusable aria-hidden nodes besides the focus guards: ${tags}`).toEqual([]);
}

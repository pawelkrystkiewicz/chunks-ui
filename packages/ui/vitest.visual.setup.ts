import "./src/visual-test.css";
import { beforeEach } from "vitest";
import { commands } from "vitest/browser";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

// Real browser events drive these specs, and they wait with expect.element/poll, not act().
// Testing Library turns React's act environment on in a beforeAll, so React logged
// "not wrapped in act(...)" for every update an event or a timer caused. Turn it back
// off before each test; render() and cleanup() still wrap themselves in act.
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = false;
});

// The browser page keeps the mouse where the last click or hover left it, across tests and
// spec files, and hovers whatever renders under it next. Which spec ran before on the same
// page differs between machines, so a hover style could slip into one machine's screenshot.
// Move the mouse off the page before each test.
beforeEach(async () => {
  await commands.parkPointer();
});

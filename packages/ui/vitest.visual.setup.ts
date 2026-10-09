import "./src/visual-test.css";
import { beforeEach } from "vitest";

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

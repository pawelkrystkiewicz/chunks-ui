import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { Switch } from "../components/switch";
import { reloadMotion } from "./use-motion";

it("leaves Motion out of hydration, so server markup matches once it has loaded", async () => {
  const ui = (
    <Switch.Root aria-label="Notifications">
      <Switch.Thumb />
    </Switch.Root>
  );
  // Server markup is rendered without Motion, as on a server; the client has it when hydrating
  const loading = reloadMotion();
  const container = document.createElement("div");
  container.innerHTML = renderToString(ui);
  document.body.append(container);
  await loading;

  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  const root = await act(async () => hydrateRoot(container, ui));
  expect(consoleError).not.toHaveBeenCalled();
  consoleError.mockRestore();
  act(() => root.unmount());
  container.remove();
});

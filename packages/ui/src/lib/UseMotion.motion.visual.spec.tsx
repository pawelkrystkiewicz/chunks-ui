import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { Switch } from "../components/switch";
import { ToggleGroup } from "../components/toggle-group";
import { reloadMotion } from "./use-motion";

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

// Elements React removed from the rendered tree while it stayed mounted
async function removedWhileMounted(ui: ReactNode) {
  // Resolves once use-motion holds the module; a bare import("motion/react") can settle first
  await reloadMotion();
  const removed: Node[] = [];
  const observer = new MutationObserver((records) => {
    for (const record of records) removed.push(...record.removedNodes);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  render(ui);
  for (let frame = 0; frame < 5; frame++) await nextFrame();
  observer.disconnect();
  return removed.filter((node) => node instanceof Element);
}

// Runs with reduced motion off. A control mounted once Motion has loaded must render its
// Motion elements from the first render: swapping one in later remounts it.
describe("controls mounted after Motion has loaded", () => {
  it("never replaces a Switch thumb", async () => {
    const removed = await removedWhileMounted(
      <Switch.Root aria-label="Notifications" defaultChecked>
        <Switch.Thumb />
      </Switch.Root>,
    );
    expect(removed).toEqual([]);
  });

  it("never replaces a ToggleGroup indicator", async () => {
    const removed = await removedWhileMounted(
      <ToggleGroup.Root defaultValue={["a"]}>
        <ToggleGroup.Item value="a">Alpha</ToggleGroup.Item>
        <ToggleGroup.Item value="b">Beta</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    expect(removed).toEqual([]);
  });
});

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { reloadMotion } from "../../lib/use-motion";
import { consumerRef, sameBox, waitForStable } from "../../VisualTest.utils";
import { ToggleGroup } from "./index";

// Runs with reduced motion off, so Motion drives the indicator
describe("ToggleGroup with a consumer ref, Motion path", () => {
  it.each([
    ["Root", "object"],
    ["Root", "callback"],
    ["Root", "undefined"],
    ["Item", "object"],
    ["Item", "callback"],
    ["Item", "undefined"],
  ] as const)(
    "%s, %s ref: the ref gets the element and Motion moves the indicator",
    async (part, kind) => {
      await reloadMotion();
      const rootRef = consumerRef<HTMLDivElement>(kind);
      const itemRef = consumerRef<HTMLButtonElement>(kind);
      // `ref` is passed even when undefined: ref={undefined} must not break the indicator either
      const { getByRole } = render(
        <ToggleGroup.Root defaultValue={["a"]} {...(part === "Root" ? { ref: rootRef.ref } : {})}>
          <ToggleGroup.Item value="a">Alpha</ToggleGroup.Item>
          <ToggleGroup.Item value="b" {...(part === "Item" ? { ref: itemRef.ref } : {})}>
            Beta, a longer item
          </ToggleGroup.Item>
        </ToggleGroup.Root>,
      );
      const group = getByRole("group");
      const alpha = getByRole("button", { name: "Alpha" });
      const beta = getByRole("button", { name: "Beta, a longer item" });
      if (kind !== "undefined") {
        expect(part === "Root" ? rootRef.received() : itemRef.received()).toBe(
          part === "Root" ? group : beta,
        );
      }
      const indicator = () => group.querySelector<HTMLElement>(":scope > span");

      await expect.poll(() => indicator() !== null).toBe(true);
      // Motion drives it: the CSS fallback's transition class is gone
      await expect.poll(() => indicator()?.classList.contains("micro-interactions")).toBe(false);
      const onAlpha = await waitForStable(() => indicator()?.getBoundingClientRect().toJSON());
      expect(onAlpha && sameBox(onAlpha, alpha.getBoundingClientRect())).toBe(true);

      await userEvent.click(beta);
      const widths: number[] = [];
      const onBeta = await waitForStable(() => {
        const box = indicator()?.getBoundingClientRect();
        if (box) widths.push(box.width);
        return box?.toJSON();
      });
      expect(onBeta).toBeDefined();
      expect(onBeta && sameBox(onBeta, beta.getBoundingClientRect())).toBe(true);
      // In-between widths: Motion's spring moved it, rather than a jump
      const [from, to] = [alpha.offsetWidth, beta.offsetWidth];
      expect(widths.some((w) => w > Math.min(from, to) + 1 && w < Math.max(from, to) - 1)).toBe(
        true,
      );
    },
  );
});

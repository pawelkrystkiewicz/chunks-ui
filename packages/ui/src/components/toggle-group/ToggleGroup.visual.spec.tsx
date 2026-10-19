import { render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNotAllowed, focusVisible, renderFixture } from "../../VisualTest.utils";
import { ToggleGroup } from "./index";

/** The indicator of `group`: the span it renders before its items; null without one */
const indicatorOf = (group: Element) => group.querySelector<HTMLElement>(":scope > span");

/** The computed opacity of `el`; null without one, so a poll waits for the indicator */
const opacityOf = (el: Element | null) => (el ? getComputedStyle(el).opacity : null);

describe("ToggleGroup", () => {
  it("single selection", async () => {
    const { fixture } = await renderFixture(
      <ToggleGroup.Root defaultValue={["center"]}>
        <ToggleGroup.Item value="left">Left</ToggleGroup.Item>
        <ToggleGroup.Item value="center">Center</ToggleGroup.Item>
        <ToggleGroup.Item value="right">Right</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("with disabled item", async () => {
    const { fixture } = await renderFixture(
      <ToggleGroup.Root defaultValue={["a"]}>
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
        <ToggleGroup.Item value="b" disabled>
          B
        </ToggleGroup.Item>
        <ToggleGroup.Item value="c">C</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  // Keyboard focus shows the ring: 2px of --ring, 2px outside the item, which reaches into the
  // root's 4px padding and 2px over the neighbouring items, past the 2px gap
  it("pressed item focus-visible", async () => {
    const { fixture, getByRole } = await renderFixture(
      <ToggleGroup.Root defaultValue={["center"]}>
        <ToggleGroup.Item value="left">Left</ToggleGroup.Item>
        <ToggleGroup.Item value="center">Center</ToggleGroup.Item>
        <ToggleGroup.Item value="right">Right</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    focusVisible(getByRole("button", { name: "Center", pressed: true }));
    await expect(fixture).toMatchScreenshot();
  });

  // In a `multiple` group a pressed item has an opaque background. The next sibling paints over
  // the one before it at the same z-index, so the focused item rises above it: its ring shows
  // whole on the side the pressed neighbour would otherwise cover.
  it("multiple, focused item before a pressed one", async () => {
    const { fixture, getByRole } = await renderFixture(
      <ToggleGroup.Root multiple defaultValue={["italic"]}>
        <ToggleGroup.Item value="bold">Bold</ToggleGroup.Item>
        <ToggleGroup.Item value="italic">Italic</ToggleGroup.Item>
        <ToggleGroup.Item value="underline">Underline</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    focusVisible(getByRole("button", { name: "Bold", pressed: false }));
    await expect(fixture).toMatchScreenshot();
  });

  // The docs' rule for a dim of your own, in `@layer utilities`: it must outweigh the specificity
  // of the library's dim, which sits in the same layer
  it("dims the pill by a rule of your own in @layer utilities", async () => {
    const style = document.createElement("style");
    style.textContent =
      "@layer utilities { .my-group:has([data-pressed]:disabled) > span:first-child { opacity: 0.7 } }";
    document.head.append(style);
    try {
      const { getByRole } = render(
        <ToggleGroup.Root value={["a"]} className="my-group">
          <ToggleGroup.Item value="a" disabled>
            A
          </ToggleGroup.Item>
          <ToggleGroup.Item value="b">B</ToggleGroup.Item>
        </ToggleGroup.Root>,
      );
      await expect.poll(() => opacityOf(indicatorOf(getByRole("group")))).toBe("0.7");
    } finally {
      style.remove();
    }
  });

  it("shows a not-allowed cursor on a disabled item", () => {
    const { getByRole } = render(
      <ToggleGroup.Root defaultValue={["a"]}>
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
        <ToggleGroup.Item value="b" disabled>
          B
        </ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    expectNotAllowed(getByRole("button", { name: "B" }));
  });

  // `data-pressed:text-foreground` is a lower specificity than `disabled:hover:`, so the reset must
  // skip a pressed item, or the pointer would turn its colour to the muted one
  it("keeps a disabled item's colour under the pointer, pressed or not", async () => {
    const { getByRole } = render(
      <ToggleGroup.Root disabled defaultValue={["b"]}>
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
        <ToggleGroup.Item value="b">B</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    for (const [name, pressed] of [
      ["A", false],
      ["B", true],
    ] as const) {
      const item = getByRole("button", { name, pressed });
      const rest = getComputedStyle(item).color;
      await userEvent.hover(item);
      expect(getComputedStyle(item).color, name).toBe(rest);
    }
  });
});

// Each group draws its pill from its own state, never from the group around it or one inside it.
// Reduced motion: the opacity changes at once.
describe("ToggleGroup nested in another", () => {
  type Nesting = {
    outerDisabled?: boolean;
    innerDisabled?: boolean;
    outer?: "single" | "multiple" | "none pressed";
  };

  function renderNested({ outerDisabled, innerDisabled, outer = "single" }: Nesting) {
    const { getByRole } = render(
      <ToggleGroup.Root
        value={outer === "none pressed" ? [] : ["o"]}
        multiple={outer === "multiple"}
        aria-label="Outer"
      >
        <ToggleGroup.Item value="o" disabled={outerDisabled}>
          Outer
        </ToggleGroup.Item>
        <ToggleGroup.Root value={["i"]} aria-label="Inner">
          <ToggleGroup.Item value="i" disabled={innerDisabled}>
            Inner
          </ToggleGroup.Item>
          <ToggleGroup.Item value="j">Other inner</ToggleGroup.Item>
        </ToggleGroup.Root>
      </ToggleGroup.Root>,
    );
    const pillOf = (name: string) => indicatorOf(getByRole("group", { name }));
    return { getByRole, pillOf };
  }

  it.each([
    ["the outer item", { outerDisabled: true }, { outer: "0.5", inner: "1" }],
    ["the inner item", { innerDisabled: true }, { outer: "1", inner: "0.5" }],
    ["both items", { outerDisabled: true, innerDisabled: true }, { outer: "0.5", inner: "0.5" }],
  ] as const)("dims each pill by its own item, with %s disabled", async (_, nesting, opacities) => {
    const { pillOf } = renderNested(nesting);
    await expect
      .poll(() => ({ outer: opacityOf(pillOf("Outer")), inner: opacityOf(pillOf("Inner")) }))
      .toEqual(opacities);
  });

  // Until a group has an indicator its pressed item draws the pill in a ::before; the inner
  // group has one, so its item draws none of its own, whatever the outer group has
  it.each(["multiple", "none pressed"] as const)(
    "draws the inner pill once, in an outer group with no indicator (%s)",
    async (outer) => {
      const { getByRole, pillOf } = renderNested({ outer });
      await expect.poll(() => pillOf("Inner")).not.toBeNull();
      expect(pillOf("Outer"), "the outer group has no indicator").toBeNull();
      const item = getByRole("button", { name: "Inner" });
      expect(getComputedStyle(item, "::before").position).toBe("static");
    },
  );
});

// An item can sit in an element of its own inside the group: it still is the group's item
describe("ToggleGroup with its pressed item in an element of its own", () => {
  const group = (disabled = false) => (
    <ToggleGroup.Root value={["a"]}>
      <div>
        <ToggleGroup.Item value="a" disabled={disabled}>
          A
        </ToggleGroup.Item>
      </div>
      <ToggleGroup.Item value="b">B</ToggleGroup.Item>
    </ToggleGroup.Root>
  );

  it("dims the pill under the item when it is disabled", async () => {
    const { getByRole } = render(group(true));
    await expect.poll(() => opacityOf(indicatorOf(getByRole("group")))).toBe("0.5");
  });

  it("draws the pill on the item in server HTML", () => {
    const host = document.createElement("div");
    host.innerHTML = renderToString(group());
    document.body.append(host);
    try {
      const pressed = host.querySelector("[data-pressed]");
      if (!pressed) throw new Error("No pressed item in the server HTML");
      expect(getComputedStyle(pressed, "::before").position).toBe("absolute");
    } finally {
      host.remove();
    }
  });

  // Once the group has an indicator the item draws no pill of its own. The element around the item
  // has no indicator, so only the `group-not-data-indicator/toggle-group:` half of the item's pill
  // classes stops a second pill here
  it("draws no pill on the item once the group has an indicator", async () => {
    const { getByRole } = render(group());
    await expect.poll(() => indicatorOf(getByRole("group"))).not.toBeNull();
    const item = getByRole("button", { name: "A", pressed: true });
    expect(getComputedStyle(item, "::before").position).toBe("static");
  });
});

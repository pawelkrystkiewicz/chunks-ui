import { render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNotAllowed, focusVisible, renderFixture } from "../../VisualTest.utils";
import { ToggleGroup } from "./index";

/** The indicator of `group`: the span it renders before its items; null without one */
const indicatorOf = (group: Element) => group.querySelector<HTMLElement>(":scope > span");

/** `el`, which a poll has seen; throws if it is gone */
function shown<T>(el: T | null): T {
  if (!el) throw new Error("No indicator");
  return el;
}

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
      await expect.poll(() => indicatorOf(getByRole("group"))).not.toBeNull();
      expect(getComputedStyle(shown(indicatorOf(getByRole("group")))).opacity).toBe("0.7");
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
    /** The outer group's pressed item is disabled */
    outerDisabled?: boolean;
    /** The inner group's pressed item is disabled */
    innerDisabled?: boolean;
    /** What the outer group is: one with a pressed item, a `multiple` one, or one with none pressed */
    outer?: "single" | "multiple" | "none pressed";
    /** The inner group sits in an element of its own inside the outer one */
    wrapped?: boolean;
  };

  const nested = ({ outerDisabled, innerDisabled, outer = "single", wrapped }: Nesting = {}) => {
    const inner = (
      <ToggleGroup.Root value={["i"]} aria-label="Inner">
        <ToggleGroup.Item value="i" disabled={innerDisabled}>
          Inner
        </ToggleGroup.Item>
        <ToggleGroup.Item value="j">Other inner</ToggleGroup.Item>
      </ToggleGroup.Root>
    );
    return (
      <ToggleGroup.Root
        value={outer === "none pressed" ? [] : ["o"]}
        multiple={outer === "multiple"}
        aria-label="Outer"
      >
        <ToggleGroup.Item value="o" disabled={outerDisabled}>
          Outer
        </ToggleGroup.Item>
        {wrapped ? <div>{inner}</div> : inner}
      </ToggleGroup.Root>
    );
  };

  function renderNested(nesting: Nesting) {
    const { getByRole } = render(nested(nesting));
    const pillOf = (name: string) => indicatorOf(getByRole("group", { name }));
    return { getByRole, pillOf };
  }

  const opacityOf = (el: Element | null) => (el ? getComputedStyle(el).opacity : null);

  it.each([
    { wrapped: false, where: "in the outer group" },
    { wrapped: true, where: "in an element of the outer group" },
  ])("keeps the inner pill bright under a disabled outer item, $where", async ({ wrapped }) => {
    const { pillOf } = renderNested({ outerDisabled: true, wrapped });
    await expect.poll(() => pillOf("Inner")).not.toBeNull();
    expect(opacityOf(pillOf("Outer")), "the outer pill dims").toBe("0.5");
    expect(opacityOf(pillOf("Inner")), "the inner pill").toBe("1");
  });

  it.each([
    { wrapped: false, where: "in the outer group" },
    { wrapped: true, where: "in an element of the outer group" },
  ])("keeps the outer pill bright under a disabled inner item, $where", async ({ wrapped }) => {
    const { pillOf } = renderNested({ innerDisabled: true, wrapped });
    await expect.poll(() => pillOf("Inner")).not.toBeNull();
    expect(opacityOf(pillOf("Inner")), "the inner pill dims").toBe("0.5");
    expect(opacityOf(pillOf("Outer")), "the outer pill").toBe("1");
  });

  it("dims both pills when both pressed items are disabled", async () => {
    const { pillOf } = renderNested({ outerDisabled: true, innerDisabled: true });
    await expect.poll(() => pillOf("Inner")).not.toBeNull();
    expect(opacityOf(pillOf("Outer")), "the outer pill").toBe("0.5");
    expect(opacityOf(pillOf("Inner")), "the inner pill").toBe("0.5");
  });

  // Until a group has an indicator its pressed item draws the pill in a ::before; the inner
  // group has one, so its item draws none of its own, whatever the outer group has
  it.each([
    { outer: "multiple", wrapped: false },
    { outer: "none pressed", wrapped: false },
    { outer: "multiple", wrapped: true },
  ] as const)(
    "draws the inner pill once, in an outer group with no indicator ($outer, wrapped: $wrapped)",
    async ({ outer, wrapped }) => {
      const { getByRole, pillOf } = renderNested({ outer, wrapped });
      await expect.poll(() => pillOf("Inner")).not.toBeNull();
      expect(pillOf("Outer"), "the outer group has no indicator").toBeNull();
      const before = getComputedStyle(getByRole("button", { name: "Inner" }), "::before");
      expect({ position: before.position, background: before.backgroundColor }).toEqual({
        position: "static",
        background: "rgba(0, 0, 0, 0)",
      });
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
    await expect.poll(() => indicatorOf(getByRole("group"))).not.toBeNull();
    expect(getComputedStyle(shown(indicatorOf(getByRole("group")))).opacity).toBe("0.5");
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
});

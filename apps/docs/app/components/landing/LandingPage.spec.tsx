// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import { expect, it } from "vitest";
import { LandingPage } from "./LandingPage";

// Nextra's Search reads the App Router, which only Next mounts. No test navigates.
const renderPage = () =>
  render(
    <AppRouterContext.Provider value={{} as AppRouterInstance}>
      <LandingPage />
    </AppRouterContext.Provider>,
  );

const header = (container: HTMLElement) => {
  const el = container.querySelector("header");
  if (!el) throw new Error("no header");
  return within(el);
};

it("the header links to the GitHub repository in a new tab", () => {
  const { container } = renderPage();
  const link = header(container).getByRole("link", { name: "GitHub repository" });
  expect(link.getAttribute("href")).toBe("https://github.com/pawelkrystkiewicz/chunks-ui");
  expect(link.getAttribute("target")).toBe("_blank");
});

it("the header has the docs search box", () => {
  const { container } = renderPage();
  expect(header(container).getByRole("combobox", { name: "Search documentation" })).toBeTruthy();
});

// A class's utility without its variants (`lg:`, `data-[side=top]:`, `[.dark_&]:`, `*:`)
const utility = (c: string) => c.replace(/^(?:(?:[\w*-]+|[\w-]*\[[^\]]*\])(?:\/[\w-]+)?:)+/, "");
const matching = (el: Element | null, re: RegExp) =>
  [...(el?.classList ?? [])].filter((c) => re.test(utility(c)));

// The header grows with text zoom, so the menu hangs from it instead of a fixed offset. The hero
// clips only sideways: on a screen taller than the hero the menu still reaches the bottom.
it("the open mobile menu hangs from the header, nothing clips it, and it locks page scroll", () => {
  const { container } = renderPage();
  fireEvent.click(screen.getByRole("button", { name: "Menu" }));
  const menu = container.querySelector("#landing-menu");
  const headerEl = container.querySelector("header");
  if (!menu || !headerEl) throw new Error("no open menu or header");
  expect([...menu.classList]).toEqual(
    expect.arrayContaining(["absolute", "top-[calc(100%+1px)]", "h-dvh"]),
  );
  // The header is the menu's containing block. No element between them has a Tailwind utility
  // that makes one: relative, absolute, fixed or sticky; transform, translate, scale, rotate, skew
  // or perspective; filter, a filter function (blur, brightness and the rest) or backdrop-*;
  // contain-*; will-change-transform. Arbitrary properties (`[transform:…]`) are not read.
  expect(headerEl.classList).toContain("relative");
  const containingBlock =
    /^-?(relative|absolute|fixed|sticky|transform|translate-|scale-|rotate-|skew-|perspective-|filter|blur|brightness-|contrast-|drop-shadow|grayscale|hue-rotate-|invert|saturate-|sepia|backdrop-|contain-|will-change-transform)/;
  for (let el = menu.parentElement; el && el !== headerEl; el = el.parentElement) {
    expect(matching(el, containingBlock)).toEqual([]);
  }
  // The menu sits below the header's box, so the header has no overflow utility but visible. The
  // hero has `overflow-x-clip` alone: x hidden, auto or scroll turn y's visible into auto.
  expect(matching(headerEl, /^overflow-(?!(x-|y-)?visible$)/)).toEqual([]);
  const hero = headerEl.parentElement;
  expect(hero?.classList).toContain("overflow-x-clip");
  expect(matching(hero, /^overflow-(hidden|clip|auto|scroll|y-|x-(hidden|auto|scroll))/)).toEqual(
    [],
  );
  // Page scroll stays locked while the menu is open; Escape closes it and unlocks
  expect(document.documentElement.style.overflow).toBe("hidden");
  fireEvent.keyDown(window, { key: "Escape" });
  expect(container.querySelector("#landing-menu")).toBeNull();
  expect(document.documentElement.style.overflow).toBe("");
});

it.each([
  ["Read the docs", "/getting-started"],
  ["Open Create", "/create"],
])("the %s CTA is a link with the contained primary Button colours", (name, href) => {
  renderPage();
  const cta = screen.getByRole("link", { name });
  expect(cta.getAttribute("href")).toBe(href);
  expect([...cta.classList]).toEqual(
    expect.arrayContaining(["bg-primary", "text-primary-foreground"]),
  );
});

it("the Create section links to /create once, besides the preset tiles", () => {
  const { container } = renderPage();
  const create = container.querySelector<HTMLElement>("#create");
  if (!create) throw new Error("no #create section");
  const links = [...create.querySelectorAll("a:not([aria-label^='Open Create with'])")];
  expect(links.map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
    ["Open Create", "/create"],
  ]);
});

it("every link and button, the footer's too, draws the --ring outline on keyboard focus", () => {
  const { container } = renderPage();
  fireEvent.click(screen.getByRole("button", { name: "Menu" }));
  const focusable = [...container.querySelectorAll<HTMLElement>("a[href], button")];
  expect(focusable.length).toBeGreaterThan(40);
  expect(focusable.filter((el) => el.closest("footer")).length).toBeGreaterThan(5);
  const without = focusable
    .filter(
      (el) =>
        !el.classList.contains("focus-visible:outline-2") ||
        !el.classList.contains("focus-visible:outline-ring"),
    )
    .map((el) => el.getAttribute("aria-label") ?? el.textContent);
  expect(without).toEqual([]);
});

// The previews stand for the library, so their frames restore the site ring that .landing replaces.
it("every component preview frame restores the library ring", () => {
  const { container } = renderPage();
  const frames = [
    ...container.querySelectorAll<HTMLElement>("a[aria-labelledby^='cat-'] > div[aria-hidden]"),
  ];
  expect(frames.length).toBeGreaterThan(0);
  for (const f of frames) expect(f.classList).toContain("[--ring:var(--l-lib-ring)]");
});

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

// The header grows with text zoom, so the menu hangs from it instead of a fixed offset. The hero
// clips only sideways: on a screen taller than the hero the menu still reaches the bottom.
it("the open mobile menu hangs from the header, and the hero does not clip it", () => {
  const { container } = renderPage();
  fireEvent.click(screen.getByRole("button", { name: "Menu" }));
  const menu = container.querySelector("#landing-menu");
  const headerEl = container.querySelector("header");
  if (!menu || !headerEl) throw new Error("no open menu or header");
  const matching = (el: Element | null, re: RegExp) =>
    [...(el?.classList ?? [])].filter((c) => re.test(c));
  // The header is the menu's containing block: no positioned element sits between them
  expect(headerEl.classList).toContain("relative");
  for (let el = menu.parentElement; el && el !== headerEl; el = el.parentElement) {
    expect(matching(el, /(^|:)(relative|absolute|fixed|sticky)$/)).toEqual([]);
  }
  expect([...menu.classList]).toEqual(
    expect.arrayContaining(["absolute", "top-[calc(100%+1px)]", "h-dvh"]),
  );
  // `overflow-x-clip` alone: x hidden, auto or scroll turn y's visible into auto, a scroll box
  const hero = headerEl.parentElement;
  expect(hero?.classList).toContain("overflow-x-clip");
  expect(
    matching(hero, /(^|:)overflow-(hidden|clip|auto|scroll|y-|x-(hidden|auto|scroll))/),
  ).toEqual([]);
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

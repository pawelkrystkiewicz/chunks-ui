// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import { expect, it, vi } from "vitest";
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

it("the get-started rows and the footer link to Context7 in a new tab", () => {
  const { container } = renderPage();
  const getStarted = container.querySelector<HTMLElement>("#get-started");
  const footer = container.querySelector("footer");
  if (!getStarted || !footer) throw new Error("no #get-started section or footer");
  const links = [
    within(getStarted).getByRole("link", { name: /context7\.com\/pawelkrystkiewicz\/chunks-ui/ }),
    within(footer).getByRole("link", { name: "Context7 ↗" }),
  ];
  for (const link of links) {
    expect(link.getAttribute("href")).toBe("https://context7.com/pawelkrystkiewicz/chunks-ui");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener");
  }
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
  // It ends at the screen's bottom edge, so links past it scroll inside it under large text
  expect([...menu.classList]).toEqual(
    expect.arrayContaining([
      "absolute",
      "top-[calc(100%+1px)]",
      "h-[calc(100dvh-100%-1px)]",
      "overflow-y-auto",
    ]),
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

// The menu ends at the screen's bottom edge only with the header at the top of the screen. The
// header isn't sticky, so the button shows only while the page is scrolled less than its height.
it("opening the menu scrolls the page to the top", () => {
  // jsdom has no layout, so its scrollTop stays 0: watch the write
  const scrollTop = vi.spyOn(document.documentElement, "scrollTop", "set");
  try {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(scrollTop).toHaveBeenCalledWith(0);
  } finally {
    scrollTop.mockRestore();
  }
});

// Past Tailwind's lg, `lg:hidden` hides the menu and its button, but nothing unmounts them
it("growing the window past lg closes the open menu and releases the scroll lock", () => {
  const LG = "(width >= 64rem)";
  const lg = Object.assign(new EventTarget(), { matches: false, media: LG });
  const { matchMedia } = window;
  window.matchMedia = (query) => (query === LG ? (lg as never) : matchMedia(query));
  try {
    const { container } = renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(document.documentElement.style.overflow).toBe("hidden");
    act(() => {
      lg.matches = true;
      lg.dispatchEvent(new Event("change"));
    });
    expect(container.querySelector("#landing-menu")).toBeNull();
    expect(document.documentElement.style.overflow).toBe("");
  } finally {
    window.matchMedia = matchMedia;
  }
});

// The page under the open menu is hidden (WCAG 2.4.11), so focus that leaves the menu and its
// button closes the menu. Focus that goes nowhere, as on a tap on the menu's empty space, does not.
it("focus leaving the open menu closes it; focus moving within it or going nowhere does not", () => {
  const { container } = renderPage();
  const button = screen.getByRole("button", { name: "Menu" });
  fireEvent.click(button);
  const menu = () => container.querySelector("#landing-menu");
  const links = [...(menu()?.querySelectorAll("a") ?? [])];
  const [first, last] = [links.at(0), links.at(-1)];
  if (!first || !last) throw new Error("no menu links");
  act(() => {
    button.focus();
    first.focus();
    last.focus();
    last.blur();
  });
  expect(menu()).not.toBeNull();
  // Back to the button from a link: still inside the pair
  act(() => {
    first.focus();
    button.focus();
  });
  expect(menu()).not.toBeNull();
  // Tab from the last link: the next link or button in the page, under the menu
  const focusable = [...container.querySelectorAll<HTMLElement>("a[href], button")];
  const next = focusable[focusable.indexOf(last) + 1];
  expect(next?.closest("header")).toBeNull();
  act(() => {
    last.focus();
    next?.focus();
  });
  expect(menu()).toBeNull();
  expect(document.documentElement.style.overflow).toBe("");
  // The button's own blur: out to the page, it closes
  fireEvent.click(button);
  expect(menu()).not.toBeNull();
  act(() => {
    button.focus();
    next?.focus();
  });
  expect(menu()).toBeNull();
});

// Escape unmounts the nav, so focus on a link would fall to <body>: it goes back to the button.
it("Escape closes the menu and puts focus on the button, from a menu link or from the button", () => {
  const { container } = renderPage();
  const button = screen.getByRole("button", { name: "Menu" });
  fireEvent.click(button);
  const link = container.querySelector<HTMLElement>("#landing-menu a");
  if (!link) throw new Error("no menu link");
  act(() => link.focus());
  fireEvent.keyDown(link, { key: "Escape" });
  expect(container.querySelector("#landing-menu")).toBeNull();
  expect(document.activeElement).toBe(button);
  // Focus on the button itself: Escape closes and focus stays there
  fireEvent.click(button);
  act(() => button.focus());
  fireEvent.keyDown(button, { key: "Escape" });
  expect(container.querySelector("#landing-menu")).toBeNull();
  expect(document.activeElement).toBe(button);
});

// Focus that was not in the menu (a mouse click leaves it on <body>) stays where it was.
it("Escape with focus on <body> closes the menu and does not move focus to the button", () => {
  const { container } = renderPage();
  fireEvent.click(screen.getByRole("button", { name: "Menu" }));
  act(() => (document.activeElement as HTMLElement | null)?.blur());
  expect(document.activeElement).toBe(document.body);
  fireEvent.keyDown(window, { key: "Escape" });
  expect(container.querySelector("#landing-menu")).toBeNull();
  expect(document.activeElement).toBe(document.body);
});

// Firefox makes a scrolling nav a Tab stop of its own; the hero's overflow clip hides its outline.
it("the open menu is not a Tab stop of its own", () => {
  const { container } = renderPage();
  fireEvent.click(screen.getByRole("button", { name: "Menu" }));
  expect(container.querySelector("#landing-menu")?.getAttribute("tabindex")).toBe("-1");
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
  const links = [...create.querySelectorAll("a:not([data-preset])")];
  expect(links.map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
    ["Open Create", "/create"],
  ]);
});

it("the Claude section links to the import page once and lists what the system holds", () => {
  const { container } = renderPage();
  const claude = container.querySelector<HTMLElement>("#claude");
  if (!claude) throw new Error("no #claude section");
  const links = [...claude.querySelectorAll("a")];
  expect(links.map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
    ["Import it", "/claude-design-system"],
  ]);
  const items = within(claude).getAllByRole("listitem");
  // The first visible text of each tile is its name; the drawings above them are aria-hidden
  const names = items.map(
    (li) => li.querySelector(":scope > span:not([aria-hidden])")?.textContent,
  );
  expect(names).toEqual(["Tokens", "Every component", "Fonts", "Logos"]);
});

it("the footer links to the privacy page in the same tab", () => {
  const { container } = renderPage();
  const footer = container.querySelector("footer");
  if (!footer) throw new Error("no footer");
  const link = within(footer).getByRole("link", { name: "Privacy" });
  expect(link.getAttribute("href")).toBe("/privacy");
  expect(link.hasAttribute("target")).toBe(false);
});

it("the footer's mail link goes to contact@chunk-creations.com", () => {
  const { container } = renderPage();
  const footer = container.querySelector("footer");
  if (!footer) throw new Error("no footer");
  const mail = [...footer.querySelectorAll('a[href^="mailto:"]')];
  expect(mail.map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
    ["contact@chunk-creations.com", "mailto:contact@chunk-creations.com"],
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
    ...container.querySelectorAll<HTMLElement>("#components a[href] > div[aria-hidden]"),
  ];
  expect(frames.length).toBeGreaterThan(0);
  for (const f of frames) expect(f.classList).toContain("[--ring:var(--l-lib-ring)]");
});

// axe's label-content-name-mismatch (WCAG 2.5.3) checks only links with aria-label or aria-labelledby,
// and then wants all on-screen text, aria-hidden parts too, in the name. So these links take their
// name from their content and must never get either attribute.
it("each category card is named by its visible text, heading first", () => {
  const { container } = renderPage();
  const cards = [
    ...container.querySelectorAll<HTMLElement>("#components a[href] > div[aria-hidden]"),
  ].map((f) => f.parentElement as HTMLElement);
  expect(cards.length).toBeGreaterThan(0);
  for (const card of cards) {
    expect(card.hasAttribute("aria-labelledby")).toBe(false);
    expect(card.hasAttribute("aria-label")).toBe(false);
  }
  expect(screen.getByRole("link", { name: /^Inputs Button, / })).toBeTruthy();
});

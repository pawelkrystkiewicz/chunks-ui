// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import { expect, it, vi } from "vitest";
import { config } from "../../../config";
import { LandingPage } from "./LandingPage";

// The Claude section quotes the import page's prompt and names the React that
// scripts/design-system/build.ts bundles (as packages/ui resolves it). jsdom gives
// import.meta.url an http scheme, so the paths come from import.meta.dirname.
const ROOT = join(import.meta.dirname, "../../../../..");
const PROMPT_FIRST_LINE = readFileSync(
  join(ROOT, "apps/docs/content/claude-design-system.mdx"),
  "utf8",
)
  .split("```text\n")[1]
  ?.split("\n")[0];
const BUNDLED_REACT = (
  createRequire(join(ROOT, "packages/ui/package.json"))("react/package.json") as {
    version: string;
  }
).version;

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

// The page around the open menu is inert, so focus can leave the menu and its button only for the
// header's other controls, and that closes the menu. Focus that goes nowhere, as on a tap on the
// menu's empty space or Tab past its last link, does not.
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
  // From a link to a header control (a tap on the GitHub link): it closes
  const github = header(container).getByRole("link", { name: "GitHub repository" });
  expect(github.closest("[inert]")).toBeNull();
  act(() => {
    last.focus();
    github.focus();
  });
  expect(menu()).toBeNull();
  expect(document.documentElement.style.overflow).toBe("");
  // The button's own blur: Shift+Tab from it reaches the theme toggle, and it closes
  fireEvent.click(button);
  expect(menu()).not.toBeNull();
  const theme = header(container).getByRole("button", { name: /^Switch to (dark|light) mode$/ });
  expect(theme.closest("[inert]")).toBeNull();
  act(() => {
    button.focus();
    theme.focus();
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

it("the Claude section links to the import page once, quoting its prompt and the bundled React", () => {
  const { container } = renderPage();
  const claude = container.querySelector<HTMLElement>("#claude");
  if (!claude) throw new Error("no #claude section");
  const links = [...claude.querySelectorAll("a")];
  expect(links.map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
    ["Get the prompt →", "/claude-design-system"],
  ]);
  // A changed prompt or React major fails here instead of leaving the landing behind
  expect(PROMPT_FIRST_LINE).toMatch(/^Import the Chunks UI design system/);
  expect(claude.textContent).toContain(PROMPT_FIRST_LINE);
  expect(claude.textContent).toContain(`live on React ${BUNDLED_REACT.split(".")[0]}`);
});

// Each case sets the flag itself, so flipping it in config.ts on hire leaves the spec green
const renderOpenToWork = (open: boolean) => {
  const was = config.openToWork;
  config.openToWork = open;
  try {
    return renderPage();
  } finally {
    config.openToWork = was;
  }
};

it("open to work, the hire section sits between Claude and Get started and links out in new tabs", () => {
  const { container } = renderOpenToWork(true);
  const ids = [...container.querySelectorAll("section[id]")].map((s) => s.id);
  expect(ids.slice(ids.indexOf("claude"), ids.indexOf("claude") + 3)).toEqual([
    "claude",
    "hire",
    "get-started",
  ]);
  const hire = container.querySelector<HTMLElement>("#hire");
  if (!hire) throw new Error("no #hire section");
  expect(within(hire).getByRole("heading", { level: 2, name: "Hire me" })).toBeTruthy();
  const links = within(hire).getAllByRole("link");
  expect(links.map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
    ["CV ↗", "https://www.pawelkrystkiewicz.pl/cv"],
    ["LinkedIn ↗", "https://www.linkedin.com/in/pawelkrystkiewicz"],
    ["GitHub profile ↗", "https://github.com/pawelkrystkiewicz"],
  ]);
  for (const link of links) {
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener");
  }
});

it("open to work, a hero badge links to the hire section in the same tab", () => {
  const { container } = renderOpenToWork(true);
  const hero = container.querySelector("section");
  if (!hero) throw new Error("no hero");
  const badge = within(hero).getByRole("link", { name: "Author open to work" });
  expect(badge.getAttribute("href")).toBe("#hire");
  expect(badge.hasAttribute("target")).toBe(false);
  expect(container.querySelector(badge.getAttribute("href") ?? "")).not.toBeNull();
});

it("not open to work, the landing has no hire section and no hero badge", () => {
  const { container } = renderOpenToWork(false);
  expect(container.querySelector("#hire")).toBeNull();
  expect(container.querySelector('a[href="#hire"]')).toBeNull();
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

// Open to work, so the hire links and badge stay covered after the flag flips
it("every link and button, the footer's too, draws the --ring outline on keyboard focus", () => {
  const { container } = renderOpenToWork(true);
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

// LandingClient.spec covers each way the menu closes; this checks the real page's shape. Open to
// work, so the hire section counts too.
it("with the menu open, every landing section and hero part outside the header is inert", () => {
  const { container } = renderOpenToWork(true);
  const headerEl = container.querySelector("header");
  const hero = headerEl?.parentElement;
  const landing = container.querySelector(".landing");
  if (!headerEl || !hero || !landing) throw new Error("no header, hero or landing");
  const page = [
    ...[...hero.children].filter((el) => el !== headerEl),
    ...[...landing.children].filter((el) => el !== hero),
  ];
  expect(page.map((el) => el.id || el.tagName)).toEqual(
    expect.arrayContaining(["start", "components", "claude", "hire", "get-started", "FOOTER"]),
  );
  fireEvent.click(screen.getByRole("button", { name: "Menu" }));
  expect([...container.querySelectorAll("[inert]")]).toEqual(page);
  for (const el of [headerEl, hero, landing]) expect(el.closest("[inert]")).toBeNull();
  // The links and buttons under the menu are out of reach, the header's are not
  const focusable = [...container.querySelectorAll<HTMLElement>("a[href], button")];
  expect(focusable.filter((el) => !el.closest("header") && !el.closest("[inert]"))).toEqual([]);
  fireEvent.click(screen.getByRole("button", { name: "Menu" }));
  expect(container.querySelector("[inert]")).toBeNull();
});

// A screen reader may read "//" as "slash slash". The prefix stays on screen but out of what is
// read: hidden on its own, so the label after it is still read. Open to work: the whole page.
const LABELS = [
  "The default",
  "The fallback",
  "The configurator",
  "The design system",
  "The import",
  "install",
  "docs",
  "source",
  "for agents",
  "context7",
  "Library",
  "Tools",
  "Studio",
];

// What a screen reader reads of an element: its text without the aria-hidden parts
const spoken = (el: Element) => {
  const clone = el.cloneNode(true) as Element;
  for (const hidden of clone.querySelectorAll("[aria-hidden=true]")) hidden.remove();
  return clone.textContent;
};

it("each // label keeps its prefix on screen and hides only the prefix from screen readers", () => {
  const { container } = renderOpenToWork(true);
  const prefixes = [...container.querySelectorAll("[aria-hidden=true]")].filter(
    (el) => el.textContent === "// ",
  );
  const labels = prefixes.map((p) => p.parentElement as HTMLElement);
  expect(labels.map((l) => l.textContent)).toEqual(LABELS.map((l) => `// ${l}`));
  expect(labels.map(spoken)).toEqual(LABELS);
  expect(prefixes.every((p, i) => p === labels[i]?.firstChild)).toBe(true);
  // No other "//" anywhere on the page is read out
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const read: string[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.textContent?.includes("//") && !n.parentElement?.closest("[aria-hidden=true]"))
      read.push(n.textContent);
  }
  expect(read).toEqual([]);
});

// The rows' URLs keep their own path slashes; what goes is the "//" before each label
it("the get-started rows are named without their // prefix", () => {
  const { container } = renderPage();
  const getStarted = container.querySelector<HTMLElement>("#get-started");
  if (!getStarted) throw new Error("no #get-started section");
  const names: string[] = [];
  const collect = (name: string) => {
    names.push(name);
    return true;
  };
  within(getStarted).getAllByRole("button", { name: collect });
  within(getStarted).getAllByRole("link", { name: collect });
  expect(names).toEqual([
    "installbun add chunks-ui motion",
    "docsui-kit.chunk-creations.com",
    "sourcegithub.com/pawelkrystkiewicz/chunks-ui ↗",
    "for agentsui-kit.chunk-creations.com/llms.txt",
    "context7context7.com/pawelkrystkiewicz/chunks-ui ↗",
  ]);
});

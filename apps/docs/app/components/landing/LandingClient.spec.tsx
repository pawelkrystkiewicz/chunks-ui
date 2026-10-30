// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { type ReactNode, useState } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PRESETS } from "../../create/theme-model";
import { CopyRow, HeroCopy, MobileMenu, PresetGrid } from "./LandingClient";

const CMD = "bun add chunks-ui motion";
const MESSAGE = "Copied to clipboard";

beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

const click = (el: HTMLElement) =>
  act(async () => {
    fireEvent.click(el);
  });
const tick = (ms: number) => act(async () => void vi.advanceTimersByTime(ms));
const status = () => screen.getByRole("status");

it("HeroCopy announces the copy in a status region", async () => {
  render(<HeroCopy text={CMD} />);
  expect(status().textContent).toBe("");
  await click(screen.getByRole("button"));
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(CMD);
  expect(status().textContent).toBe(MESSAGE);
});

it("CopyRow announces the copy in a status region", async () => {
  render(<CopyRow text={CMD} className="" labelClassName="" />);
  await click(screen.getByRole("button"));
  expect(status().textContent).toBe(MESSAGE);
});

it("clears the status after 1.6s", async () => {
  render(<HeroCopy text={CMD} />);
  await click(screen.getByRole("button"));
  await tick(1599);
  expect(status().textContent).toBe(MESSAGE);
  await tick(1);
  expect(status().textContent).toBe("");
});

it("a second click restarts the 1.6s window", async () => {
  render(<HeroCopy text={CMD} />);
  const button = screen.getByRole("button");
  await click(button);
  await tick(1000);
  await click(button);
  await tick(1599);
  expect(status().textContent).toBe(MESSAGE);
  await tick(1);
  expect(status().textContent).toBe("");
});

it("clears the pending timer on unmount", async () => {
  const { unmount } = render(<HeroCopy text={CMD} />);
  await click(screen.getByRole("button"));
  expect(vi.getTimerCount()).toBe(1);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it("HeroCopy keeps the visible command in its accessible name", () => {
  render(<HeroCopy text={CMD} />);
  expect(screen.getByRole("button", { name: CMD })).toBeTruthy();
});

// The preset fonts are self-hosted (fonts/fonts.css): no stylesheet, and no request to Google.
it("PresetGrid loads no font stylesheet", () => {
  render(<PresetGrid />);
  expect(document.querySelector("link[rel='stylesheet']")).toBeNull();
  expect(document.querySelector("[href*='fonts.googleapis.com']")).toBeNull();
});

// fonts.css declares "<font> Aa" (A, a and space at 600) for the tiles' fonts; the full face is the
// fallback. The faces exist only at 600, so the span must stay font-semibold.
it("PresetGrid draws each tile's Aa from the preset font's Aa subset first", () => {
  render(<PresetGrid />);
  const tiles = document.querySelectorAll("[data-preset]");
  expect(tiles.length).toBe(PRESETS.length);
  PRESETS.forEach(({ theme }, i) => {
    const spans = [...(tiles[i]?.querySelectorAll("span[aria-hidden]") ?? [])];
    const aa = spans.find((s) => s.textContent === "Aa") as HTMLElement | undefined;
    // jsdom writes every quoted family name in double quotes
    expect(aa?.style.fontFamily, theme.fontHeading).toMatch(
      new RegExp(`^"${theme.fontHeading} Aa", "${theme.fontHeading}",`),
    );
    expect(aa?.classList.contains("font-semibold"), theme.fontHeading).toBe(true);
  });
});

// Named by content, never aria-label (see LandingPage.spec.tsx): the Aa glyph is hidden, a sr-only tail says where it goes.
it("PresetGrid tiles are named by preset and purpose", () => {
  render(<PresetGrid />);
  const tile = screen.getByRole("link", { name: /^Chunks.+ · r\d+ · h\d+\s?· open in Create$/ });
  expect(tile.hasAttribute("aria-label")).toBe(false);
  expect(tile.hasAttribute("title")).toBe(false);
});

// The landing's shape: the header holding the menu sits in the hero, among the hero's own parts
function Landing({ menu = true, link }: { menu?: boolean; link?: ReactNode }) {
  return (
    <div className="landing">
      <section>
        <div>Hero fade</div>
        <header>
          <a href="/">Home</a>
          {menu && <MobileMenu>{link ?? <a href="/docs">Docs</a>}</MobileMenu>}
        </header>
        <div>Hero</div>
      </section>
      <section>Quick start</section>
      <footer>Footer</footer>
    </div>
  );
}

const menuButton = () => screen.getByRole("button", { name: "Menu" });
const inert = () => [...document.querySelectorAll("[inert]")];
const PAGE = ["Hero fade", "Hero", "Quick start", "Footer"];

// A screen reader's virtual cursor walks what Tab cannot reach: the page under the menu leaves the
// accessibility tree, the header with the menu and its button stays in it.
it("the open menu makes every part of the landing outside its header inert", () => {
  const { container } = render(<Landing />);
  expect(inert()).toEqual([]);
  fireEvent.click(menuButton());
  expect(inert().map((el) => el.textContent)).toEqual(PAGE);
  expect(container.querySelector("header")?.closest("[inert]")).toBeNull();
  expect(container.querySelector("#landing-menu")?.closest("[inert]")).toBeNull();
});

it("closing the menu with its button removes inert", () => {
  render(<Landing />);
  fireEvent.click(menuButton());
  expect(inert().map((el) => el.textContent)).toEqual(PAGE);
  fireEvent.click(menuButton());
  expect(document.querySelector("#landing-menu")).toBeNull();
  expect(inert()).toEqual([]);
});

it("closing the menu with Escape removes inert", () => {
  render(<Landing />);
  fireEvent.click(menuButton());
  expect(inert().map((el) => el.textContent)).toEqual(PAGE);
  fireEvent.keyDown(window, { key: "Escape" });
  expect(document.querySelector("#landing-menu")).toBeNull();
  expect(inert()).toEqual([]);
});

it("growing the window past lg closes the menu and removes inert", () => {
  const LG = "(width >= 64rem)";
  const lg = Object.assign(new EventTarget(), { matches: false, media: LG });
  const { matchMedia } = window;
  window.matchMedia = (query) => (query === LG ? (lg as never) : matchMedia(query));
  try {
    render(<Landing />);
    fireEvent.click(menuButton());
    expect(inert().map((el) => el.textContent)).toEqual(PAGE);
    act(() => {
      lg.matches = true;
      lg.dispatchEvent(new Event("change"));
    });
    expect(document.querySelector("#landing-menu")).toBeNull();
    expect(inert()).toEqual([]);
  } finally {
    window.matchMedia = matchMedia;
  }
});

// Every menu link leaves the page: the route change unmounts the landing, its menu with it. The
// parts kept from the landing would come back without inert (React <Activity>, the bfcache).
it("following a menu link removes inert", () => {
  function Site() {
    const [path, setPath] = useState("/");
    if (path !== "/") return <main>Docs page</main>;
    const navigate = (e: { preventDefault: () => void }) => {
      e.preventDefault();
      setPath("/docs");
    };
    return (
      <Landing
        link={
          <a href="/docs" onClick={navigate}>
            Docs
          </a>
        }
      />
    );
  }
  render(<Site />);
  fireEvent.click(menuButton());
  const page = inert();
  expect(page.map((el) => el.textContent)).toEqual(PAGE);
  fireEvent.click(screen.getByRole("link", { name: "Docs" }));
  expect(screen.getByText("Docs page")).toBeTruthy();
  expect(page.filter((el) => el.hasAttribute("inert"))).toEqual([]);
});

it("unmounting the open menu removes inert from the page it leaves", () => {
  const { rerender } = render(<Landing />);
  fireEvent.click(menuButton());
  expect(inert().map((el) => el.textContent)).toEqual(PAGE);
  rerender(<Landing menu={false} />);
  expect(screen.getByText("Quick start")).toBeTruthy();
  expect(inert()).toEqual([]);
});

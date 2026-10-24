// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PRESETS } from "../../create/theme-model";
import { CopyRow, HeroCopy, PresetGrid } from "./LandingClient";

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

// fonts.css declares "<font> Aa" (A and a at 600) for the tiles' fonts; the full face is the fallback.
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
  });
});

// Named by content, never aria-label (see LandingPage.spec.tsx): the Aa glyph is hidden, a sr-only tail says where it goes.
it("PresetGrid tiles are named by preset and purpose", () => {
  render(<PresetGrid />);
  const tile = screen.getByRole("link", { name: /^Chunks.+ · r\d+ · h\d+\s?· open in Create$/ });
  expect(tile.hasAttribute("aria-label")).toBe(false);
  expect(tile.hasAttribute("title")).toBe(false);
});

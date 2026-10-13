// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LAYOUT_FONTS } from "../../layout-fonts";
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

// An "Aa"-only face has no unicode-range, so it would shadow the layout's full face of that family.
it("PresetGrid's Aa subset leaves out every family the layout loads in full", () => {
  const { container } = render(<PresetGrid />);
  const href = container.querySelector("link[rel='stylesheet']")?.getAttribute("href") ?? "";
  const families = new URL(href).searchParams.getAll("family").map((f) => f.replace(/:.*/, ""));
  expect(families.length).toBeGreaterThan(0);
  expect(families.filter((f) => f in LAYOUT_FONTS)).toEqual([]);
});

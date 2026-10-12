// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ThemeSidebar } from "./ThemeSidebar";
import { DEFAULT_THEME, type Oklch, ok } from "./theme-model";

function hueSlider(primary: Oklch) {
  const onChange = vi.fn();
  render(
    <ThemeSidebar
      theme={{ ...DEFAULT_THEME, primary }}
      onChange={onChange}
      onShuffle={() => {}}
      onReset={() => {}}
      onGetCode={() => {}}
    />,
  );
  const slider = screen.getByRole("slider", { name: "Primary hue" });
  const thumb = slider.closest<HTMLElement>("[data-index]");
  return { onChange, slider, thumb };
}

it("shows on the thumb the colour that leaving Ink gives", () => {
  // Hue 100 at Blue's lightness can't reach 4.5:1 with either text, so it is darkened
  const { thumb } = hueSlider({ l: 0.205, c: 0, h: 100 });
  expect(thumb?.style.background).toBe("oklch(0.552 0.2165 100)");
});

it("gives the colour the thumb shows once the hue moves", () => {
  const { onChange, slider } = hueSlider({ l: 0.205, c: 0, h: 100 });
  fireEvent.keyDown(slider, { key: "ArrowRight" });
  const [patch] = onChange.mock.lastCall ?? [];
  const { primary } = patch as { primary: Oklch };
  expect(primary).toEqual({ l: 0.552, c: 0.2165, h: 101 });
  cleanup();
  const { thumb } = hueSlider(primary);
  expect(thumb?.style.background).toBe(ok(primary.l, primary.c, primary.h));
});

it("shows a non-Ink primary on the thumb as it is, even at Blue's chroma", () => {
  const { thumb } = hueSlider({ l: 0.6048, c: 0.2165, h: 200 });
  expect(thumb?.style.background).toBe("oklch(0.6048 0.2165 200)");
});

it("starts from Blue's lightness again when the hue moves on from a darkened one", () => {
  const { onChange, slider } = hueSlider({ l: 0.552, c: 0.2165, h: 100 });
  fireEvent.keyDown(slider, { key: "Home" });
  expect(onChange).toHaveBeenLastCalledWith({ primary: { l: 0.56, c: 0.2165, h: 0 } });
});

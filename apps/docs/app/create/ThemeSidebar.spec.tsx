// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ThemeSidebar } from "./ThemeSidebar";
import { DEFAULT_THEME, type Oklch } from "./theme-model";

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

it("shows on the thumb the colour that leaving Ink gives, and gives it", () => {
  // Hue 100 at Blue's lightness can't reach 4.5:1 with either text, so it is darkened
  const { onChange, slider, thumb } = hueSlider({ l: 0.205, c: 0, h: 100 });
  expect(thumb?.style.background).toBe("oklch(0.552 0.2165 100)");
  fireEvent.keyDown(slider, { key: "ArrowRight" });
  expect(onChange).toHaveBeenLastCalledWith({ primary: { l: 0.552, c: 0.2165, h: 101 } });
});

it("starts from Blue's lightness again when the hue moves on from a darkened one", () => {
  const { onChange, slider } = hueSlider({ l: 0.552, c: 0.2165, h: 100 });
  fireEvent.keyDown(slider, { key: "Home" });
  expect(onChange).toHaveBeenLastCalledWith({ primary: { l: 0.56, c: 0.2165, h: 0 } });
});

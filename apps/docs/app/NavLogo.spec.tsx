// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { NavLogo } from "./NavLogo";

it("the home link is named by its content, Chunks UI, with no aria-label", () => {
  render(<NavLogo />);
  const link = screen.getByRole("link", { name: "Chunks UI" });
  expect(link.getAttribute("href")).toBe("/");
  expect(link.hasAttribute("aria-label")).toBe(false);
  expect(link.querySelectorAll("img[alt='']").length).toBe(2);
});

it("the name stays in the accessibility tree at narrow widths: sr-only, never hidden", () => {
  render(<NavLogo />);
  const name = screen.getByText("Chunks UI");
  expect(name.className).toContain("max-[calc(12.5rem+102px)]:sr-only");
  expect(name.className).not.toMatch(/(^|\s)(max-\S+:)?(hidden|invisible)/);
});

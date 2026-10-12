// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { LandingPage } from "./LandingPage";

it.each([
  ["Read the docs", "/getting-started"],
  ["Open Create", "/create"],
])("the %s CTA is a link with the contained primary Button colours", (name, href) => {
  render(<LandingPage />);
  const cta = screen.getByRole("link", { name });
  expect(cta.getAttribute("href")).toBe(href);
  expect([...cta.classList]).toEqual(
    expect.arrayContaining(["bg-primary", "text-primary-foreground"]),
  );
});

it("the Create section links to /create once, besides the preset tiles", () => {
  const { container } = render(<LandingPage />);
  const create = container.querySelector<HTMLElement>("#create");
  if (!create) throw new Error("no #create section");
  const links = [...create.querySelectorAll("a:not([aria-label^='Open Create with'])")];
  expect(links.map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
    ["Open Create", "/create"],
  ]);
});

it("every link and button, the footer's too, draws the --ring outline on keyboard focus", () => {
  const { container } = render(<LandingPage />);
  fireEvent.click(screen.getByRole("button", { name: "Menu" }));
  const focusable = [...container.querySelectorAll<HTMLElement>("a[href], button")];
  expect(focusable.length).toBeGreaterThan(30);
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
  const { container } = render(<LandingPage />);
  const frames = [
    ...container.querySelectorAll<HTMLElement>("a[aria-labelledby^='cat-'] > div[aria-hidden]"),
  ];
  expect(frames.length).toBeGreaterThan(0);
  for (const f of frames) expect(f.classList).toContain("[--ring:var(--l-lib-ring)]");
});

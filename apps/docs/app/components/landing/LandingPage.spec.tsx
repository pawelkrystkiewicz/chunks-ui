// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
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
  const links = within(create)
    .getAllByRole("link")
    .filter((a) => !a.getAttribute("aria-label")?.startsWith("Open Create with"));
  expect(links.map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
    ["Open Create", "/create"],
  ]);
});

// The footer keeps the browser's ring, which holds 3:1 on its flat black.
it("every link and button above the footer draws the --ring outline on keyboard focus", () => {
  const { container } = render(<LandingPage />);
  fireEvent.click(screen.getByRole("button", { name: "Menu" }));
  const focusable = [...container.querySelectorAll<HTMLElement>("a[href], button")].filter(
    (el) => !el.closest("footer"),
  );
  expect(focusable.length).toBeGreaterThan(30);
  const without = focusable
    .filter(
      (el) =>
        !el.classList.contains("focus-visible:outline-2") ||
        !el.classList.contains("focus-visible:outline-ring"),
    )
    .map((el) => el.getAttribute("aria-label") ?? el.textContent);
  expect(without).toEqual([]);
});

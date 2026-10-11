// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
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

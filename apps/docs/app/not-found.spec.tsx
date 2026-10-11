// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import NotFound from "./not-found";

it("tells the reader the page is missing and links back into the docs", () => {
  render(<NotFound />);

  expect(screen.getByRole("heading", { level: 1, name: "404: Page Not Found" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Go to Getting Started" }).getAttribute("href")).toBe(
    "/getting-started",
  );
});

// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { PaginationBasicExample, PaginationWithEllipsisExample } from "./Pagination";

it.each([
  ["PaginationBasicExample", PaginationBasicExample],
  ["PaginationWithEllipsisExample", PaginationWithEllipsisExample],
])("%s: a click on a page link stays on the page", (_, Example) => {
  render(<Example />);
  const links = screen.getAllByRole("link");
  expect(links.length).toBeGreaterThan(0);
  for (const link of links) {
    // Still a real link: focusable, with an href
    expect(link.getAttribute("href")).toBe("#");
    // fireEvent returns false when a handler called preventDefault
    expect(fireEvent.click(link), link.textContent ?? "").toBe(false);
  }
});

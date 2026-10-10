import { render } from "@testing-library/react";
import { Fragment, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { insetsWithin, renderFixture } from "../../VisualTest.utils";
import { Card } from "./index";

describe("Card", () => {
  it("default", async () => {
    const { fixture } = await renderFixture(
      <Card.Root style={{ width: 350 }}>
        <Card.Header>
          <Card.Title>Card Title</Card.Title>
          <Card.Description>Card description goes here.</Card.Description>
        </Card.Header>
        <Card.Content>
          <p>Card content body.</p>
        </Card.Content>
        <Card.Footer>
          <span className="text-muted-foreground text-sm">Footer</span>
        </Card.Footer>
      </Card.Root>,
    );
    await expect(fixture).toMatchScreenshot();
  });
});

describe("Card defaults", () => {
  it("has no box-shadow unless the consumer adds one", () => {
    const { getByTestId } = render(
      <>
        <Card.Root data-testid="plain">Plain</Card.Root>
        <Card.Root data-testid="raised" className="shadow-md">
          Raised
        </Card.Root>
      </>,
    );
    expect(getComputedStyle(getByTestId("plain")).boxShadow).toBe("none");
    expect(getComputedStyle(getByTestId("raised")).boxShadow).not.toBe("none");
  });
});

/** 6 spacing units at the default 4px `--spacing`. */
const SPACE = 24;

/** `expect.closeTo` digits: |actual − expected| < 0.05px. */
const PRECISION = 1;

const PARTS = {
  Header: (
    <Card.Header>
      <Card.Title data-marker>Title</Card.Title>
    </Card.Header>
  ),
  Content: (
    <Card.Content>
      <p data-marker>Body</p>
    </Card.Content>
  ),
  Footer: (
    <Card.Footer>
      <span data-marker>Footer</span>
    </Card.Footer>
  ),
} satisfies Record<string, ReactNode>;

type Part = keyof typeof PARTS;

const SUBSETS: Part[][] = [
  ["Header"],
  ["Content"],
  ["Footer"],
  ["Header", "Content"],
  ["Header", "Footer"],
  ["Content", "Footer"],
  ["Header", "Content", "Footer"],
];

describe("Card spacing", () => {
  it.each(SUBSETS.map((parts) => [parts.join(" + "), parts] as const))(
    "%s: 24px from every edge and 24px between parts",
    (_, parts) => {
      const { getByTestId } = render(
        <Card.Root data-testid="root" style={{ width: 350 }}>
          {parts.map((part) => (
            <Fragment key={part}>{PARTS[part]}</Fragment>
          ))}
        </Card.Root>,
      );
      const root = getByTestId("root");
      const markers = Array.from(root.querySelectorAll("[data-marker]"));
      expect(markers).toHaveLength(parts.length);
      const edge = SPACE + Number.parseFloat(getComputedStyle(root).borderTopWidth);
      const atEdge = expect.closeTo(edge, PRECISION);

      const first = insetsWithin(root, markers[0] as Element);
      const last = insetsWithin(root, markers[markers.length - 1] as Element);
      expect(first.top).toEqual(atEdge);
      expect(last.bottom).toEqual(atEdge);
      for (const marker of markers) {
        expect(insetsWithin(root, marker).left).toEqual(atEdge);
      }
      for (let i = 1; i < markers.length; i++) {
        const above = (markers[i - 1] as Element).getBoundingClientRect();
        const below = (markers[i] as Element).getBoundingClientRect();
        expect(below.top - above.bottom).toEqual(expect.closeTo(SPACE, PRECISION));
      }
    },
  );
});

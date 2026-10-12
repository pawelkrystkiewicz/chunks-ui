import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { contentSpan, type Dir, renderFixture } from "../../VisualTest.utils";
import { Checkbox } from "../checkbox";
import { Table } from "./index";

afterEach(() => {
  document.documentElement.removeAttribute("dir");
});

function SelectAll() {
  return (
    <Checkbox.Root aria-label="Select all">
      <Checkbox.Indicator />
    </Checkbox.Root>
  );
}

function renderTable(dir: Dir) {
  document.documentElement.dir = dir;
  return renderFixture(
    <div style={{ width: 360 }}>
      <Table.Root>
        <Table.Caption>Recent invoices</Table.Caption>
        <Table.Header>
          <Table.Row>
            <Table.Head data-testid="check-head">
              <SelectAll />
            </Table.Head>
            <Table.Head data-testid="head">Invoice</Table.Head>
            <Table.Head>Status</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell data-testid="check-cell">
              <Checkbox.Root aria-label="Select INV001" defaultChecked>
                <Checkbox.Indicator />
              </Checkbox.Root>
            </Table.Cell>
            <Table.Cell>INV001</Table.Cell>
            <Table.Cell>Paid</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>
              <Checkbox.Root aria-label="Select INV002">
                <Checkbox.Indicator />
              </Checkbox.Root>
            </Table.Cell>
            <Table.Cell>INV002</Table.Cell>
            <Table.Cell>Pending</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
    </div>,
  );
}

/** The inline extent of the text inside `el` */
function textSpan(el: Element, dir: Dir) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const { left, right } = range.getBoundingClientRect();
  return dir === "ltr" ? { start: left, end: right } : { start: -right, end: -left };
}

describe.each(["ltr", "rtl"] as const)("Table in %s", (dir) => {
  it("with a checkbox column", async () => {
    const { fixture } = await renderTable(dir);
    await expect(fixture).toMatchScreenshot();
  });

  it("aligns a header's text to the cell's inline start", async () => {
    await renderTable(dir);
    const head = screen.getByTestId("head");
    expect(textSpan(head, dir).start).toBeCloseTo(contentSpan(head, dir).start, 0);
  });

  it("drops only the inline-end padding of a cell holding a checkbox", async () => {
    await renderTable(dir);
    for (const cell of [screen.getByTestId("check-head"), screen.getByTestId("check-cell")]) {
      const { paddingInlineStart, paddingInlineEnd } = getComputedStyle(cell);
      expect({ paddingInlineStart, paddingInlineEnd }).toEqual({
        paddingInlineStart: "8px",
        paddingInlineEnd: "0px",
      });
    }
  });
});

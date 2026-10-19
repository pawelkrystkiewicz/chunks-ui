import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { contentSpan, describeDirs, inlineSpan, renderFixture } from "../../VisualTest.utils";
import { Checkbox } from "../checkbox";
import { Table } from "./index";

function SelectAll() {
  return (
    <Checkbox.Root aria-label="Select all">
      <Checkbox.Indicator />
    </Checkbox.Root>
  );
}

function renderTable() {
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

describeDirs("Table in %s", (dir) => {
  it("with a checkbox column", async () => {
    const { fixture } = await renderTable();
    await expect(fixture).toMatchScreenshot();
  });

  // Needs the header cell wider than its text: true at width 360 with three columns
  it("aligns a header's text to the cell's inline start", async () => {
    await renderTable();
    const head = screen.getByTestId("head");
    const text = document.createRange();
    text.selectNodeContents(head);
    expect(inlineSpan(text, dir).start).toBeCloseTo(contentSpan(head, dir).start, 0);
  });

  it("drops only the inline-end padding of a cell holding a checkbox", async () => {
    await renderTable();
    for (const cell of [screen.getByTestId("check-head"), screen.getByTestId("check-cell")]) {
      const { paddingInlineStart, paddingInlineEnd } = getComputedStyle(cell);
      expect(paddingInlineEnd).toBe("0px");
      expect(paddingInlineStart).not.toBe("0px");
    }
  });
});

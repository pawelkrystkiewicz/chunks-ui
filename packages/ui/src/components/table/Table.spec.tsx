import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
import { Table } from "./Table";

afterEach(cleanup);

describe("Table", () => {
  it("renders all sub-components", () => {
    render(
      <Table.Root data-testid="root">
        <Table.Caption>Invoice list</Table.Caption>
        <Table.Header>
          <Table.Row>
            <Table.Head>Name</Table.Head>
            <Table.Head>Amount</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>INV001</Table.Cell>
            <Table.Cell>$250</Table.Cell>
          </Table.Row>
        </Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.Cell>Total</Table.Cell>
            <Table.Cell>$250</Table.Cell>
          </Table.Row>
        </Table.Footer>
      </Table.Root>,
    );
    expect(screen.getByTestId("root")).toBeInTheDocument();
    expect(screen.getByText("Invoice list")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByText("INV001")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  it("merges custom className on each sub-component", () => {
    render(
      <Table.Root className="custom-root" data-testid="root">
        <Table.Caption className="custom-caption" data-testid="caption">
          Cap
        </Table.Caption>
        <Table.Header className="custom-header" data-testid="header">
          <Table.Row className="custom-row" data-testid="row">
            <Table.Head className="custom-head" data-testid="head">
              H
            </Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body className="custom-body" data-testid="body">
          <Table.Row>
            <Table.Cell className="custom-cell" data-testid="cell">
              C
            </Table.Cell>
          </Table.Row>
        </Table.Body>
        <Table.Footer className="custom-footer" data-testid="footer">
          <Table.Row>
            <Table.Cell>F</Table.Cell>
          </Table.Row>
        </Table.Footer>
      </Table.Root>,
    );
    expect(screen.getByTestId("root")).toHaveClass("custom-root");
    expect(screen.getByTestId("caption")).toHaveClass("custom-caption");
    expect(screen.getByTestId("header")).toHaveClass("custom-header");
    expect(screen.getByTestId("row")).toHaveClass("custom-row");
    expect(screen.getByTestId("head")).toHaveClass("custom-head");
    expect(screen.getByTestId("body")).toHaveClass("custom-body");
    expect(screen.getByTestId("cell")).toHaveClass("custom-cell");
    expect(screen.getByTestId("footer")).toHaveClass("custom-footer");
  });

  it("supports data-state=selected on rows", () => {
    render(
      <Table.Root>
        <Table.Body>
          <Table.Row data-state="selected" data-testid="selected-row">
            <Table.Cell>Selected</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>,
    );
    expect(screen.getByTestId("selected-row")).toHaveAttribute("data-state", "selected");
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <Table.Root>
        <Table.Caption>Test table</Table.Caption>
        <Table.Header>
          <Table.Row>
            <Table.Head>Column</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Value</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

"use client";

import { Table } from "chunks-ui";
import { Container } from "@/components";

const invoices = [
  { id: "INV001", status: "Paid", method: "Credit Card", amount: "$250.00" },
  { id: "INV002", status: "Pending", method: "PayPal", amount: "$150.00" },
  { id: "INV003", status: "Unpaid", method: "Bank Transfer", amount: "$350.00" },
  { id: "INV004", status: "Paid", method: "Credit Card", amount: "$450.00" },
  { id: "INV005", status: "Paid", method: "PayPal", amount: "$550.00" },
];

export function TableBasicExample() {
  return (
    <Container centered={false}>
      <Table.Root>
        <Table.Caption>A list of your recent invoices.</Table.Caption>
        <Table.Header>
          <Table.Row>
            <Table.Head className="w-[100px]">Invoice</Table.Head>
            <Table.Head>Status</Table.Head>
            <Table.Head>Method</Table.Head>
            <Table.Head className="text-right">Amount</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {invoices.map((inv) => (
            <Table.Row key={inv.id}>
              <Table.Cell className="font-medium">{inv.id}</Table.Cell>
              <Table.Cell>{inv.status}</Table.Cell>
              <Table.Cell>{inv.method}</Table.Cell>
              <Table.Cell className="text-right">{inv.amount}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.Cell colSpan={3}>Total</Table.Cell>
            <Table.Cell className="text-right">$1,750.00</Table.Cell>
          </Table.Row>
        </Table.Footer>
      </Table.Root>
    </Container>
  );
}

export function TableMinimalExample() {
  return (
    <Container centered={false}>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Name</Table.Head>
            <Table.Head>Role</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Alice Johnson</Table.Cell>
            <Table.Cell>Admin</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Bob Smith</Table.Cell>
            <Table.Cell>Member</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
    </Container>
  );
}

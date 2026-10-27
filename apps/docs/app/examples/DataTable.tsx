"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  columnFilteringFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  flexRender,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  type SortingState,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { Button, Checkbox, Input, Table } from "chunks-ui";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { Container } from "@/components";

type Payment = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};

const data: Payment[] = [
  { id: "inv_01", amount: 316, status: "success", email: "alice@example.com" },
  { id: "inv_02", amount: 242, status: "success", email: "bob@example.com" },
  { id: "inv_03", amount: 837, status: "processing", email: "charlie@example.com" },
  { id: "inv_04", amount: 874, status: "success", email: "diana@example.com" },
  { id: "inv_05", amount: 721, status: "failed", email: "eve@example.com" },
  { id: "inv_06", amount: 150, status: "pending", email: "frank@example.com" },
  { id: "inv_07", amount: 490, status: "success", email: "grace@example.com" },
  { id: "inv_08", amount: 203, status: "processing", email: "hank@example.com" },
];

// TanStack Table v9 has only the features registered here. "auto" sorting and filtering pick
// from the registered functions: text or alphanumeric for the emails, includesString for the filter
const features = tableFeatures({
  columnFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { text: sortFn_text, alphanumeric: sortFn_alphanumeric },
});

const columns: ColumnDef<typeof features, Payment>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox.Root
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(checked) => table.toggleAllPageRowsSelected(!!checked)}
        aria-label="Select all"
      >
        <Checkbox.Indicator />
      </Checkbox.Root>
    ),
    cell: ({ row }) => (
      <Checkbox.Root
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(!!checked)}
        aria-label="Select row"
      >
        <Checkbox.Indicator />
      </Checkbox.Root>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <span className="capitalize">{row.getValue("status")}</span>,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <Button
        variant="text"
        color="secondary"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Email
        <ArrowUpDown className="ms-1 size-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="lowercase">{row.getValue("email")}</span>,
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-end">Amount</div>,
    cell: ({ row }) => {
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(row.getValue("amount"));
      return <div className="text-end font-medium">{formatted}</div>;
    },
  },
];

export function DataTableExample() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});

  const table = useTable({
    features,
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, rowSelection },
    // TanStack shows 10 rows per page by default; 5 gives the 8 rows two pages
    initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
  });

  const emailCol = table.getColumn("email");
  const search = (emailCol?.getFilterValue() as string) ?? "";
  const onClear = () => emailCol?.setFilterValue("");

  return (
    <Container centered={false}>
      <div className="flex w-full flex-col gap-4">
        <Input
          placeholder="Filter emails..."
          aria-label="Filter emails"
          value={search}
          onChange={(event) => emailCol?.setFilterValue(event.target.value)}
          onClear={onClear}
          className="max-w-sm"
        />
        {/* if you want to have border outside table you must apply it like here */}
        <div className="overflow-hidden rounded-md border border-border">
          <Table.Root>
            <Table.Header>
              {table.getHeaderGroups().map((headerGroup) => (
                <Table.Row key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <Table.Head key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </Table.Head>
                  ))}
                </Table.Row>
              ))}
            </Table.Header>
            <Table.Body>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <Table.Row key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                    {row.getAllCells().map((cell) => (
                      <Table.Cell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))
              ) : (
                <Table.Row>
                  <Table.Cell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Root>
        </div>
        <div className="flex items-center justify-end gap-2">
          <div className="flex-1 text-muted-foreground text-sm">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </Container>
  );
}

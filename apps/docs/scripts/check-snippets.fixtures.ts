/**
 * Names a docs block uses without defining them: state of the component around it, data from an
 * earlier block on the same page, or helpers the page leaves to the reader. Keyed by the page's
 * path under `content/`. Each entry is the body of a `declare global` block, in scope only while
 * that page is checked, so give names the type a reader's own code would have (a `useState`
 * setter is `React.Dispatch<React.SetStateAction<T>>`). See `check-snippets.ts`.
 */

/** A router link that takes `to`, as React Router's does */
const LINK = `const Link: (props: { to: string } & React.ComponentProps<"a">) => React.ReactElement;`;

const state = (name: string, type: string) =>
  `const ${name}: ${type}; const set${name[0]?.toUpperCase()}${name.slice(1)}: React.Dispatch<React.SetStateAction<${type}>>;`;

const TABLE = `import("@tanstack/react-table")`;

export const fixtures: Record<string, string> = {
  "components/breadcrumb.mdx": LINK,
  "components/pagination.mdx": LINK,
  "components/combobox.mdx": `
    type Option = { value: string; label: string };
    const fruits: Option[];
    const frameworks: Option[];
    /** A chip's item in Combobox.Chips */
    const item: Option;
  `,
  "components/data-table.mdx": `
    type Payment = { id: string; amount: number; status: string; email: string };
    const data: Payment[];
    const columns: ${TABLE}.ColumnDef<Payment>[];
    ${state("sorting", `${TABLE}.SortingState`)}
    ${state("columnFilters", `${TABLE}.ColumnFiltersState`)}
    ${state("rowSelection", `${TABLE}.RowSelectionState`)}
    const table: ${TABLE}.Table<Payment>;
  `,
  "components/loader.mdx": "const loading: boolean;",
  "components/menu.mdx": `${state("showGrid", "boolean")} ${state("theme", "string")}`,
  "components/tabs.mdx": state("tab", "string"),
  "components/textarea.mdx": state("bio", "string | undefined"),
  "components/theme-toggle.mdx": state("theme", `"light" | "dark"`),
  "components/toast.mdx": `
    const add: ReturnType<typeof Toast.useToast>["add"];
    const restoreMessage: () => void;
    const analytics: { track: (event: string, data: Record<string, unknown>) => void };
    const uploadFile: () => Promise<{ name: string }>;
    const TriggerButton: () => React.ReactElement;
  `,
  "components/toggle-group.mdx": state("value", "string[]"),
  "utilities.mdx": `
    const isActive: boolean;
    const disabled: boolean;
    /** Defined in the block before the one that uses it */
    const FavoriteToggle: typeof import("@base-ui/react/toggle").Toggle;
  `,
};

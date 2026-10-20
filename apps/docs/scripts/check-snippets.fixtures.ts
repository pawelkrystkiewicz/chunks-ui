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
  "components/tabs.mdx": `
    ${state("tab", "string")}
    /** The CSP block: the request's nonce and the app it wraps */
    const nonce: string;
    const App: () => React.ReactElement;
  `,
  "components/textarea.mdx": state("bio", "string | undefined"),
  "components/theme-toggle.mdx": state("theme", `"light" | "dark"`),
  "components/toast.mdx": `
    const add: ReturnType<typeof Toast.useToast>["add"];
    const restoreMessage: () => void;
    const hasUnsaved: boolean;
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

/**
 * Files that blocks of one page import from each other (`./panels`, `./master-detail`), keyed by the
 * page and then by the file the import resolves to, next to the page's blocks. Each block is checked
 * on its own, so the block that imports such a file sees these declarations instead. They are
 * declared by hand: keep them in step with the blocks that define them, because a rename there is
 * not noticed here. They are `.ts` files of `export declare`, not `.d.ts`, so a mistake in a
 * declaration (a misspelt type, say) is an error, which `skipLibCheck` would hide in a `.d.ts`. See
 * `check-snippets.ts`.
 */
export const modules: Record<string, Record<string, string>> = {
  // `app/panels.ts` and `app/master-detail.tsx` of the cookie recipe
  "components/resizable.mdx": {
    "panels.ts": `export declare const PANELS: import("chunks-ui").ResizablePanelConfig[];`,
    "master-detail.ts": `export declare function MasterDetail(props: { defaultLayout: import("chunks-ui").ResizableLayout }): import("react").ReactElement;`,
  },
};

import type { TypeField } from "nextra/tsdoc";
import { describe, expect, it } from "vitest";
import {
  diffOutputs,
  extractBlocks,
  type GenerateDefinition,
  propsMarkdown,
  renderTable,
} from "./generate-props";

const call = (code: string) => [
  "<TSDoc",
  "  definition={generateDefinition({",
  "    code: `",
  code,
  "`",
  "  })}",
  "/>",
];

describe("extractBlocks", () => {
  it("groups the calls by the nearest heading above them, skipping headings in code fences", () => {
    const source = [
      "import { generateDefinition, TSDoc } from 'nextra/tsdoc'",
      "",
      "# Tabs",
      "## Props",
      "### Tabs.Contents",
      ...call("export default A"),
      "```bash",
      "# not a heading",
      "```",
      ...call("export default B"),
      "### Tabs.Animate",
      ...call("export default C"),
    ].join("\n");
    expect(extractBlocks("components/tabs.mdx", source)).toEqual({
      title: "Tabs",
      sections: [
        {
          heading: "Tabs.Contents",
          headingLine: 5,
          calls: [
            { line: 7, code: "\nexport default A\n" },
            { line: 17, code: "\nexport default B\n" },
          ],
        },
        {
          heading: "Tabs.Animate",
          headingLine: 23,
          calls: [{ line: 25, code: "\nexport default C\n" }],
        },
      ],
    });
  });

  it("does not read a call shown inside a code fence", () => {
    const source = ["# Page", "````mdx", ...call("export default A"), "````"].join("\n");
    expect(extractBlocks("page.mdx", source)).toEqual({ title: "Page", sections: [] });
  });

  it.each([
    ["a ``` fence", ["```tsx", "const a = 1"], 3],
    ["a ~~~ fence", ["", "~~~", "const a = 1"], 4],
    // A closing fence shorter than the opening one does not close it
    ["a fence closed by a shorter one", ["````mdx", ...call("export default A"), "```"], 3],
    ["a fence opened after a call", [...call("export default A"), "```", "text"], 10],
  ])("throws when the page ends inside %s, naming its line", (_, tail, line) => {
    const source = ["# Page", "## Props", ...tail].join("\n");
    expect(() => extractBlocks("components/x.mdx", source)).toThrow(
      new RegExp(`^content/components/x\\.mdx:${line} - code fence left open`),
    );
  });

  it.each([
    ["another option", "generateDefinition({ code: `export default A`, exportName: 'A' })"],
    ["a string code", "generateDefinition({ code: 'export default A' })"],
    // biome-ignore lint/suspicious/noTemplateCurlyInString: the MDX text of a template with a placeholder
    ["a template with ${}", "generateDefinition({ code: `export default ${name}` })"],
    ["a variable", "generateDefinition(args)"],
  ])("throws on %s, naming the file and line", (_, text) => {
    const source = ["# Page", "## Props", `<TSDoc definition={${text}} />`].join("\n");
    expect(() => extractBlocks("components/x.mdx", source)).toThrow(
      /^content\/components\/x\.mdx:3 - unreadable generateDefinition call/,
    );
  });
});

describe("extractBlocks, a second call on a line", () => {
  const one = "<TSDoc definition={generateDefinition({ code: `export default A` })} />";
  const two = "<TSDoc definition={generateDefinition({ code: `export default B` })} />";

  it.each([
    ["two calls on one line", ["# Page", "## Props", one + two], 3],
    [
      "a call that starts on the last line of the one before",
      [
        "# Page",
        "## Props",
        "<TSDoc definition={generateDefinition({",
        "code: `export default A`",
        `})} />${two}`,
      ],
      5,
    ],
  ])("throws on %s, naming the file and the line", (_, lines, line) => {
    expect(() => extractBlocks("components/x.mdx", lines.join("\n"))).toThrow(
      new RegExp(`^content/components/x\\.mdx:${line} - a second generateDefinition call`),
    );
  });

  it("reads two calls on separate lines", () => {
    const { sections } = extractBlocks("x.mdx", ["# Page", "## Props", one, two].join("\n"));
    expect(sections.map((section) => section.calls.map((call) => call.line))).toEqual([[3, 4]]);
  });
});

describe("renderTable", () => {
  it("renders defaults, required props, deprecations and cells that need escaping", () => {
    const entries: TypeField[] = [
      {
        name: "variant",
        type: '"a" | "b"',
        optional: true,
        tags: { default: '"a"', remarks: "`x`" },
      },
      { name: "value", type: "string", description: "The value.\nRequired." },
      { name: "onClear", type: "() => void", optional: true, description: "Runs | on clear." },
      // biome-ignore lint/suspicious/noTemplateCurlyInString: a TypeScript template literal type
      { name: "size", type: "`${number}px`", optional: true, tags: { defaultValue: "`12px`" } },
      {
        name: "label",
        type: "string",
        optional: true,
        description: "Old.",
        tags: { deprecated: "Use `labels`." },
      },
      { name: "previous", type: "string", tags: { default: '"Previous"' } },
    ];
    expect(renderTable(entries)).toEqual([
      "| Prop | Type | Default | Description |",
      "| --- | --- | --- | --- |",
      '| `variant` | `"a" \\| "b"` | `"a"` |  |',
      "| `value` | `string` | required | The value. Required. |",
      "| `onClear` | `() => void` | — | Runs \\| on clear. |",
      // biome-ignore lint/suspicious/noTemplateCurlyInString: a TypeScript template literal type
      "| `size` | `` `${number}px` `` | `` `12px` `` |  |",
      "| `label` | `string` | — | Old. Deprecated: Use `labels`. |",
      '| `previous` | `string` | `"Previous"` |  |',
    ]);
  });
});

describe("propsMarkdown", () => {
  const field = (name: string): TypeField => ({ name, type: "boolean", optional: true });
  const fake: GenerateDefinition = ({ code }) => ({ name: "Props", entries: [field(code.trim())] });
  const source = [
    "# Button",
    "## Props",
    ...call("loading"),
    ...call("disabled"),
    "## Labels",
    ...call("labels"),
  ].join("\n");

  it("writes a table per call, under one ## section per heading", () => {
    expect(propsMarkdown("components/button.mdx", source, fake)).toBe(
      [
        "<!-- Generated by apps/docs/scripts/generate-props.ts from apps/docs/content/components/button.mdx. Do not edit: run `bun run build --filter=chunks-ui && bun run --cwd apps/docs generate:props`. -->",
        "",
        "# Button props",
        "",
        "## Props",
        "",
        "| Prop | Type | Default | Description |",
        "| --- | --- | --- | --- |",
        "| `loading` | `boolean` | — |  |",
        "",
        "| Prop | Type | Default | Description |",
        "| --- | --- | --- | --- |",
        "| `disabled` | `boolean` | — |  |",
        "",
        "## Labels",
        "",
        "| Prop | Type | Default | Description |",
        "| --- | --- | --- | --- |",
        "| `labels` | `boolean` | — |  |",
        "",
      ].join("\n"),
    );
  });

  it("returns null for a page without calls", () => {
    expect(propsMarkdown("index.mdx", "# Home\n\nText.", fake)).toBeNull();
  });

  it.each([
    ["no heading at all", [...call("loading")], 2],
    ["a heading only below the call", [...call("loading"), "# Button"], 2],
  ])("throws, naming the file and line, on a call with %s above it", (_, lines, line) => {
    expect(() => propsMarkdown("components/x.mdx", lines.join("\n"), fake)).toThrow(
      new RegExp(
        `^content/components/x\\.mdx:${line} - no heading above the generateDefinition call`,
      ),
    );
  });

  it("throws, naming the file, on a page with only ## and ### headings and no title", () => {
    const lines = ["## Props", "### Button", ...call("loading")];
    expect(() => propsMarkdown("components/x.mdx", lines.join("\n"), fake)).toThrow(
      /^content\/components\/x\.mdx - no "# " heading to title its props/,
    );
  });

  it("throws, naming the file and line, on a result with no props table", () => {
    const signature: GenerateDefinition = () => ({
      name: "fn",
      signatures: [{ params: [], returns: { type: "void" } }],
    });
    expect(() => propsMarkdown("components/button.mdx", source, signature)).toThrow(
      /^content\/components\/button\.mdx:4 - generateDefinition returned no props table/,
    );
  });
});

describe("diffOutputs", () => {
  it("reports changed, missing and extra files", () => {
    const generated = new Map([
      ["components/a.md", "same"],
      ["components/b.md", "new"],
      ["components/c.md", "added"],
    ]);
    const onDisk = new Map([
      ["components/a.md", "same"],
      ["components/b.md", "old"],
      ["components/gone.md", "stale"],
    ]);
    expect(diffOutputs(generated, onDisk)).toEqual([
      { path: "components/b.md", problem: "changed" },
      { path: "components/c.md", problem: "missing" },
      { path: "components/gone.md", problem: "extra" },
    ]);
    expect(diffOutputs(generated, new Map(generated))).toEqual([]);
  });
});

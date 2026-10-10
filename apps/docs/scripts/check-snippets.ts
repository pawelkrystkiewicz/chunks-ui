/// <reference types="@types/bun" />
/**
 * Type-checks every ```tsx block in `content/**\/*.mdx` against the built `chunks-ui` types,
 * with the docs tsconfig. Each block is an in-memory module; errors point at the .mdx line.
 * Needs `chunks-ui` built first (the docs `check-types` script runs after Turbo's `^build`).
 * A block opens with ```tsx (meta and indentation are fine) and closes with a bare ```. A tsx
 * block in a ~~~ or ```` fence, or one left open, fails the check rather than going unread.
 *
 * What a block can use without importing it:
 * - every value export of `chunks-ui` and `react`, as the pages assume after their "Import" block;
 * - lucide-react icons by their `<Name>Icon` export (`PlusIcon`, `SearchIcon`);
 * - the page's fixtures in `check-snippets.fixtures.ts`: state, data and helpers that the block
 *   takes from the component around it or from an earlier block on the page.
 * A block's own imports and declarations take precedence over all of these.
 *
 * How a block is wrapped: if its code after the imports starts with `<` or `{/*`, it is JSX
 * children and goes inside a fragment, so sibling elements and JSX comments are fine. Otherwise it
 * is module code (types, functions, statements, one JSX expression) and is checked as written.
 *
 * Run: bun run check:snippets
 */
import { join } from "node:path";
import ts from "typescript";
import { fixtures } from "./check-snippets.fixtures";

const DOCS_DIR = join(import.meta.dirname, "..");
const CONTENT_DIR = join(DOCS_DIR, "content");
// In-memory files live here so that module resolution starts from the docs app
const VIRTUAL_DIR = join(DOCS_DIR, ".snippets");
// A .d.ts, so skipLibCheck skips it and every page's program reuses it unchecked
const GLOBALS_FILE = join(VIRTUAL_DIR, "globals.d.ts");
const FIXTURES_FILE = join(VIRTUAL_DIR, "fixtures.ts");

type Line = { text: string; mdxLine: number | null };
type Snippet = { file: string; page: string; lines: Line[] };

/** A ```tsx fence, with or without meta (`title="…"`) and indentation; not ```tsx-foo */
const TSX_OPEN = /^\s*```tsx(?=\s|$)/;
/** A tsx fence with another marker or length, which the extractor doesn't read */
const OTHER_TSX_OPEN = /^\s*(`{4,}|~{3,})\s*tsx(?=\s|$)/;
/** A tsx fence inside a blockquote, which the extractor doesn't read either */
const QUOTED_TSX_OPEN = /^\s*>[\s>]*(`{3,}|~{3,})\s*tsx(?=\s|$)/;
const FENCE = /^\s*(`{3,}|~{3,})/;
const CLOSE = /^\s*(`{3,}|~{3,})\s*$/;
const IMPORT_START = /^\s*import\b/;
const IMPORT_END = /(\bfrom\s+|^\s*import\s+)["'][^"']+["'];?\s*$/;

/** Splits a block into its leading `import` lines and the rest. */
function splitImports(code: Line[]) {
  let i = 0;
  while (i < code.length) {
    const text = code[i]?.text ?? "";
    if (text.trim() === "") {
      i++;
    } else if (IMPORT_START.test(text)) {
      while (i < code.length && !IMPORT_END.test(code[i]?.text ?? "")) i++;
      i++;
    } else {
      break;
    }
  }
  return { imports: code.slice(0, i), body: code.slice(i) };
}

function toSnippet(page: string, index: number, code: Line[]): Snippet {
  const { imports, body } = splitImports(code);
  const first = body.find((line) => line.text.trim() !== "")?.text.trim() ?? "";
  const isJsx = first.startsWith("<") || first.startsWith("{/*");
  const wrapped: Line[] = isJsx
    ? [{ text: "const __snippet = (<>", mdxLine: null }, ...body, { text: "</>);", mdxLine: null }]
    : body;
  return {
    file: join(VIRTUAL_DIR, page, `${index}.tsx`),
    page,
    lines: [...imports, ...wrapped, { text: "export {};", mdxLine: null }],
  };
}

/**
 * Finds the tsx blocks of one page. Fences of other languages are skipped whole, so a tsx fence
 * shown inside a ````md block is not read. Reports what it can't read rather than skipping it.
 */
export function extractBlocks(page: string, source: string) {
  const snippets: Snippet[] = [];
  const errors: string[] = [];
  const at = (index: number) => `content/${page}:${index + 1}`;
  let block: { start: number; lines: Line[] } | null = null;
  // The marker (``` or ~~~, any length) of the non-tsx fence we are in
  let other: string | null = null;

  for (const [i, text] of source.split("\n").entries()) {
    if (block) {
      if (/^\s*```\s*$/.test(text)) {
        snippets.push(toSnippet(page, snippets.length + 1, block.lines));
        block = null;
      } else if (FENCE.test(text)) {
        errors.push(`${at(i)} - fence line inside the tsx block from line ${block.start + 1}`);
      } else {
        block.lines.push({ text, mdxLine: i + 1 });
      }
    } else if (other) {
      const marker = CLOSE.exec(text)?.[1];
      if (marker && marker[0] === other[0] && marker.length >= other.length) other = null;
    } else if (QUOTED_TSX_OPEN.test(text)) {
      errors.push(`${at(i)} - the check doesn't read tsx blocks in a blockquote`);
    } else if (OTHER_TSX_OPEN.test(text)) {
      errors.push(`${at(i)} - the check reads tsx blocks only in a \`\`\` fence`);
      other = FENCE.exec(text)?.[1] ?? null;
    } else if (TSX_OPEN.test(text)) {
      block = { start: i, lines: [] };
    } else {
      other = FENCE.exec(text)?.[1] ?? null;
    }
  }
  if (block) errors.push(`${at(block.start)} - the tsx block never closes`);
  return { snippets, errors };
}

/**
 * The names a page's fixtures declare that none of its blocks uses (as a whole word), and no other
 * fixture of the page refers to.
 */
export function unusedFixtures(fixtureText: string, blocks: string[]) {
  const source = ts.createSourceFile("fixtures.ts", fixtureText, ts.ScriptTarget.Latest);
  const names = source.statements.flatMap((statement) =>
    ts.isVariableStatement(statement)
      ? statement.declarationList.declarations.map((declaration) =>
          declaration.name.getText(source),
        )
      : ts.isTypeAliasDeclaration(statement) || ts.isFunctionDeclaration(statement)
        ? [statement.name?.getText(source) ?? ""]
        : [],
  );
  const uses = (text: string, name: string) =>
    text.match(new RegExp(`\\b${name}\\b`, "g"))?.length ?? 0;
  return names.filter(
    (name) => uses(fixtureText, name) < 2 && !blocks.some((block) => uses(block, name) > 0),
  );
}

async function extractSnippets() {
  const pages = new Map<string, Snippet[]>();
  const errors: string[] = [];
  for (const page of [...new Bun.Glob("**/*.mdx").scanSync(CONTENT_DIR)].sort()) {
    const blocks = extractBlocks(page, await Bun.file(join(CONTENT_DIR, page)).text());
    errors.push(...blocks.errors);
    if (blocks.snippets.length > 0) pages.set(page, blocks.snippets);
  }
  return { pages, errors };
}

function compilerOptions(): ts.CompilerOptions {
  const { config, error } = ts.readConfigFile(join(DOCS_DIR, "tsconfig.json"), ts.sys.readFile);
  if (error) throw new Error(ts.flattenDiagnosticMessageText(error.messageText, "\n"));
  const { options } = ts.parseJsonConfigFileContent(config, ts.sys, DOCS_DIR);
  return {
    ...options,
    // Blocks are browser code: no Bun or test globals (Bun's global `Loader` hides chunks-ui's)
    types: [],
    // A block is a piece of an app, so unused names and the global `React` are normal
    noUnusedLocals: false,
    noUnusedParameters: false,
    allowUmdGlobalAccess: true,
    incremental: false,
    noEmit: true,
  };
}

// Parsed files, shared by every program so that each page reuses what earlier pages parsed
const sourceFiles = new Map<string, ts.SourceFile>();

function createHost(options: ts.CompilerOptions, files: Map<string, string>) {
  const host = ts.createCompilerHost(options);
  const { getSourceFile } = host;
  host.getSourceFile = (fileName, languageVersion, ...rest) => {
    const text = files.get(fileName);
    const cached = sourceFiles.get(fileName);
    if (cached && (text === undefined || cached.text === text)) return cached;
    const source =
      text === undefined
        ? getSourceFile(fileName, languageVersion, ...rest)
        : ts.createSourceFile(fileName, text, languageVersion, true);
    if (source) sourceFiles.set(fileName, source);
    return source;
  };
  host.fileExists = (fileName) => files.has(fileName) || ts.sys.fileExists(fileName);
  host.readFile = (fileName) => files.get(fileName) ?? ts.sys.readFile(fileName);
  return host;
}

const GLOBAL_MODULES = [
  { alias: "UI", specifier: "chunks-ui", include: () => true },
  { alias: "R", specifier: "react", include: () => true },
  { alias: "Icons", specifier: "lucide-react", include: (name: string) => /.Icon$/.test(name) },
];
const GLOBAL_IMPORTS = GLOBAL_MODULES.map(
  ({ alias, specifier }) => `import type * as ${alias} from "${specifier}";`,
).join("\n");

/**
 * Declares the value exports of GLOBAL_MODULES as globals. The first module wins a name, and
 * names the DOM already has (`ViewTransition`) are left to the DOM.
 */
function globalsFile(options: ts.CompilerOptions) {
  const files = new Map([[GLOBALS_FILE, GLOBAL_IMPORTS]]);
  const program = ts.createProgram([GLOBALS_FILE], options, createHost(options, files));
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(GLOBALS_FILE);
  if (!source) throw new Error("Globals file missing");
  const imports = source.statements.filter(ts.isImportDeclaration);

  const declared = new Set(
    checker.getSymbolsInScope(source, ts.SymbolFlags.Value).map((symbol) => symbol.getName()),
  );
  const declarations: string[] = [];
  GLOBAL_MODULES.forEach(({ alias, specifier, include }, i) => {
    const moduleSymbol = checker.getSymbolAtLocation(imports[i]?.moduleSpecifier as ts.Node);
    if (!moduleSymbol) throw new Error(`Cannot resolve "${specifier}"; build chunks-ui first`);
    for (const exported of checker.getExportsOfModule(moduleSymbol)) {
      const name = exported.getName();
      const target =
        exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
      if (declared.has(name) || name === "default" || !include(name)) continue;
      if (!(target.flags & ts.SymbolFlags.Value)) continue;
      declared.add(name);
      declarations.push(`  const ${name}: typeof ${alias}.${name};`);
    }
  });
  const text = [GLOBAL_IMPORTS, "declare global {", ...declarations, "}", "export {};"].join("\n");
  return { program, text };
}

function format(diagnostic: ts.Diagnostic, snippets: Map<string, Snippet>, page: string) {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n  ");
  const { file, start } = diagnostic;
  if (!file || start === undefined) return `TS${diagnostic.code}: ${message}`;
  const { line, character } = file.getLineAndCharacterOfPosition(start);
  const snippet = snippets.get(file.fileName);
  const where = snippet
    ? `content/${snippet.page}:${snippet.lines[line]?.mdxLine ?? "?"}:${character + 1}`
    : `check-snippets.fixtures.ts, "${page}" (${file.fileName}:${line + 1})`;
  return `${where} - TS${diagnostic.code}: ${message}`;
}

// Not on import, so the spec can test extractBlocks
if (import.meta.main) {
  const options = compilerOptions();
  const { pages, errors: fenceErrors } = await extractSnippets();
  const globals = globalsFile(options);
  const errors = new Set<string>(fenceErrors);
  let previous = globals.program;
  let blocks = 0;

  for (const page of Object.keys(fixtures)) {
    const blocks = pages.get(page);
    if (!blocks) {
      errors.add(`check-snippets.fixtures.ts: no tsx blocks in content/${page}`);
      continue;
    }
    const code = blocks.map((block) => block.lines.map((line) => line.text).join("\n"));
    for (const name of unusedFixtures(fixtures[page] ?? "", code)) {
      errors.add(`check-snippets.fixtures.ts: no block in content/${page} uses "${name}"`);
    }
  }

  // One program per page, so that a page's fixtures are in scope only for its own blocks
  for (const [page, snippets] of pages) {
    const files = new Map([
      [GLOBALS_FILE, globals.text],
      [FIXTURES_FILE, `declare global {\n${fixtures[page] ?? ""}\n}\nexport {};`],
    ]);
    for (const snippet of snippets) {
      files.set(snippet.file, snippet.lines.map((line) => line.text).join("\n"));
    }
    const program = ts.createProgram(
      [...files.keys()],
      options,
      createHost(options, files),
      previous,
    );
    const byFile = new Map(snippets.map((snippet) => [snippet.file, snippet]));
    for (const diagnostic of ts.getPreEmitDiagnostics(program)) {
      if (!diagnostic.file || files.has(diagnostic.file.fileName)) {
        errors.add(format(diagnostic, byFile, page));
      }
    }
    previous = program;
    blocks += snippets.length;
  }

  for (const error of errors) console.error(error);
  console.log(`Checked ${blocks} tsx blocks on ${pages.size} pages: ${errors.size} errors.`);
  process.exit(errors.size > 0 ? 1 : 0);
}

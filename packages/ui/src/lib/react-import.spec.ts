/// <reference types="vite/client" />
import { expect, it } from "vitest";

const sources = import.meta.glob<string>(["../**/*.{ts,tsx}", "!../**/*.spec.{ts,tsx}"], {
  query: "?raw",
  import: "default",
  eager: true,
});

// A default import of `react` or `react-dom` (a subpath counts) lands in dist/index.d.ts as is,
// and a consumer on `moduleResolution: node10` without `esModuleInterop` cannot compile it
// (TS1259, #463). Named and namespace imports compile everywhere.
const defaultReactImport =
  /^import\s+(?:type\s+)?[A-Za-z_$][\w$]*\s*(?:,\s*(?:\{[^}]*\}|\*\s+as\s+[\w$]+))?\s*from\s*(['"])react(?:-dom)?(?:\/[^'"]*)?\1/gm;

const fix =
  "import the React types by name; a default import makes the typings fail on node10 without esModuleInterop (#463)";

function defaultReactImports(file: string, src: string) {
  return Array.from(src.matchAll(defaultReactImport), (m) => {
    const line = src.slice(0, m.index).split("\n").length;
    return `${file}:${line} ${m[0].split("\n")[0]}`;
  });
}

it("matches a default import from react or react-dom, value or type, alone or mixed", () => {
  const failing = [
    'import React from "react";',
    'import type React from "react";',
    'import React, { useState } from "react";',
    'import type React, { type FC } from "react";',
    'import ReactDOM from "react-dom";',
    'import type ReactDOM from "react-dom";',
    'import ReactDOM, { createPortal } from "react-dom";',
    'import type ReactDOM, { type Container } from "react-dom";',
    'import jsx from "react/jsx-runtime";',
    'import ReactDOMClient from "react-dom/client";',
    "import React from 'react';",
    'import React, {\n  useEffect,\n  useState,\n} from "react";',
  ];
  for (const src of failing) {
    expect(defaultReactImports("x.tsx", src), src).toHaveLength(1);
  }
});

it("passes named, namespace and other-package imports", () => {
  const passing = [
    'import { useState } from "react";',
    'import type { FC } from "react";',
    'import * as React from "react";',
    'import { createPortal } from "react-dom";',
    'import type { Root } from "react-dom/client";',
    'import * as ReactDOM from "react-dom";',
    'import {\n  useEffect,\n  useState,\n} from "react";',
    "import { useState } from 'react';",
    'import { Combobox } from "@base-ui/react/combobox";',
    'import clsx from "clsx";',
    'import useAria from "react-aria";',
  ];
  for (const src of passing) {
    expect(defaultReactImports("x.tsx", src), src).toEqual([]);
  }
});

it("names the file, the line and the import", () => {
  const src =
    '"use client";\n\nimport { cn } from "./cn";\nimport React, {\n  useState,\n} from "react";\n';
  expect(defaultReactImports("../components/x/X.tsx", src)).toEqual([
    "../components/x/X.tsx:4 import React, {",
  ]);
});

it("imports React by name or as a namespace in every source file", () => {
  const files = Object.keys(sources);
  expect(files).toEqual(
    expect.arrayContaining(["../components/combobox/Combobox.tsx", "./use-motion.ts"]),
  );
  expect(files.filter((f) => /\.spec\.tsx?$/.test(f))).toEqual([]);
  const found = Object.entries(sources).flatMap(([file, src]) => defaultReactImports(file, src));
  expect(found, fix).toEqual([]);
});

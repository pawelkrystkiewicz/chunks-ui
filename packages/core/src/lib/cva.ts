import { cva as cvaBase } from "class-variance-authority";
import type { ClassValue } from "clsx";

// Why `ClassProp` is copied here: cva exposes it only through the `./types` entry of its exports
// map, which node10 resolution (`moduleResolution: "node"`) cannot see, so an import of that
// entry in the typings fails with TS2307. A `//` comment, so that none of this reaches the typings.
/** cva's `ClassProp`, declared here so the emitted typings never import cva's `./types` subpath. */
export type ClassProp =
  | { class: ClassValue; className?: never }
  | { class?: never; className: ClassValue }
  | { class?: never; className?: never };

/** What cva's function for the schema `T` takes: the variant props, `class` and `className`. */
type CvaProps<T> = Parameters<ReturnType<typeof cvaBase<T>>>[0];

type VariantKeys<Props> = Exclude<keyof NonNullable<Props>, "class" | "className">;

/**
 * Keep this a local, non-exported mapped type: `VariantProps` or `Omit` here brings the
 * `class-variance-authority/types` import back into the emitted typings.
 */
type VariantsOf<Props> = [VariantKeys<Props>] extends [never]
  ? unknown
  : { [Key in VariantKeys<Props>]?: NonNullable<Props>[Key] };

/**
 * cva typed through the local `ClassProp`; import this instead of cva's own `cva`.
 * `cva.spec.ts` pins the types to cva's; `check:dist` fails on a cva subpath in the typings.
 */
export function cva<T>(base?: ClassValue, config?: Parameters<typeof cvaBase<T>>[1]) {
  return cvaBase(base, config) as (props?: VariantsOf<CvaProps<T>> & ClassProp) => string;
}

import { cva as cvaBase } from "class-variance-authority";
import type { ClassValue } from "clsx";

/**
 * cva's `ClassProp`, copied. cva exposes it only through the `./types` entry of its exports map,
 * which node10 resolution (`moduleResolution: "node"`) cannot see, so an import of that entry in
 * the typings fails with TS2307.
 */
export type ClassProp =
  | { class: ClassValue; className?: never }
  | { class?: never; className: ClassValue }
  | { class?: never; className?: never };

/** What cva's function for the schema `T` takes: the variant props, `class` and `className`. */
type CvaProps<T> = Parameters<ReturnType<typeof cvaBase<T>>>[0];

type VariantKeys<Props> = Exclude<keyof NonNullable<Props>, "class" | "className">;

/**
 * The variant props among a cva function's props: everything but `class` and `className`.
 * `unknown` when there are none, so that `& ClassProp` leaves `ClassProp` alone. Keep it a local,
 * non-exported mapped type: written with `VariantProps` or `Omit`, the `class-variance-authority/types`
 * import comes back, because tsc keeps an alias it can reach and prints cva's `ClassProp` inside
 * its argument.
 */
type VariantsOf<Props> = [VariantKeys<Props>] extends [never]
  ? unknown
  : { [Key in VariantKeys<Props>]?: NonNullable<Props>[Key] };

/**
 * cva, with its result typed through the `ClassProp` above instead of cva's own. TypeScript
 * writes the inferred type of every exported variants function into the typings, and cva's type
 * names `ClassProp` through the `./types` entry. Use this in place of cva's `cva`.
 */
export function cva<T>(base?: ClassValue, config?: Parameters<typeof cvaBase<T>>[1]) {
  return cvaBase(base, config) as (props?: VariantsOf<CvaProps<T>> & ClassProp) => string;
}

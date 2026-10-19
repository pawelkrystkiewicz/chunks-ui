"use client";

import type { ComponentRenderFn, HTMLProps } from "@base-ui/react/types";
import { useRender } from "@base-ui/react/use-render";
import type { JSX, ReactElement, Ref } from "react";

/** A Base UI part's `render` prop: an element, or a function of the props and the part's state. */
export type PartRenderProp<State> = ReactElement | ComponentRenderFn<HTMLProps, State> | undefined;

/**
 * Renders a part's own element (a `span` by default, or `tag`) through a consumer's `render` prop,
 * as Base UI would. For parts that render their element themselves, inside Base UI's `render`, so
 * the consumer's `render` keeps the part's props, classes and ref.
 *
 * The anonymous wrapper around a function `render` hides Base UI's dev warning for
 * `render={SomeComponent}` (a component where a function belongs).
 */
export function useRenderPart<State>(
  render: PartRenderProp<State>,
  state: State,
  ref: Ref<HTMLElement>,
  props: Record<string, unknown>,
  tag: keyof JSX.IntrinsicElements = "span",
) {
  return useRender({
    defaultTagName: tag,
    render: typeof render === "function" ? (renderProps) => render(renderProps, state) : render,
    ref,
    props,
  });
}

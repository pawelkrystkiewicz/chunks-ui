"use client";

import type { ComponentRenderFn, HTMLProps } from "@base-ui/react/types";
import { useRender } from "@base-ui/react/use-render";
import type { ReactElement, Ref } from "react";

/** A Base UI part's `render` prop: an element, or a function of the props and the part's state. */
export type PartRenderProp<State> = ReactElement | ComponentRenderFn<HTMLProps, State> | undefined;

/**
 * Renders a part's own element (a `span` by default) through a consumer's `render` prop, as
 * Base UI would. For parts that render their element themselves, inside Base UI's `render`, so
 * the consumer's `render` keeps the part's props, classes and ref.
 */
export function useRenderPart<State>(
  render: PartRenderProp<State>,
  state: State,
  ref: Ref<HTMLElement>,
  props: Record<string, unknown>,
) {
  return useRender({
    defaultTagName: "span",
    render: typeof render === "function" ? (renderProps) => render(renderProps, state) : render,
    ref,
    props,
  });
}

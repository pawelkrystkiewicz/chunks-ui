import { useMDXComponents as getDocsMDXComponents } from "nextra-theme-docs";
import type { ComponentProps } from "react";

const docsComponents = getDocsMDXComponents();

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

/** Markdown headings use the display font (Outfit); body text stays Manrope. */
function withDisplayFont(tag: HeadingTag) {
  const Heading = docsComponents[tag];
  return function DisplayHeading({ className, ...props }: ComponentProps<typeof Heading>) {
    // Footnotes pass exactly "sr-only", which Nextra swaps for its own class
    const classes = className === "sr-only" ? className : `font-display ${className ?? ""}`.trim();
    return <Heading className={classes} {...props} />;
  };
}

const headings = {
  h1: withDisplayFont("h1"),
  h2: withDisplayFont("h2"),
  h3: withDisplayFont("h3"),
  h4: withDisplayFont("h4"),
  h5: withDisplayFont("h5"),
  h6: withDisplayFont("h6"),
};

export function useMDXComponents(components?: Record<string, unknown>) {
  return {
    ...docsComponents,
    ...headings,
    ...(components as Record<string, React.ComponentType>),
  };
}

import { useMDXComponents as getMDXComponents } from "../mdx-components";

const { h1: H1, a: A } = getMDXComponents();

export const metadata = { title: "Page not found | Chunks UI" };

export default function NotFound() {
  // Nextra renders the navbar, this page and the footer as sibling children of <body>, stacked. While
  // <body> holds this page (`body:has(&)`) it becomes a full-height flex column and the page grows
  // into the space the navbar and footer leave, so no footer height has to be kept in sync here.
  // ponytail: rests on two assumptions. (a) Nextra 4.6 puts no wrapper between <body> and this page;
  // if an upgrade adds one, `grow` has no flex parent and the 404 falls back to its content height
  // (no scroll). (b) This page unmounts on client navigation; with Next's `cacheComponents` on, old
  // route trees stay in the DOM in a hidden <Activity>, so `body:has(&)` keeps matching after leaving
  // the 404 and narrows the docs layout.
  return (
    <div className="flex grow flex-col items-center justify-center gap-5 px-4 text-center [body:has(&)]:flex [body:has(&)]:min-h-dvh [body:has(&)]:flex-col">
      <H1>404: Page Not Found</H1>
      <p>This page doesn't exist. It may have moved, or the link has a typo.</p>
      <A href="/getting-started">Go to Getting Started</A>
    </div>
  );
}

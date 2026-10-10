import { useMDXComponents as getMDXComponents } from "../mdx-components";

const { h1: H1, a: A } = getMDXComponents();

export const metadata = { title: "Page not found | Chunks UI" };

export default function NotFound() {
  return (
    <div className="flex h-[calc(100dvh-var(--nextra-navbar-height))] flex-col items-center justify-center gap-5 px-4 text-center">
      <H1>404: Page Not Found</H1>
      <p>This page doesn't exist. It may have moved, or the link has a typo.</p>
      <A href="/getting-started">Go to Getting Started</A>
    </div>
  );
}

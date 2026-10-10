import { generateStaticParamsFor, importPage } from "nextra/pages";
import { useMDXComponents as getMDXComponents } from "../../mdx-components";

export const generateStaticParams = generateStaticParamsFor("mdxPath");

/**
 * Every docs page is prerendered, so unknown paths go straight to the static not-found page.
 * Rendering one at request time fails on Vercel: the MDX TSDoc tables read `tsconfig.json`,
 * which isn't deployed with the function, so the site answered 500 instead of 404.
 */
export const dynamicParams = false;

export async function generateMetadata(props: { params: Promise<{ mdxPath?: string[] }> }) {
  const params = await props.params;
  const { metadata } = await importPage(params.mdxPath);
  return metadata;
}

const Wrapper = getMDXComponents().wrapper;

export default async function Page(props: { params: Promise<{ mdxPath?: string[] }> }) {
  const params = await props.params;
  const result = await importPage(params.mdxPath);
  const { default: MDXContent, toc, metadata, ...rest } = result;
  return (
    <Wrapper toc={toc} metadata={metadata} {...rest}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  );
}

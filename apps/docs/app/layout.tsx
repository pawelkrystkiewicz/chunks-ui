import { Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import { Footer, Layout, Navbar } from "nextra-theme-docs";
import "nextra-theme-docs/style.css";
import "../globals.css";
import Image from "next/image";

export const metadata = {
  title: "Chunks",
  description: "UI library",
};

const LOGO_SIZE = 30;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap"
          precedence="default"
        />
        <Layout
          navbar={
            <Navbar
              logo={
                <div className="flex flex-nowrap items-center gap-2">
                  <Image
                    src="/logo.svg"
                    alt={metadata.title}
                    width={LOGO_SIZE}
                    height={LOGO_SIZE}
                  />
                  <b>{metadata.title}</b>
                </div>
              }
            />
          }
          pageMap={await getPageMap()}
          footer={<Footer />}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}

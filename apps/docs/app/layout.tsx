import { Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import { Footer, Layout, Navbar } from "nextra-theme-docs";
import "nextra-theme-docs/style.css";
import "../globals.css";
import Image from "next/image";

export const metadata = {
  title: "Chunks UI",
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
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&family=Outfit:wght@400..800&family=Fira+Code:wght@300..700&display=swap"
          precedence="default"
        />
        <Layout
          navbar={
            <Navbar
              logo={
                <div className="flex flex-nowrap items-center gap-2">
                  {/* Nextra marks dark theme with a `dark` class on <html> */}
                  <Image
                    src="/logo.svg"
                    alt={metadata.title}
                    width={LOGO_SIZE}
                    height={LOGO_SIZE}
                    className="[.dark_&]:hidden"
                  />
                  <Image
                    src="/logo-dark-mode.svg"
                    alt={metadata.title}
                    width={LOGO_SIZE}
                    height={LOGO_SIZE}
                    className="hidden [.dark_&]:block"
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

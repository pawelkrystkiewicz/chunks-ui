import { Head, Search } from "nextra/components";
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
          // Nextra names the search box only by its placeholder, which not every screen reader
          // reads as a label, and the theme switch by the current theme alone ("Light"), with its
          // purpose only in a title. Neither has a prop for the name; these two props set it.
          search={<Search aria-label="Search documentation" />}
          themeSwitch={{ light: "Light theme", dark: "Dark theme", system: "System theme" }}
          // Base of the "Edit this page" and feedback links; Nextra appends the file path
          docsRepositoryBase="https://github.com/pawelkrystkiewicz/chunks-ui/tree/master/apps/docs"
          footer={<Footer />}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}

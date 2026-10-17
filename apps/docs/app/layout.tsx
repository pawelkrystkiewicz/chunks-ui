import { Head, Search } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import { Footer, Layout, Navbar, ThemeSwitch } from "nextra-theme-docs";
import "nextra-theme-docs/style.css";
import "../globals.css";
import Image from "next/image";
import { HydrationMarker } from "./HydrationMarker";
import { LAYOUT_FONTS_HREF } from "./layout-fonts";

export const metadata = {
  title: "Chunks UI",
  description: "UI library",
};

const LOGO_SIZE = 30;
const REPO = "https://github.com/pawelkrystkiewicz/chunks-ui";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <link rel="stylesheet" href={LAYOUT_FONTS_HREF} precedence="default" />
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
              projectLink={REPO}
            >
              <ThemeSwitch lite />
            </Navbar>
          }
          pageMap={await getPageMap()}
          // Nextra names the search box only by its placeholder, which not every screen reader
          // reads as a label, and the theme switch by the current theme alone ("Light"). The
          // Search `aria-label` passes through to the input. `themeSwitch` sets the visible text
          // of the option and button ("Light theme" etc.), which also becomes the sidebar switch's
          // accessible name; the navbar's `lite` switch shows only an icon, so its Select's
          // `title="Change theme"` names it.
          search={<Search aria-label="Search documentation" />}
          themeSwitch={{ light: "Light theme", dark: "Dark theme", system: "System theme" }}
          // Base of the "Edit this page" and feedback links; Nextra appends the file path
          docsRepositoryBase={`${REPO}/tree/master/apps/docs`}
          footer={<Footer />}
        >
          {children}
        </Layout>
        <HydrationMarker />
      </body>
    </html>
  );
}

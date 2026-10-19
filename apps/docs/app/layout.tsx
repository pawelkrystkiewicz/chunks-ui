import { Head, Search } from "nextra/components";
import { GitHubIcon } from "nextra/icons";
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
              // The landing's name for its GitHub link; Nextra's default icon says "Project repository"
              projectIcon={<GitHubIcon height="24" aria-label="GitHub repository" />}
            >
              {/* Nextra draws the icon at 12px; 24px matches the GitHub icon beside it */}
              <ThemeSwitch lite className="*:size-6" />
            </Navbar>
          }
          pageMap={await getPageMap()}
          // Nextra names the search box only by its placeholder, which not every screen reader
          // reads as a label, and a full theme switch by the current theme alone ("Light"). The
          // Search `aria-label` passes through to the input. `themeSwitch` sets the text of the
          // options and of a full switch ("Light theme" etc.), which names it: Nextra renders one
          // in the footer of pages without a sidebar. The navbar's switch is `lite` (icon only):
          // the Select's `title="Change theme"` names it. globals.css hides the copies in the
          // sidebar and mobile menu footers.
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

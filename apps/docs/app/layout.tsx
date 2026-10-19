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
                  {/* One line or none: wrapped, it spills out of the 64px navbar. Nextra's padding,
                      gaps and three icon controls take 7rem + 72px, the mark, gap and name 5.4rem +
                      30px. Below their sum, as at 390px wide with a 32px default font, only the
                      mark shows, with the name as its alt text.
                      ponytail: the sum is measured on Nextra 4.6's navbar; a change to its padding,
                      gaps or controls moves it. */}
                  <b className="whitespace-nowrap max-[calc(12.5rem+102px)]:hidden">
                    {metadata.title}
                  </b>
                </div>
              }
              projectLink={REPO}
              // The landing's name for its GitHub link; Nextra's default icon says "Project repository"
              projectIcon={<GitHubIcon height="24" aria-label="GitHub repository" />}
            >
              {/* Nextra draws the icon at 12px. 24px matches the GitHub icon beside it, set in px
                  like that icon's height, so the two still match with a larger default font. */}
              <ThemeSwitch lite className="*:size-[24px]" />
            </Navbar>
          }
          pageMap={await getPageMap()}
          // Nextra names the search box only by its placeholder, which not every screen reader
          // reads as a label. The Search `aria-label` passes through to the input. `themeSwitch`
          // sets the text of the theme options ("Light theme" etc.). The navbar's switch, the one
          // globals.css leaves on screen, is `lite` (icon only): the Select's
          // `title="Change theme"` names it.
          // ponytail: that name leaves out the current theme, which only the opened list shows.
          // The full copies globals.css hides were the only switches whose name carried it
          // ("Light theme").
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

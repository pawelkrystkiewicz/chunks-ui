import { Head, Search } from "nextra/components";
import { GitHubIcon } from "nextra/icons";
import { getPageMap } from "nextra/page-map";
import { Footer, Layout, Navbar, ThemeSwitch } from "nextra-theme-docs";
import "nextra-theme-docs/style.css";
import "../globals.css";
import { HydrationMarker } from "./HydrationMarker";
import { LAYOUT_FONTS_HREF } from "./layout-fonts";
import { NavLogo } from "./NavLogo";

export const metadata = {
  title: "Chunks UI",
  description: "UI library",
};

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
              // Nextra's link says aria-label="Home page" over the visible name; NavLogo is ours
              logo={<NavLogo />}
              logoLink={false}
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

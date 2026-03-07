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
        <Layout
          navbar={
            <Navbar
              logo={
                <div className="flex items-center gap-2 flex-nowrap">
                  <Image src="/logo.svg" alt="Chunks" width={LOGO_SIZE} height={LOGO_SIZE} />
                  <b>Chunks</b>
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

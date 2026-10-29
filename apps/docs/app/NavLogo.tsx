import Image from "next/image";
import Link from "next/link";

const LOGO_SIZE = 30;
const NAME = "Chunks UI";

// Our own home link: Nextra's hard-codes aria-label="Home page", which hides the visible name
// (WCAG 2.5.3). Here the link's name is its content. The `x:` classes are copied from the link Nextra draws.
// ponytail: they work only while Nextra's build still emits them (the app's Tailwind ignores `x:`);
// if Nextra stops, the link silently loses its flex, hover and focus styles.
export function NavLogo() {
  return (
    <Link
      href="/"
      className="x:flex x:items-center x:gap-2 x:transition-opacity x:focus-visible:nextra-focus x:hover:opacity-75"
    >
      {/* Nextra marks dark theme with a `dark` class on <html>; the images are decorative */}
      <Image
        src="/logo-small.svg"
        alt=""
        width={LOGO_SIZE}
        height={LOGO_SIZE}
        className="[.dark_&]:hidden"
      />
      <Image
        src="/logo-small-dark-mode.svg"
        alt=""
        width={LOGO_SIZE}
        height={LOGO_SIZE}
        className="hidden [.dark_&]:block"
      />
      {/* One line or none: wrapped, it spills out of the 64px navbar. Nextra's padding, gaps and
          three icon controls take 7rem + 72px, the mark, gap and name 5.4rem + 30px. Below their
          sum, as at 390px wide with a 32px default font, only the mark shows and the name turns
          sr-only, so the link keeps its name.
          ponytail: the sum is measured on Nextra 4.6's navbar; a change to its padding, gaps or
          controls moves it. */}
      <b className="whitespace-nowrap max-[calc(12.5rem+102px)]:sr-only">{NAME}</b>
    </Link>
  );
}

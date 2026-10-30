// Server component: interactive parts live in ./LandingClient.
// chunks-ui is a client bundle, so only its components render here; its helpers come from chunks-ui/utils.

import { CopyButton } from "chunks-ui";
import { buttonVariants, cn } from "chunks-ui/utils";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "nextra/components";
import { GitHubIcon } from "nextra/icons";
import { type ComponentProps, Fragment, type ReactNode } from "react";
import {
  FeedbackPreview,
  InputsPreview,
  OverlaysPreview,
  PickersPreview,
  SelectionPreview,
  StructurePreview,
} from "./ComponentPreviews";
import { FOCUS_RING, FOCUS_RING_INSET, ICON_BUTTON } from "./focus";
import { ApiArt, HeroStack, ScopeArt, SizeArt } from "./Illustrations";
import {
  CopyRow,
  HeroCopy,
  MobileMenu,
  PresetGrid,
  SpringList,
  ThemeButton,
} from "./LandingClient";

const INSTALL = "bun add chunks-ui motion";
const GITHUB = "https://github.com/pawelkrystkiewicz/chunks-ui";
const CONTEXT7 = "https://context7.com/pawelkrystkiewicz/chunks-ui";
const DOCS = "/getting-started";
const COMPONENTS = "/components";

const NAV = [
  { label: "Docs", href: DOCS },
  { label: "Components", href: COMPONENTS },
  { label: "Create", href: "/create" },
  { label: "llms.txt", href: "/llms.txt" },
];

type Tier = "core" | "extended";

/** Showcased components by category. Every count on the page derives from this list. */
const CATEGORIES: {
  title: string;
  tag: string;
  href: string;
  items: Record<string, Tier>;
  note?: string;
  preview: ReactNode;
}[] = [
  {
    title: "Inputs",
    tag: "INPUTS",
    href: COMPONENTS,
    items: {
      Button: "core",
      Input: "core",
      Textarea: "core",
      "Number Field": "extended",
      Field: "core",
      ClearButton: "core",
    },
    preview: <InputsPreview />,
  },
  {
    title: "Selection",
    tag: "SELECTION",
    href: "/components/checkbox",
    items: {
      Checkbox: "core",
      Radio: "core",
      Switch: "core",
      ToggleGroup: "extended",
      Slider: "extended",
    },
    preview: <SelectionPreview />,
  },
  {
    title: "Pickers",
    tag: "PICKERS",
    href: "/components/select",
    items: { Select: "core", Combobox: "core", Calendar: "extended", DatePicker: "extended" },
    note: "Select and Combobox are separate components with focused APIs.",
    preview: <PickersPreview />,
  },
  {
    title: "Overlays",
    tag: "OVERLAYS",
    href: "/components/dialog",
    items: { Dialog: "core", Drawer: "core", Popover: "core", Tooltip: "core", Menu: "extended" },
    note: "Placement and flipping handled by Floating UI.",
    preview: <OverlaysPreview />,
  },
  {
    title: "Navigation and layout",
    tag: "STRUCTURE",
    href: "/components/tabs",
    items: {
      Tabs: "core",
      Accordion: "extended",
      Card: "core",
      Separator: "core",
      "Scroll Area": "extended",
    },
    preview: <StructurePreview />,
  },
  {
    title: "Feedback and display",
    tag: "FEEDBACK",
    href: "/components/toast",
    items: {
      Toast: "extended",
      Progress: "extended",
      Loader: "core",
      Avatar: "core",
      Chip: "core",
    },
    preview: <FeedbackPreview />,
  },
];

const tally = (tiers: Tier[]) => {
  const core = tiers.filter((t) => t === "core").length;
  return { core, extended: tiers.length - core };
};
const TOTAL = tally(CATEGORIES.flatMap((c) => Object.values(c.items)));

const WRAP = "mx-auto max-w-[1200px] px-[clamp(22px,4vw,40px)]";
const CELL =
  "flex min-w-0 flex-col gap-3 border-(--l-line) border-e border-b px-7 pt-6 pb-8 text-(--l-fg) transition-colors duration-300 ease-in-out hover:bg-(--l-card)";
const TEXT_LINK = `inline-flex items-center gap-2 font-semibold text-(--l-fg) text-[14px] transition-colors duration-250 hover:text-primary-text ${FOCUS_RING}`;

/** Internal routes go through next/link; files and external URLs stay plain anchors. */
function Href({ href, ...props }: ComponentProps<"a"> & { href: string }) {
  if (href.startsWith("http")) return <a href={href} target="_blank" rel="noopener" {...props} />;
  if (href.endsWith(".txt")) return <a href={href} {...props} />;
  return <Link href={href} {...props} />;
}

function Logo() {
  return (
    <Image
      src="/logo-small-dark-mode.svg"
      alt=""
      width={28}
      height={28}
      className="size-7 flex-none"
    />
  );
}

// A contained primary Button's classes on a link: Base UI's Button is for actions, not navigation.
// Height and radius match HeroCopy, the CTA's neighbour in the hero.
function Cta({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cn(buttonVariants(), "h-11 rounded-lg", className)}>
      {children}
      <ArrowRight className="size-4" />
    </Link>
  );
}

function SectionHead({
  eyebrow,
  title,
  accent,
  link,
}: {
  eyebrow: string;
  title: string;
  accent: string;
  link?: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
      <div className="flex flex-col">
        <span className="font-mono text-(--l-muted) text-[11px] uppercase tracking-[.1em]">
          {eyebrow}
        </span>
        <h2 className="mt-2.5 text-balance font-display font-semibold text-(--l-fg) text-[clamp(36px,5vw,56px)] leading-[1.02] tracking-[-.045em]">
          {title} <em className="text-primary-text not-italic">{accent}</em>
        </h2>
      </div>
      {link}
    </div>
  );
}

/** Hairline grid: each cell draws its end and bottom border; the frame hides the outer end edge. */
function Grid({ className, children }: { className: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden border-(--l-line) border-t">
      <div className={`-me-px grid grid-cols-1 ${className}`}>{children}</div>
    </div>
  );
}

function CellMeta({
  left,
  right,
  decorative,
}: {
  left: string;
  right: string;
  decorative?: boolean;
}) {
  return (
    <span
      aria-hidden={decorative || undefined}
      className="flex justify-between gap-2 font-mono text-(--l-muted) text-[10px] tracking-[.1em]"
    >
      <span>{left}</span>
      <span>{right}</span>
    </span>
  );
}

function CellText({ title, body, meta }: { title: string; body: string; meta: string[] }) {
  return (
    <>
      <h3 className="font-display font-semibold text-(--l-fg) text-[20px] leading-tight tracking-[-.02em]">
        {title}
      </h3>
      <p className="text-pretty text-(--l-muted) text-[14px] leading-normal">{body}</p>
      <span className="mt-auto flex flex-wrap gap-2 pt-1 font-mono text-(--l-muted) text-[11px]">
        {meta.map((m, i) => (
          <span key={m} className="contents">
            {i > 0 && <span>·</span>}
            <span>{m}</span>
          </span>
        ))}
      </span>
    </>
  );
}

// `auto` end column: its controls outgrow 240px from about 1065px wide, the xl search by far.
function Header() {
  return (
    <header className="relative z-5 grid grid-cols-[minmax(0,1fr)_auto] border-white/12 border-b lg:grid-cols-[240px_minmax(0,1fr)_auto]">
      <Link
        href="/"
        aria-label="Chunks UI home"
        // ponytail: below 329px the name enters the link's end padding, passes the focus ring below
        // 311px and reaches the GitHub button below 285px. Trim the padding below 330px if needed.
        className={`flex items-center gap-2.5 whitespace-nowrap px-[clamp(22px,2.4vw,28px)] py-[18px] font-bold text-[17px] text-white tracking-[-.01em] ${FOCUS_RING_INSET}`}
      >
        <Logo />
        Chunks UI
      </Link>
      <nav
        aria-label="Primary"
        className="hidden items-center justify-center gap-8 border-white/12 border-x px-7 py-[18px] text-[14px] lg:flex"
      >
        {NAV.map(({ label, href }) => (
          <Href
            key={label}
            href={href}
            className={`text-white/70 transition-colors duration-250 hover:text-white ${FOCUS_RING}`}
          >
            {label}
          </Href>
        ))}
      </nav>
      <div className="flex items-center justify-end gap-2 px-[clamp(22px,2.4vw,28px)] py-[18px]">
        {/* Below xl it squeezes the nav. Hidden by a wrapper: on Search, `hidden` meets Nextra's x:flex.
            Hidden, it still swallows / and ⌘K, as Nextra's navbar search does below md. */}
        <div className="me-2 hidden xl:block">
          <Search aria-label="Search documentation" />
        </div>
        <Href
          href={GITHUB}
          aria-label="GitHub repository"
          className={`${ICON_BUTTON} transition-colors duration-300 ${FOCUS_RING}`}
        >
          <GitHubIcon aria-hidden className="size-4" />
        </Href>
        <ThemeButton />
        <Link
          href={DOCS}
          className={`hidden h-[35px] items-center rounded-lg bg-white px-4 font-semibold text-[13px] text-black transition duration-300 hover:bg-white/88 active:scale-[.97] lg:inline-flex ${FOCUS_RING}`}
        >
          Get started
        </Link>
        <MobileMenu>
          {NAV.map(({ label, href }) => (
            <Href
              key={label}
              href={href}
              className={`border-white/10 border-b py-2.5 font-semibold text-[28px] text-white tracking-[-.02em] ${FOCUS_RING}`}
            >
              {label}
            </Href>
          ))}
        </MobileMenu>
      </div>
    </header>
  );
}

const BADGE =
  "inline-flex items-center rounded-[4px] border border-white/15 bg-black/30 px-2.5 py-[5px]";
const SQUARE = "me-1.5 ms-0.5 inline-block size-1.5";

const BUILT_ON = [
  { label: "Base UI", href: "https://base-ui.com" },
  { label: "Tailwind CSS v4", href: "https://tailwindcss.com" },
  { label: "Motion", href: "https://motion.dev" },
  { label: "Floating UI", href: "https://floating-ui.com" },
];

// The hero, the get-started band and the footer are dark in both modes. The `dark` class scopes the
// theme to them, so any chunks-ui token inside resolves to its dark value, and globals.css gives
// them a white --ring (`.landing .dark`). The scope also keeps a future `text-*-text` here at 4.5:1.
// The hero clips only sideways, where the illustration overflows: on a screen taller than the hero,
// the open mobile menu (LandingClient) runs past its bottom.
function Hero() {
  return (
    <section className="dark relative overflow-x-clip bg-(image:--l-hero-bg) text-white">
      {/* 160px, with the BUILT ON row's pb-[120px] below: a taller fade (or less padding) brings the
          light theme's pale --l-bg up behind the BUILT ON links, and their text and ring drop under
          3:1 (200px gave 2.84 and 2.68). */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[160px] bg-linear-to-b from-transparent to-(--l-bg)" />
      <Header />
      <div
        className={`${WRAP} relative z-2 grid min-h-[600px] grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-center gap-10 pt-[clamp(56px,8vw,96px)] pb-16`}
      >
        <div className="flex min-w-0 flex-col items-start">
          <div className="flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-[.06em]">
            <span className={BADGE}>React component library</span>
            <span className={BADGE}>
              Status: <i className={`${SQUARE} bg-success`} />
              {TOTAL.core} core · <i className={`${SQUARE} bg-warning`} />
              {TOTAL.extended} extended
            </span>
          </div>
          <h1 className="my-6 text-balance font-display font-semibold text-[clamp(44px,7vw,88px)] text-white leading-none tracking-[-.05em]">
            <em className="text-white/50 not-italic">Parts</em> for real interfaces.
          </h1>
          <p className="mb-[34px] max-w-[470px] text-pretty text-[18px] text-white/78 leading-normal">
            Accessible React parts on Base UI and Tailwind v4. Install the package and import what
            you need.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Cta href={DOCS}>Read the docs</Cta>
            <HeroCopy text={INSTALL} />
          </div>
        </div>
        <div aria-hidden>
          <HeroStack total={TOTAL.core + TOTAL.extended} />
        </div>
      </div>
      {/* pb-[120px] keeps the BUILT ON row above most of the hero's fade; see the fade's comment */}
      <div className={`${WRAP} relative z-2 pb-[120px]`}>
        <small className="font-mono text-[11px] text-white/70 tracking-[.1em]">BUILT ON</small>
        <div className="mt-3.5 flex flex-wrap gap-x-11 gap-y-4 font-bold text-[24px] tracking-[-.02em]">
          {BUILT_ON.map(({ label, href }) => (
            <Href
              key={label}
              href={href}
              className={`text-white transition-colors duration-250 hover:text-white/70 ${FOCUS_RING}`}
            >
              {label}
            </Href>
          ))}
        </div>
      </div>
    </section>
  );
}

const Kw = ({ children }: { children: ReactNode }) => (
  <span className="text-primary-text">{children}</span>
);

const STEPS = [
  {
    step: "01 · INSTALL",
    lang: "SHELL",
    copy: INSTALL,
    code: (
      <>
        <span className="text-(--l-muted)">$</span> {INSTALL}
      </>
    ),
    title: "Install",
    body: "Install the package. Motion is an optional peer for spring animations.",
    meta: ["chunks-ui", "motion@12.8+ / 14.7+"],
  },
  {
    step: "02 · THEME",
    lang: "CSS",
    copy: "@import 'chunks-ui/theme.css';",
    code: (
      <>
        <Kw>@import</Kw> 'chunks-ui/theme.css';
      </>
    ),
    title: "Import the theme",
    body: "Drop it next to your Tailwind import and you get the tokens and styles.",
    meta: ["OKLCH", "light + dark"],
  },
  {
    step: "03 · USE",
    lang: "TSX",
    copy: "import { Button, Tabs, Input } from 'chunks-ui'",
    code: (
      <>
        <Kw>import</Kw> {"{ Button, Tabs, Input }"} <Kw>from</Kw> 'chunks-ui'
      </>
    ),
    title: "Compose",
    body: "Import Button, Tabs, Input by name from one place. Updates land through npm.",
    meta: ["ESM", "CJS", ".d.ts"],
  },
];

function QuickStart() {
  return (
    <section id="start" className="py-24">
      <div className={WRAP}>
        <SectionHead
          eyebrow="Quick start"
          title="Three steps,"
          accent="and you're in."
          link={
            <Link href={DOCS} className={TEXT_LINK}>
              Full guide →
            </Link>
          }
        />
        <Grid className="lg:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.step} className={CELL}>
              <CellMeta left={s.step} right={s.lang} />
              <div className="mb-1 flex min-h-[76px] items-center gap-3 rounded-[10px] border border-(--l-line) bg-(--l-card) py-3 pe-3 ps-4">
                <code className="min-w-0 flex-1 whitespace-pre-wrap break-words font-mono text-(--l-fg) text-[13px] leading-[1.6]">
                  {s.code}
                </code>
                <CopyButton
                  value={s.copy}
                  className="size-7 flex-none rounded-md text-(--l-muted) hover:bg-(--l-line) hover:text-(--l-fg) [&_svg]:size-3.5"
                />
              </div>
              <CellText title={s.title} body={s.body} meta={s.meta} />
            </div>
          ))}
        </Grid>
      </div>
    </section>
  );
}

function ComponentsSection() {
  return (
    <section id="components" className="pt-6 pb-24">
      <div className={WRAP}>
        <SectionHead
          eyebrow="Components"
          title="The full"
          accent="set."
          link={
            <Link href={COMPONENTS} className={TEXT_LINK}>
              All components →
            </Link>
          }
        />
        <Grid className="lg:grid-cols-3">
          {CATEGORIES.map((c, i) => {
            const names = Object.keys(c.items);
            const { core, extended } = tally(Object.values(c.items));
            return (
              <Link key={c.tag} href={c.href} className={`${CELL} group/card ${FOCUS_RING_INSET}`}>
                <CellMeta
                  decorative
                  left={`0${i + 1} · ${c.tag}`}
                  right={`${names.length} COMPONENTS`}
                />
                <div
                  aria-hidden
                  className="relative mb-1 aspect-[16/10] overflow-hidden rounded-[10px] border border-(--l-line) bg-background [--ring:var(--l-lib-ring)]"
                >
                  <div className="absolute inset-0 flex items-center justify-center px-5 pt-4 pb-[34px] font-sans text-[13px] text-foreground transition-transform duration-600 ease-fluid group-hover/card:scale-[1.03] motion-reduce:transition-none">
                    {c.preview}
                  </div>
                  <span className="absolute bottom-2.5 start-2.5 rounded-full bg-black/70 px-[9px] py-1 font-mono text-[11px] text-white">
                    docs →
                  </span>
                </div>
                <CellText
                  title={c.title}
                  body={`${names.join(", ")}.${c.note ? ` ${c.note}` : ""}`}
                  meta={[`${core} core`, `${extended} extended`]}
                />
              </Link>
            );
          })}
        </Grid>
      </div>
    </section>
  );
}

const PRINCIPLES = [
  {
    tag: "SCOPE",
    art: <ScopeArt />,
    title: "One component, one job.",
    body: "Select and Combobox are separate components. Each covers its own use case.",
    meta: ["<Select />", "<Combobox />"],
  },
  {
    tag: "SIZE",
    art: <SizeArt />,
    title: "Stays small on purpose.",
    body: "Style with className and cn().",
    meta: ["className", "cn()"],
  },
  {
    tag: "API",
    art: <ApiArt />,
    title: "Readable by people and agents.",
    body: "Props are plain and readable. An llms.txt gives agents the same docs.",
    meta: ["llms.txt", "AGENTS.md"],
  },
];

function Principles() {
  return (
    <section id="principles" className="pt-6 pb-24">
      <div className={WRAP}>
        <SectionHead eyebrow="Principles" title="Small API," accent="explicit behavior." />
        <Grid className="lg:grid-cols-3">
          {PRINCIPLES.map((p, i) => (
            <div key={p.tag} className={`${CELL} group/pr`}>
              <CellMeta left={`0${i + 1} · PRINCIPLE`} right={p.tag} />
              <div aria-hidden>{p.art}</div>
              <CellText title={p.title} body={p.body} meta={p.meta} />
            </div>
          ))}
        </Grid>
      </div>
    </section>
  );
}

const STATEMENT = "flex min-w-0 flex-col border-(--l-line) border-e border-b px-7 py-8";
const STATEMENT_LABEL = "font-mono text-primary-text text-[12px]";
const STATEMENT_TEXT = "text-pretty text-(--l-fg) text-[20px] leading-normal tracking-[-.01em]";

// core-prep: moves with the presets to core
function MotionSection() {
  return (
    <section id="motion" className="pt-6 pb-24">
      <div className={WRAP}>
        <SectionHead eyebrow="Motion" title="Animation" accent="with CSS fallback." />
        <Grid className="lg:grid-cols-2">
          <div className={`${STATEMENT} gap-3.5`}>
            <span className={STATEMENT_LABEL}>{"// The default"}</span>
            <p className={STATEMENT_TEXT}>
              Motion 12.8+ or 14.7+ is optional. Add it and you get five tuned springs for
              indicators, content, popups, overlays and small nudges.
            </p>
          </div>
          <div className={`${STATEMENT} gap-3.5`}>
            <span className={STATEMENT_LABEL}>{"// The fallback"}</span>
            <p className={STATEMENT_TEXT}>
              Components animate with CSS transitions by default. Reduced-motion preferences are
              respected.
            </p>
          </div>
        </Grid>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <span className="flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-(--l-muted) text-[12px] tracking-[.04em]">
            STIFFNESS / DAMPING
            <SpringList />
          </span>
          <Href href={`${GITHUB}/blob/master/packages/ui/src/lib/motion.ts`} className={TEXT_LINK}>
            Motion presets →
          </Href>
        </div>
      </div>
    </section>
  );
}

function CreateSection() {
  return (
    <section id="create" className="pt-6 pb-24">
      <div className={WRAP}>
        <SectionHead eyebrow="Create" title="Theme" accent="in the browser." />
        <Grid className="lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
          <div className={`${STATEMENT} gap-5`}>
            <span className={STATEMENT_LABEL}>{"// The configurator"}</span>
            <p className={STATEMENT_TEXT}>
              Start from a preset. Adjust color, type, radius and spacing in the live preview, then
              copy the CSS.
            </p>
            <div className="mt-auto pt-2">
              <Cta href="/create">Open Create</Cta>
            </div>
          </div>
          <div className="min-w-0 overflow-hidden border-(--l-line) border-e border-b">
            <PresetGrid />
          </div>
        </Grid>
      </div>
    </section>
  );
}

// Keep in step with PresetGrid's tiles (LandingClient.tsx): the two sections sit side by side
const DS_TILE =
  "flex min-w-0 flex-col items-start gap-3.5 border-(--l-line) border-e border-b px-6 pt-[22px] pb-6";
const DS_META =
  "text-pretty font-mono text-(--l-muted) text-[10.5px] leading-normal tracking-[.04em]";
const STATES = [
  "bg-primary text-primary-foreground",
  "bg-success text-success-foreground",
  "bg-warning text-warning-foreground",
  "bg-destructive text-destructive-foreground",
];
const NEUTRALS = ["bg-background", "bg-muted", "bg-border", "bg-muted-foreground", "bg-foreground"];
const CHART = [
  "h-2.5 bg-chart-1",
  "h-4 bg-chart-2",
  "h-3 bg-chart-3",
  "h-6 bg-chart-4",
  "h-4.5 bg-chart-5",
];
const CORNERS = ["rounded-ss-sm", "rounded-ss-md", "rounded-ss-lg", "rounded-ss-xl"];
// back to front, each ringed in the page colour where it overlaps the one below
const LAYERS = [
  "start-0 top-[9px] bg-border",
  "start-[9px] top-[6px] bg-muted-foreground",
  "start-[18px] top-[3px] bg-foreground",
  "start-[27px] top-0 bg-primary",
];
const RULER = "flex h-2.5 items-center border-primary border-x-2";

/** The Tokens drawing: one row per token family, each sample drawn with the tokens themselves */
const TOKEN_ROWS: [string, ReactNode][] = [
  [
    "color",
    STATES.map((c) => (
      <span
        key={c}
        className={`grid h-6 max-w-11 flex-1 place-items-center rounded-md font-semibold text-[10px] ${c}`}
      >
        Aa
      </span>
    )),
  ],
  [
    "neutral",
    <span
      key="ramp"
      className="flex h-3.5 max-w-44 flex-1 overflow-hidden rounded-full ring-(--l-line) ring-1"
    >
      {NEUTRALS.map((bg) => (
        <span key={bg} className={`flex-1 ${bg}`} />
      ))}
    </span>,
  ],
  [
    "chart",
    <span key="bars" className="flex h-6 items-end gap-1">
      {CHART.map((bar) => (
        <span key={bar} className={`w-2.5 rounded-t-[2px] ${bar}`} />
      ))}
    </span>,
  ],
  [
    "radius",
    CORNERS.map((corner) => (
      <span key={corner} className={`size-5 border-foreground border-s-2 border-t-2 ${corner}`} />
    )),
  ],
  [
    "space",
    ["w-(--spacing-ui-icon-height)", "w-(--spacing-ui-height)"].map((width) => (
      <span key={width} className={`${RULER} ${width}`}>
        <span className="h-0.5 w-full bg-primary" />
      </span>
    )),
  ],
  [
    "ease",
    // --ease-fluid, cubic-bezier(0.3, 0, 0, 1), over a straight line
    <svg
      key="curve"
      aria-hidden
      viewBox="0 0 48 24"
      fill="none"
      className="h-6 w-12 overflow-visible"
    >
      <path d="M1 23 47 1" className="stroke-(--l-line)" strokeWidth={1.5} />
      <path
        d="M1 23C14.8 23 1 1 47 1"
        className="stroke-primary"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>,
  ],
  [
    "layer",
    <span key="stack" className="relative h-[25px] w-[43px] shrink-0">
      {LAYERS.map((layer) => (
        <span
          key={layer}
          className={`absolute size-4 rounded-[3px] shadow-[0_0_0_1.5px_var(--l-bg)] ${layer}`}
        />
      ))}
    </span>,
  ],
];

/** What the design system holds, each drawn small in the library's own tokens. */
const DS_TILES: { name: string; meta: string; art: ReactNode; tall?: boolean }[] = [
  {
    name: "Tokens",
    meta: "OKLCH · light and dark",
    tall: true,
    // cells of the tile's two-column grid: the family's name, then its sample past a hairline
    art: TOKEN_ROWS.map(([label, sample]) => (
      <Fragment key={label}>
        <span className={`flex items-center py-1 pe-3 ${DS_META}`}>{label}</span>
        <span className="flex min-w-0 items-center gap-1.5 border-(--l-line) border-s py-1 ps-3">
          {sample}
        </span>
      </Fragment>
    )),
  },
  {
    name: "Every component",
    meta: "live previews · React 19",
    art: (
      <span className="flex items-center gap-2.5">
        <span className="h-7 rounded-md bg-primary px-3 font-medium text-[12px] text-primary-foreground leading-7">
          Save
        </span>
        <span className="flex h-4 w-7 rounded-full bg-primary p-0.5">
          <span className="ms-auto size-3 rounded-full bg-background" />
        </span>
      </span>
    ),
  },
  {
    name: "Fonts",
    meta: "Manrope · Fira Code · Outfit",
    art: <span className="font-semibold text-[30px] leading-none">Aa</span>,
  },
];

function DesignSystemTiles() {
  return (
    // The wrapper is a grid, so this list stretches to the statement's height and its negative
    // margins still tuck the last row's bottom border under the wrapper's.
    // biome-ignore lint/a11y/noRedundantRoles: WebKit drops the list role under list-style: none
    <ul role="list" className="-me-px -mb-px grid grid-cols-2 sm:auto-rows-fr">
      {DS_TILES.map(({ name, meta, art, tall }) => (
        <li
          key={name}
          className={`${DS_TILE} ${tall ? "col-span-2 sm:col-span-1 sm:row-span-2" : ""}`}
        >
          <span
            aria-hidden
            className={
              tall
                ? "grid w-full flex-1 auto-rows-fr grid-cols-[auto_minmax(0,1fr)]"
                : "flex h-[30px] items-center"
            }
          >
            {art}
          </span>
          <span className="font-semibold text-[15px] tracking-[-.01em]">{name}</span>
          <span className={DS_META}>{meta}</span>
        </li>
      ))}
    </ul>
  );
}

// Mirrors Create's grid, the drawing first on wide screens; the statement still reads first
function DesignSystemSection() {
  return (
    <section id="claude" className="pt-6">
      <div className={WRAP}>
        <SectionHead
          eyebrow="For Claude"
          title="Design in Claude"
          accent="with the real components."
        />
        <Grid className="lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          {/* Always the last column on lg: no end border, which rounding can paint on the frame */}
          <div className={`${STATEMENT} gap-5 lg:border-e-0`}>
            <span className={STATEMENT_LABEL}>{"// The design system"}</span>
            <p className={STATEMENT_TEXT}>
              Each release ships a design system for Claude: the tokens, every component live on
              React 19 and the fonts. Import it into your claude.ai account, and the designs Claude
              makes with it use the real components. Run the same import again after a release to
              update it.
            </p>
            <div className="mt-auto pt-2">
              <Cta href="/claude-design-system">Import the design system</Cta>
            </div>
          </div>
          <div className="grid min-w-0 overflow-hidden border-(--l-line) border-e border-b lg:order-first">
            <DesignSystemTiles />
          </div>
        </Grid>
      </div>
    </section>
  );
}

// Hover text is --l-brand-pale: over the brightest part of the gradient, a mid blue such as
// oklch(70% .15 257) drops to 3.6:1 (390px wide) and 4.2:1 (1920px); --l-brand-pale keeps 5:1.
const ROW = `flex flex-col gap-1 border-white/15 border-b py-[18px] text-start text-white transition-colors duration-300 hover:text-(--l-brand-pale) ${FOCUS_RING}`;
const ROW_LABEL = "font-mono text-[11px] text-white/70 tracking-[.06em]";
const ROW_VALUE = "font-semibold text-[20px] tracking-[-.015em]";

const LINK_ROWS = [
  { label: "// docs", href: DOCS, value: "ui-kit.chunk-creations.com" },
  { label: "// source", href: GITHUB, value: "github.com/pawelkrystkiewicz/chunks-ui ↗" },
  { label: "// for agents", href: "/llms.txt", value: "ui-kit.chunk-creations.com/llms.txt" },
  { label: "// context7", href: CONTEXT7, value: "context7.com/pawelkrystkiewicz/chunks-ui ↗" },
];

// `dark`: see the note above Hero.
function GetStarted() {
  return (
    <section
      id="get-started"
      className="dark relative mt-24 overflow-hidden bg-(image:--l-cta-bg) text-white"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[140px] bg-linear-to-b from-(--l-bg) to-transparent" />
      <div
        className={`${WRAP} relative grid grid-cols-1 items-end gap-14 pt-[180px] pb-24 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]`}
      >
        <h2 className="text-balance font-display font-semibold text-[clamp(36px,5vw,60px)] text-white leading-[1.02] tracking-[-.045em]">
          One install.
          <br />
          <em className="text-white/70 not-italic">Then back to building.</em>
        </h2>
        <div className="flex flex-col border-white/15 border-t">
          <CopyRow
            text={INSTALL}
            className={`${ROW} cursor-pointer leading-[normal]`}
            labelClassName={ROW_LABEL}
          />
          {LINK_ROWS.map(({ label, href, value }) => (
            <Href key={label} href={href} className={ROW}>
              <span className={ROW_LABEL}>{label}</span>
              <span className={ROW_VALUE}>{value}</span>
            </Href>
          ))}
        </div>
      </div>
    </section>
  );
}

const FOOTER_NAV = [
  {
    label: "// Library",
    links: [
      { label: "Docs", href: DOCS },
      { label: "Components", href: COMPONENTS },
      { label: "llms.txt", href: "/llms.txt" },
      { label: "Context7 ↗", href: CONTEXT7 },
    ],
  },
  {
    label: "// Tools",
    links: [
      { label: "Create", href: "/create" },
      { label: "GitHub ↗", href: GITHUB },
      { label: "npm ↗", href: "https://www.npmjs.com/package/chunks-ui" },
    ],
  },
  {
    label: "// Studio",
    links: [
      { label: "chunk-creations.com ↗", href: "https://chunk-creations.com" },
      { label: "contact@chunk-creations.com", href: "mailto:contact@chunk-creations.com" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
];

// `dark`: see the note above Hero.
function Footer() {
  return (
    <footer className="dark bg-black text-[14px] text-white/70">
      <div className={WRAP}>
        <div className="grid grid-cols-1 gap-10 border-white/10 border-b pt-14 pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div className="flex flex-col items-start">
            <Link
              href="/"
              className={`flex items-center gap-2.5 font-bold text-[17px] text-white tracking-[-.01em] ${FOCUS_RING}`}
            >
              <Logo />
              Chunks UI
            </Link>
            <p className="mt-3.5 text-white/55">
              Small React pieces on Base UI, looked after by Chunk Creations.
            </p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-6 lg:grid-cols-3">
            {FOOTER_NAV.map((col) => (
              <div key={col.label} className="flex flex-col gap-2">
                <span className="mb-1 font-mono text-[11px] text-white/50">{col.label}</span>
                {col.links.map(({ label, href }) => (
                  <Href
                    key={label}
                    href={href}
                    className={`text-white/80 transition-colors duration-250 hover:text-white ${FOCUS_RING}`}
                  >
                    {label}
                  </Href>
                ))}
              </div>
            ))}
          </nav>
        </div>
        <div className="flex flex-wrap justify-between gap-4 pt-5 pb-8 font-mono text-white/50 text-[12px]">
          <span>© 2026 Chunk Creations · MIT license</span>
          <span>
            Built with{" "}
            <Link
              href={DOCS}
              className={`text-white/70 underline underline-offset-2 hover:text-white ${FOCUS_RING}`}
            >
              chunks-ui
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    // `.landing` also opts the page out of Nextra's content padding (globals.css).
    <div className="landing min-h-screen bg-(--l-bg) font-sans text-(--l-fg) text-[16px] leading-normal">
      <Hero />
      <QuickStart />
      <ComponentsSection />
      <Principles />
      <MotionSection />
      <CreateSection />
      <DesignSystemSection />
      <GetStarted />
      <Footer />
    </div>
  );
}

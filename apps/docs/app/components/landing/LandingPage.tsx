// Server component: interactive parts live in ./LandingClient.
// chunks-ui is a client bundle, so only its components render here; `cn` and `springs` can't run here.

import { CopyButton } from "chunks-ui";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import {
  FeedbackPreview,
  InputsPreview,
  OverlaysPreview,
  PickersPreview,
  SelectionPreview,
  StructurePreview,
} from "./ComponentPreviews";
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
const DOCS = "/getting-started";
const COMPONENTS = "/components/button";

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
    note: "Separate components, not modes.",
    preview: <PickersPreview />,
  },
  {
    title: "Overlays",
    tag: "OVERLAYS",
    href: "/components/dialog",
    items: { Dialog: "core", Drawer: "core", Popover: "core", Tooltip: "core", Menu: "extended" },
    note: "Floating UI positioning built in.",
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
  "flex min-w-0 flex-col gap-3 border-(--l-line) border-r border-b px-7 pt-6 pb-8 text-(--l-fg) transition-colors duration-300 ease-in-out hover:bg-(--l-card)";
const TEXT_LINK =
  "inline-flex items-center gap-2 font-semibold text-(--l-fg) text-[14px] transition-colors duration-250 hover:text-primary";

/** Internal routes go through next/link; files and external URLs stay plain anchors. */
function Href({ href, ...props }: ComponentProps<"a"> & { href: string }) {
  if (href.startsWith("http")) return <a href={href} target="_blank" rel="noopener" {...props} />;
  if (href.endsWith(".txt")) return <a href={href} {...props} />;
  return <Link href={href} {...props} />;
}

function Logo() {
  return (
    <Image src="/logo-dark-mode.svg" alt="" width={28} height={28} className="size-7 flex-none" />
  );
}

function SplitCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group/cta inline-flex overflow-hidden rounded-lg font-semibold text-[14px] text-white transition-transform duration-200 active:scale-[.97]"
    >
      <span className="bg-(--l-brand-soft) px-[18px] py-3 transition-colors duration-250 group-hover/cta:bg-[oklch(74%_.14_257)]">
        {children}
      </span>
      <span className="flex items-center bg-(--l-brand) px-4 py-3">
        <ArrowRight className="size-4" />
      </span>
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
          {title} <em className="text-primary not-italic">{accent}</em>
        </h2>
      </div>
      {link}
    </div>
  );
}

/** Hairline grid: each cell draws its right and bottom border; the frame hides the outer right edge. */
function Grid({ className, children }: { className: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden border-(--l-line) border-t">
      <div className={`-mr-px grid grid-cols-1 ${className}`}>{children}</div>
    </div>
  );
}

function CellMeta({ left, right }: { left: string; right: string }) {
  return (
    <span className="flex justify-between gap-2 font-mono text-(--l-muted) text-[10px] tracking-[.1em]">
      <span>{left}</span>
      <span>{right}</span>
    </span>
  );
}

function CellText({
  id,
  title,
  body,
  meta,
}: {
  id?: string;
  title: string;
  body: string;
  meta: string[];
}) {
  return (
    <>
      <h3
        id={id && `${id}-title`}
        className="font-display font-semibold text-(--l-fg) text-[20px] leading-tight tracking-[-.02em]"
      >
        {title}
      </h3>
      <p
        id={id && `${id}-body`}
        className="text-pretty text-(--l-muted) text-[14px] leading-normal"
      >
        {body}
      </p>
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

function Header() {
  return (
    <header className="relative z-5 grid grid-cols-[minmax(0,1fr)_auto] border-white/12 border-b lg:grid-cols-[240px_minmax(0,1fr)_240px]">
      <Link
        href="/"
        aria-label="Chunks UI home"
        className="flex items-center gap-2.5 px-[clamp(22px,2.4vw,28px)] py-[18px] font-bold text-[17px] text-white tracking-[-.01em]"
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
            className="text-white/70 transition-colors duration-250 hover:text-white"
          >
            {label}
          </Href>
        ))}
      </nav>
      <div className="flex items-center justify-end gap-2 px-[clamp(22px,2.4vw,28px)] py-[18px]">
        <ThemeButton />
        <Link
          href={DOCS}
          className="hidden h-[35px] items-center rounded-lg bg-white px-4 font-semibold text-[13px] text-black transition duration-300 hover:bg-white/88 active:scale-[.97] lg:inline-flex"
        >
          Get started
        </Link>
        <MobileMenu>
          {NAV.map(({ label, href }) => (
            <Href
              key={label}
              href={href}
              className="border-white/10 border-b py-2.5 font-semibold text-[28px] text-white tracking-[-.02em]"
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
const SQUARE = "mr-1.5 ml-0.5 inline-block size-1.5";

const BUILT_ON = [
  { label: "Base UI", href: "https://base-ui.com" },
  { label: "Tailwind CSS v4", href: "https://tailwindcss.com" },
  { label: "Motion", href: "https://motion.dev" },
  { label: "Floating UI", href: "https://floating-ui.com" },
];

function Hero() {
  return (
    <section className="relative overflow-hidden bg-(image:--l-hero-bg) text-white">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[200px] bg-linear-to-b from-transparent to-(--l-bg)" />
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
            <em className="text-white/50 not-italic">Composed,</em> not configured.
          </h1>
          <p className="mb-[34px] max-w-[470px] text-pretty text-[18px] text-white/78 leading-normal">
            Accessible React components on Base UI, styled with Tailwind CSS v4 and animated with
            Motion. One npm package, not a copy-paste registry.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <SplitCta href={DOCS}>Read the docs</SplitCta>
            <HeroCopy text={INSTALL} />
          </div>
        </div>
        <div aria-hidden>
          <HeroStack total={TOTAL.core + TOTAL.extended} />
        </div>
      </div>
      <div className={`${WRAP} relative z-2 pb-[120px]`}>
        <small className="font-mono text-[11px] text-white/60 tracking-[.1em]">BUILT ON</small>
        <div className="mt-3.5 flex flex-wrap gap-x-11 gap-y-4 font-bold text-[24px] tracking-[-.02em]">
          {BUILT_ON.map(({ label, href }) => (
            <Href
              key={label}
              href={href}
              className="text-white transition-colors duration-250 hover:text-white/70"
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
  <span className="text-primary">{children}</span>
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
    body: "Motion is an optional peer. Without it, components fall back to CSS transitions.",
    meta: ["chunks-ui", "motion@12+"],
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
    body: "Next to Tailwind's import. Brings the tokens and the component classes. No plugin.",
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
    body: "Named exports from one package. No copied source to keep in sync.",
    meta: ["ESM", "CJS", ".d.ts"],
  },
];

function QuickStart() {
  return (
    <section id="start" className="py-24">
      <div className={WRAP}>
        <SectionHead
          eyebrow="Quick start"
          title="Three lines."
          accent="No registry."
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
              <div className="mb-1 flex min-h-[76px] items-center gap-3 rounded-[10px] border border-(--l-line) bg-(--l-card) py-3 pr-3 pl-4">
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
          title={`${TOTAL.core} core.`}
          accent={`${TOTAL.extended} extended.`}
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
              <Link
                key={c.tag}
                href={c.href}
                aria-labelledby={`cat-${c.tag}-title`}
                aria-describedby={`cat-${c.tag}-body`}
                className={`${CELL} group/card`}
              >
                <CellMeta left={`0${i + 1} · ${c.tag}`} right={`${names.length} COMPONENTS`} />
                <div
                  aria-hidden
                  className="relative mb-1 aspect-[16/10] overflow-hidden rounded-[10px] border border-(--l-line) bg-background"
                >
                  <div className="absolute inset-0 flex items-center justify-center px-5 pt-4 pb-[34px] font-sans text-[13px] text-foreground transition-transform duration-600 ease-fluid group-hover/card:scale-[1.03] motion-reduce:transition-none">
                    {c.preview}
                  </div>
                  <span className="absolute bottom-2.5 left-2.5 rounded-full bg-black/70 px-[9px] py-1 font-mono text-[11px] text-white">
                    docs →
                  </span>
                </div>
                <CellText
                  id={`cat-${c.tag}`}
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
    body: "Select and Combobox are separate components. No god-component with a mode prop.",
    meta: ["<Select />", "<Combobox />"],
  },
  {
    tag: "SIZE",
    art: <SizeArt />,
    title: "Lean set.",
    body: "If Tailwind can do it inline, it doesn't need a component.",
    meta: ["className", "cn()"],
  },
  {
    tag: "API",
    art: <ApiArt />,
    title: "LLM-friendly.",
    body: "Props over config objects. Conventional names an agent can guess without opening the source.",
    meta: ["llms.txt", "AGENTS.md"],
  },
];

function Principles() {
  return (
    <section id="principles" className="pt-6 pb-24">
      <div className={WRAP}>
        <SectionHead
          eyebrow="Principles"
          title="Conventional APIs."
          accent="Minimal indirection."
        />
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

const STATEMENT = "flex min-w-0 flex-col border-(--l-line) border-r border-b px-7 py-8";
const STATEMENT_LABEL = "font-mono text-primary text-[12px]";
const STATEMENT_TEXT = "text-pretty text-(--l-fg) text-[20px] leading-normal tracking-[-.01em]";

function MotionSection() {
  return (
    <section id="motion" className="pt-6 pb-24">
      <div className={WRAP}>
        <SectionHead eyebrow="Motion" title="Animated from day one." accent="Not retrofitted." />
        <Grid className="lg:grid-cols-2">
          <div className={`${STATEMENT} gap-3.5`}>
            <span className={STATEMENT_LABEL}>{"// The default"}</span>
            <p className={STATEMENT_TEXT}>
              Motion v12 is a first-class peer. Five spring presets cover tab indicators, content,
              popups, overlays and hover.
            </p>
          </div>
          <div className={`${STATEMENT} gap-3.5`}>
            <span className={STATEMENT_LABEL}>{"// The fallback"}</span>
            <p className={STATEMENT_TEXT}>
              No Motion installed? Components detect that at runtime and fall back to CSS
              transitions. Every one respects prefers-reduced-motion.
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
    <section id="create" className="pt-6">
      <div className={WRAP}>
        <SectionHead
          eyebrow="Create"
          title="Theme it"
          accent="in the browser."
          link={
            <Link href="/create" className={TEXT_LINK}>
              Open Create →
            </Link>
          }
        />
        <Grid className="lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
          <div className={`${STATEMENT} gap-5`}>
            <span className={STATEMENT_LABEL}>{"// The configurator"}</span>
            <p className={STATEMENT_TEXT}>
              Pick a preset or tune color, type, radius and density. Every change previews live
              across real screens. Copy one CSS block when it looks right.
            </p>
            <div className="mt-auto pt-2">
              <SplitCta href="/create">Open Create</SplitCta>
            </div>
          </div>
          <div className="min-w-0 overflow-hidden border-(--l-line) border-r border-b">
            <PresetGrid />
          </div>
        </Grid>
      </div>
    </section>
  );
}

const ROW =
  "flex flex-col gap-1 border-white/15 border-b py-[18px] text-left text-white transition-colors duration-300 hover:text-(--l-brand-soft)";
const ROW_LABEL = "font-mono text-[11px] text-white/55 tracking-[.06em]";
const ROW_VALUE = "font-semibold text-[20px] tracking-[-.015em]";

const LINK_ROWS = [
  { label: "// docs", href: DOCS, value: "ui-kit.chunk-creations.com" },
  { label: "// source", href: GITHUB, value: "github.com/pawelkrystkiewicz/chunks-ui ↗" },
  { label: "// for agents", href: "/llms.txt", value: "ui-kit.chunk-creations.com/llms.txt" },
];

function GetStarted() {
  return (
    <section
      id="get-started"
      className="relative mt-24 overflow-hidden bg-(image:--l-cta-bg) text-white"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[140px] bg-linear-to-b from-(--l-bg) to-transparent" />
      <div
        className={`${WRAP} relative grid grid-cols-1 items-end gap-14 pt-[180px] pb-24 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]`}
      >
        <h2 className="text-balance font-display font-semibold text-[clamp(36px,5vw,60px)] text-white leading-[1.02] tracking-[-.045em]">
          Install once.
          <br />
          <em className="text-white/50 not-italic">Compose the rest.</em>
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
      { label: "hello@chunk-creations.com", href: "mailto:hello@chunk-creations.com" },
    ],
  },
];

function Footer() {
  return (
    <footer className="bg-black text-[14px] text-white/70">
      <div className={WRAP}>
        <div className="grid grid-cols-1 gap-10 border-white/10 border-b pt-14 pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div className="flex flex-col items-start">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-bold text-[17px] text-white tracking-[-.01em]"
            >
              <Logo />
              Chunks UI
            </Link>
            <p className="mt-3.5 text-white/55">
              React components on Base UI. A Chunk Creations project.
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
                    className="text-white/80 transition-colors duration-250 hover:text-white"
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
            <Link href={DOCS} className="text-white/70 hover:text-white">
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
      <GetStarted />
      <Footer />
    </div>
  );
}

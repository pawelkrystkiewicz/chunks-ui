"use client";

import {
  ArrowRight,
  Check,
  Copy,
  Layers,
  Minimize2,
  Paintbrush,
  Puzzle,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const INSTALL_CMD = "bun add chunks-ui motion";

const TECH = [
  {
    icon: Layers,
    title: "Base UI",
    accent: "border-l-primary",
    desc: "Headless, accessible primitives from MUI with built-in Floating UI. WAI-ARIA patterns out of the box.",
  },
  {
    icon: Paintbrush,
    title: "Tailwind CSS v4",
    accent: "border-l-success",
    desc: "OKLCH color tokens via CSS variables. CVA-powered variant definitions. Zero-config dark mode.",
  },
  {
    icon: Zap,
    title: "Motion",
    accent: "border-l-warning",
    desc: "Spring physics with shared presets. CSS fallbacks when Motion isn't installed. Respects prefers-reduced-motion.",
  },
];

const PRINCIPLES = [
  {
    icon: Target,
    title: "One component, one job",
    desc: "Select, Combobox, Autocomplete \u2014 each is its own component. No mode-switching.",
  },
  {
    icon: Puzzle,
    title: "Composition over config",
    desc: "Compound patterns: Root, Trigger, Content. Standard props, not config objects.",
  },
  {
    icon: Minimize2,
    title: "Lean by default",
    desc: "If Tailwind handles it, we skip it. Ship only what\u2019s genuinely needed.",
  },
  {
    icon: Sparkles,
    title: "LLM-friendly API",
    desc: "Conventional patterns, minimal abstractions. Readable by humans and language models alike.",
  },
];

const COMPONENTS: Record<string, { name: string; href: string }[]> = {
  Forms: [
    { name: "Button", href: "/components/button" },
    { name: "Input", href: "/components/input" },
    { name: "Textarea", href: "/components/textarea" },
    { name: "Select", href: "/components/select" },
    { name: "Combobox", href: "/components/combobox" },
    { name: "Checkbox", href: "/components/checkbox" },
    { name: "Radio", href: "/components/radio" },
    { name: "Switch", href: "/components/switch" },
    { name: "Field", href: "/components/field" },
  ],
  Overlays: [
    { name: "Dialog", href: "/components/dialog" },
    { name: "Drawer", href: "/components/drawer" },
    { name: "Popover", href: "/components/popover" },
    { name: "Tooltip", href: "/components/tooltip" },
  ],
  Display: [
    { name: "Avatar", href: "/components/avatar" },
    { name: "Card", href: "/components/card" },
    { name: "Chip", href: "/components/chip" },
    { name: "Tabs", href: "/components/tabs" },
    { name: "Loader", href: "/components/loader" },
  ],
  Layout: [
    { name: "Separator", href: "/components/separator" },
    { name: "Clear Button", href: "/components/clear-button" },
  ],
};

const CODE_EXAMPLE = `import { Button, Input, Field } from "chunks-ui";

function LoginForm() {
  return (
    <form className="flex flex-col gap-4">
      <Field.Root>
        <Field.Label>Email</Field.Label>
        <Input
          type="email"
          placeholder="you@example.com"
        />
      </Field.Root>

      <Field.Root>
        <Field.Label>Password</Field.Label>
        <Input type="password" />
        <Field.Description>
          Must be at least 8 characters
        </Field.Description>
      </Field.Root>

      <Button color="primary">Sign in</Button>
    </form>
  );
}`;

function InstallCommand() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(INSTALL_CMD);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="group inline-flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 font-mono text-sm transition-colors hover:border-primary/30"
    >
      <span className="text-muted-foreground select-none">$</span>
      <code className="text-foreground">{INSTALL_CMD}</code>
      <span className="text-muted-foreground group-hover:text-foreground transition-colors">
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </span>
    </button>
  );
}

function CodePreview() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(CODE_EXAMPLE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative rounded-xl border border-[oklch(0.2_0_0)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[oklch(0.2_0_0)] bg-[oklch(0.13_0_0)]">
        <div className="flex gap-1.5">
          <div className="size-2.5 rounded-full bg-[oklch(0.3_0_0)]" />
          <div className="size-2.5 rounded-full bg-[oklch(0.3_0_0)]" />
          <div className="size-2.5 rounded-full bg-[oklch(0.3_0_0)]" />
        </div>
        <span className="text-xs font-mono text-[oklch(0.45_0_0)] ml-2">LoginForm.tsx</span>
        <button
          type="button"
          onClick={copy}
          className="ml-auto inline-flex items-center justify-center size-7 rounded text-[oklch(0.45_0_0)] hover:text-[oklch(0.7_0_0)] hover:bg-[oklch(0.2_0_0)] transition-colors"
          aria-label={copied ? "Copied" : "Copy to clipboard"}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </div>
      <pre className="p-5 bg-[oklch(0.1_0_0)] overflow-x-auto !m-0 !rounded-none !border-0">
        <code className="!text-[13px] !leading-[1.7] font-mono text-[oklch(0.78_0_0)] !p-0 !bg-transparent">
          {CODE_EXAMPLE}
        </code>
      </pre>
    </div>
  );
}

export function LandingPage() {
  const totalComponents = Object.values(COMPONENTS).flat().length;

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative px-6 pt-24 pb-20 md:pt-36 md:pb-28">
        <div
          className="absolute inset-0 opacity-[0.25] dark:opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

        <div className="relative max-w-3xl mx-auto text-center">
          <p
            className="fade-up text-sm font-mono tracking-widest uppercase text-muted-foreground mb-6"
            style={{ animationDelay: "0ms" }}
          >
            React 19+ Component Library
          </p>

          <h1
            className="fade-up font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight mb-6"
            style={{ animationDelay: "80ms" }}
          >
            Build with
            <br />
            <em className="text-primary">intention</em>
          </h1>

          <p
            className="fade-up text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed"
            style={{ animationDelay: "160ms" }}
          >
            Accessible components on Base&nbsp;UI, styled with Tailwind&nbsp;CSS&nbsp;v4, animated
            with Motion. Composed, not configured.
          </p>

          <div className="fade-up mb-8" style={{ animationDelay: "240ms" }}>
            <InstallCommand />
          </div>

          <div
            className="fade-up flex items-center justify-center gap-3 flex-wrap"
            style={{ animationDelay: "320ms" }}
          >
            <Link
              href="/getting-started"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity no-underline"
            >
              Get Started
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/components/button"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded border border-border font-medium text-sm hover:bg-accent transition-colors no-underline"
            >
              Browse Components
            </Link>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      {/* Tech Stack */}
      <section className="px-6 py-20 md:py-28">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-sm font-mono tracking-widest uppercase text-muted-foreground mb-10 text-center">
            Foundation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TECH.map((t) => (
              <div
                key={t.title}
                className={`rounded-xl border border-border border-l-[3px] ${t.accent} bg-card p-6 transition-colors hover:bg-accent/50`}
              >
                <t.icon size={20} className="text-muted-foreground mb-3" strokeWidth={1.5} />
                <h3 className="font-semibold text-base mb-2">{t.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed m-0">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="px-6 py-20 md:py-28 border-y border-border bg-accent/30">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
            <div className="lg:col-span-2">
              <h2 className="text-sm font-mono tracking-widest uppercase text-muted-foreground mb-4">
                Clean API
              </h2>
              <p className="text-2xl md:text-3xl font-semibold leading-snug mb-4">
                Props you already know.
                <br />
                Patterns you already use.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Compound components with Field.Root, Field.Label, Field.Description. Standard HTML
                attributes forwarded. No wrapper&nbsp;divs, no&nbsp;magic.
              </p>
              <Link
                href="/getting-started"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline no-underline"
              >
                Read the docs <ArrowRight size={14} />
              </Link>
            </div>
            <div className="lg:col-span-3">
              <CodePreview />
            </div>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="px-6 py-20 md:py-28">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-sm font-mono tracking-widest uppercase text-muted-foreground mb-10 text-center">
            Principles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="flex gap-4">
                <div className="flex-shrink-0 size-10 rounded bg-secondary flex items-center justify-center">
                  <p.icon size={18} className="text-muted-foreground" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed m-0">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Components */}
      <section className="px-6 py-20 md:py-28">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-sm font-mono tracking-widest uppercase text-muted-foreground mb-2 text-center">
            Components
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            {totalComponents} components, ready to compose.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-10">
            {Object.entries(COMPONENTS).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-xs font-mono tracking-widest uppercase text-muted-foreground mb-3 pb-2 border-b border-border">
                  {category}
                </h3>
                <ul className="space-y-0.5 list-none p-0 m-0">
                  {items.map((item) => (
                    <li key={item.name} className="m-0 p-0">
                      <Link
                        href={item.href}
                        className="block py-1.5 text-sm hover:text-primary transition-colors no-underline"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 py-20 md:py-28 border-t border-border bg-accent/30">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl tracking-tight mb-4">Start building</h2>
          <p className="text-muted-foreground mb-8">Add chunks-ui to your project in seconds.</p>
          <div className="mb-8">
            <InstallCommand />
          </div>
          <Link
            href="/getting-started"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity no-underline"
          >
            Get Started
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}

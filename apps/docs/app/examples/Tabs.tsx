"use client";

import { Tabs, useTabsValue } from "chunks-ui";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Container } from "@/components";

export function TabsBasicExample() {
  return (
    <Container>
      <Tabs.Root defaultValue="tab-1">
        <Tabs.List>
          <Tabs.Tab value="tab-1">Account</Tabs.Tab>
          <Tabs.Tab value="tab-2">Security</Tabs.Tab>
          <Tabs.Tab value="tab-3">Notifications</Tabs.Tab>
          <Tabs.Indicator />
        </Tabs.List>
        <Tabs.Contents>
          <Tabs.Content value="tab-1">
            <p className="p-4">Account settings content.</p>
          </Tabs.Content>
          <Tabs.Content value="tab-2">
            <p className="p-4">Security settings content.</p>
          </Tabs.Content>
          <Tabs.Content value="tab-3">
            <p className="p-4">Notification preferences.</p>
          </Tabs.Content>
        </Tabs.Contents>
      </Tabs.Root>
    </Container>
  );
}

export function TabsVerticalExample() {
  return (
    <Container>
      <Tabs.Root defaultValue="tab-1" orientation="vertical">
        <Tabs.List>
          <Tabs.Tab value="tab-1">General</Tabs.Tab>
          <Tabs.Tab value="tab-2">Advanced</Tabs.Tab>
          <Tabs.Indicator />
        </Tabs.List>
        <Tabs.Contents>
          <Tabs.Content value="tab-1">
            <p className="p-4">General settings</p>
          </Tabs.Content>
          <Tabs.Content value="tab-2">
            <p className="p-4">Advanced settings</p>
          </Tabs.Content>
        </Tabs.Contents>
      </Tabs.Root>
    </Container>
  );
}

// ---------------------------------------------------------------------------
// Routed-tab pattern #1 — `<Tabs.Animate>` (component)
//
// The standard opt-out of `<Tabs.Contents>`'s left/right slide. One outlet,
// one motion target. Pass `initial`/`animate`/`transition` to bring your own
// animation; `Tabs.Animate` re-keys on tab change so children always remount.
// ---------------------------------------------------------------------------

const ROUTES = [
  { value: "home", label: "Home", body: "Welcome — your dashboard at a glance." },
  { value: "profile", label: "Profile", body: "Your name, avatar, and bio." },
  { value: "settings", label: "Settings", body: "Notifications, security, and more." },
] as const;

export function TabsAnimateExample() {
  const [tab, setTab] = useState<string>("home");
  const active = ROUTES.find((r) => r.value === tab) ?? ROUTES[0];

  return (
    <Container>
      <Tabs.Root value={tab} onValueChange={(v) => setTab(v as string)}>
        <Tabs.List>
          {ROUTES.map((r) => (
            <Tabs.Tab key={r.value} value={r.value}>
              {r.label}
            </Tabs.Tab>
          ))}
          <Tabs.Indicator />
        </Tabs.List>
        <div className="mt-3 min-h-24">
          <Tabs.Animate
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <p className="p-4">{active.body}</p>
          </Tabs.Animate>
        </div>
      </Tabs.Root>
    </Container>
  );
}

// ---------------------------------------------------------------------------
// Routed-tab pattern #2 — `useTabsValue()` (hook)
//
// Drop down to the hook when you need a motion primitive that `Tabs.Animate`
// doesn't expose — here, `<AnimatePresence>` for an exit animation. The hook
// gives you the active value; you key your own `motion.div` off it.
// ---------------------------------------------------------------------------

function HookPanel({ children }: { children: ReactNode }) {
  const value = useTabsValue();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={String(value)}
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.97, opacity: 0 }}
        transition={{ duration: 0.18 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function TabsHookExample() {
  const [tab, setTab] = useState<string>("home");
  const active = ROUTES.find((r) => r.value === tab) ?? ROUTES[0];

  return (
    <Container>
      <Tabs.Root value={tab} onValueChange={(v) => setTab(v as string)}>
        <Tabs.List>
          {ROUTES.map((r) => (
            <Tabs.Tab key={r.value} value={r.value}>
              {r.label}
            </Tabs.Tab>
          ))}
          <Tabs.Indicator />
        </Tabs.List>
        <div className="mt-3 min-h-24">
          <HookPanel>
            <p className="p-4">{active.body}</p>
          </HookPanel>
        </div>
      </Tabs.Root>
    </Container>
  );
}

// ---------------------------------------------------------------------------
// Routed-tab pattern #3 — direction-aware slide (hook + component)
//
// The exact case `<Tabs.Contents>` cannot serve: a router-like setup where
// only one panel is mounted, but the developer still wants the active panel
// to slide in from the *direction the user is coming from* (right when going
// forward, left when going back).
//
// `useTabsValue()` is read once per render. A ref captures the previous
// value so we can compare its position in `order` with the new one. The
// resulting direction (`1` for forward, `-1` for back) is used to compute
// `initial.x` for `<Tabs.Animate>`. The component handles the rest (re-key
// on change, motion/reduced-motion fallback).
// ---------------------------------------------------------------------------

function useTabsDirection(order: readonly string[]): 1 | -1 {
  const value = String(useTabsValue() ?? "");
  const prevRef = useRef(value);
  const currentIdx = order.indexOf(value);
  const prevIdx = order.indexOf(prevRef.current);
  const direction: 1 | -1 = currentIdx === -1 || prevIdx === -1 || currentIdx >= prevIdx ? 1 : -1;
  // `order` is intentionally omitted — we only track `value` changes via prevRef,
  // not index shifts from a reordered array.
  useEffect(() => {
    prevRef.current = value;
  }, [value]);
  return direction;
}

function DirectionAwarePanel({
  order,
  children,
}: {
  order: readonly string[];
  children: ReactNode;
}) {
  const direction = useTabsDirection(order);
  return (
    <Tabs.Animate
      initial={{ x: direction * 32, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
    >
      {children}
    </Tabs.Animate>
  );
}

export function TabsDirectionExample() {
  const order = ROUTES.map((r) => r.value);
  const [tab, setTab] = useState<string>("home");
  const active = ROUTES.find((r) => r.value === tab) ?? ROUTES[0];

  return (
    <Container>
      <Tabs.Root value={tab} onValueChange={(v) => setTab(v as string)}>
        <Tabs.List>
          {ROUTES.map((r) => (
            <Tabs.Tab key={r.value} value={r.value}>
              {r.label}
            </Tabs.Tab>
          ))}
          <Tabs.Indicator />
        </Tabs.List>
        <div className="mt-3 min-h-24 overflow-hidden">
          <DirectionAwarePanel order={order}>
            <p className="p-4">{active.body}</p>
          </DirectionAwarePanel>
        </div>
      </Tabs.Root>
    </Container>
  );
}

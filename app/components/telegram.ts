"use client";

import { useEffect, useRef } from "react";

// Minimal typing of the Telegram Web App SDK surface we use.
export interface TGMainButton {
  setText: (t: string) => void;
  show: () => void;
  hide: () => void;
  enable: () => void;
  disable: () => void;
  setParams?: (p: { color?: string; text_color?: string }) => void;
  onClick: (cb: () => void) => void;
  offClick: (cb: () => void) => void;
}
export interface TGBackButton {
  show: () => void;
  hide: () => void;
  onClick: (cb: () => void) => void;
  offClick: (cb: () => void) => void;
}
export interface TG {
  ready: () => void;
  expand: () => void;
  colorScheme?: "light" | "dark";
  initDataUnsafe?: { user?: { first_name?: string } };
  onEvent?: (e: string, cb: () => void) => void;
  offEvent?: (e: string, cb: () => void) => void;
  setHeaderColor?: (c: string) => void;
  setBackgroundColor?: (c: string) => void;
  disableVerticalSwipes?: () => void;
  enableVerticalSwipes?: () => void;
  MainButton?: TGMainButton;
  BackButton?: TGBackButton;
  HapticFeedback?: {
    impactOccurred?: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred?: (type: "error" | "success" | "warning") => void;
  };
}

export function getTG(): TG | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { Telegram?: { WebApp?: TG } }).Telegram?.WebApp ?? null;
}

export function haptic(type: "success" | "warning" | "error" | "tap") {
  const h = getTG()?.HapticFeedback;
  if (!h) return;
  try {
    if (type === "tap") h.impactOccurred?.("light");
    else h.notificationOccurred?.(type);
  } catch {}
}

export function firstName(): string {
  return getTG()?.initDataUnsafe?.user?.first_name || "";
}

export function applyThemeChrome() {
  const tg = getTG();
  if (!tg) return;
  const dark = tg.colorScheme === "dark";
  document.documentElement.dataset.theme = dark ? "night" : "day";
  const bg = dark ? "#181310" : "#f4efe4";
  try {
    tg.setHeaderColor?.(bg);
    tg.setBackgroundColor?.(bg);
  } catch {}
}

const BTN_COLORS = { grace: "#2d6a4f", warfare: "#8b3a2a" };

/**
 * Drives Telegram's native MainButton for a flow step. Returns nothing —
 * callers also render an in-page fallback button and hide it with the
 * `tg-has-mainbutton` class this hook sets on <html> while it is active.
 */
export function useMainButton(opts: {
  visible: boolean;
  text: string;
  disabled?: boolean;
  tone?: "grace" | "warfare";
  onClick: () => void;
}) {
  const { visible, text, disabled = false, tone = "grace", onClick } = opts;
  const cbRef = useRef(onClick);
  useEffect(() => { cbRef.current = onClick; });

  useEffect(() => {
    const mb = getTG()?.MainButton;
    if (!mb) return;
    if (!visible) { mb.hide(); document.documentElement.classList.remove("tg-has-mainbutton"); return; }

    const handler = () => cbRef.current();
    mb.setText(text);
    try { mb.setParams?.({ color: BTN_COLORS[tone], text_color: "#f6f1e6" }); } catch {}
    if (disabled) mb.disable(); else mb.enable();
    mb.onClick(handler);
    mb.show();
    document.documentElement.classList.add("tg-has-mainbutton");
    return () => {
      mb.offClick(handler);
      mb.hide();
      document.documentElement.classList.remove("tg-has-mainbutton");
    };
  }, [visible, text, disabled, tone]);
}

/** Native BackButton while a flow is open; falls back to nothing in browsers. */
export function useBackButton(active: boolean, onBack: () => void) {
  const cbRef = useRef(onBack);
  useEffect(() => { cbRef.current = onBack; });
  useEffect(() => {
    const bb = getTG()?.BackButton;
    if (!bb || !active) return;
    const handler = () => cbRef.current();
    bb.onClick(handler);
    bb.show();
    return () => { bb.offClick(handler); bb.hide(); };
  }, [active]);
}

/** A scroll must never dismiss a confession: lock swipe-to-close during flows. */
export function useSwipeLock(active: boolean) {
  useEffect(() => {
    const tg = getTG();
    if (!tg || !active) return;
    try { tg.disableVerticalSwipes?.(); } catch {}
    return () => { try { tg.enableVerticalSwipes?.(); } catch {} };
  }, [active]);
}

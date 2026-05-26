import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type EffectiveTheme = "light" | "dark";

const STORAGE_KEY = "namu-topic-theme";

function getSystemDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(mode: ThemeMode): EffectiveTheme {
  if (typeof document === "undefined") return "dark";
  const root = document.documentElement;
  const effective: EffectiveTheme = mode === "system" ? (getSystemDark() ? "dark" : "light") : mode;
  root.classList.toggle("dark", effective === "dark");
  root.dataset.theme = effective;
  return effective;
}

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  });

  useEffect(() => {
    applyTheme(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, [mode]);

  // 시스템 변경 감지 (system 모드일 때만 반응)
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  const setMode = (next: ThemeMode) => setModeState(next);

  return { mode, setMode };
}

/** 현재 html에 적용된 실제(light|dark) 테마를 구독. recharts 등에서 사용. */
export function useEffectiveTheme(): EffectiveTheme {
  const [theme, setTheme] = useState<EffectiveTheme>(() => {
    if (typeof document === "undefined") return "dark";
    const t = document.documentElement.dataset.theme;
    if (t === "light" || t === "dark") return t;
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    const update = () => {
      const t = document.documentElement.dataset.theme;
      if (t === "light" || t === "dark") {
        setTheme(t);
      } else {
        setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
      }
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });
    return () => observer.disconnect();
  }, []);

  return theme;
}

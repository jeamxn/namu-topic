import { useTheme, type ThemeMode } from "../hooks/useTheme";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { mode, setMode } = useTheme();

  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-md border border-zinc-200 dark:border-zinc-800 p-0.5 ${className}`}
      role="radiogroup"
      aria-label="테마 선택">
      <ToggleButton active={mode === "light"} onClick={() => setMode("light")} label="라이트 모드">
        <SunIcon />
      </ToggleButton>
      <ToggleButton active={mode === "dark"} onClick={() => setMode("dark")} label="다크 모드">
        <MoonIcon />
      </ToggleButton>
      <ToggleButton active={mode === "system"} onClick={() => setMode("system")} label="시스템 설정">
        <MonitorIcon />
      </ToggleButton>
    </div>
  );
}

interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}

function ToggleButton({ active, onClick, label, children }: ToggleButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center transition-colors ${
        active
          ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      }`}>
      {children}
    </button>
  );
}

function SunIcon() {
  return (
    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path strokeLinecap="round" d="M8 20h8M12 16v4" />
    </svg>
  );
}

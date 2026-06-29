import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme, switchable } = useTheme();

  if (!switchable || !toggleTheme) return null;

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 active:scale-[0.92] ${
        theme === "dark"
          ? "bg-slate-700/60 border border-slate-600/50 hover:bg-slate-600/60 text-amber-300"
          : "bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700"
      } ${className}`}
      title={theme === "dark" ? "التبديل للوضع الفاتح" : "التبديل للوضع الداكن"}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <>
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className="text-[11px] font-medium hidden sm:inline">نهاري</span>
        </>
      ) : (
        <>
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          <span className="text-[11px] font-medium hidden sm:inline">ليلي</span>
        </>
      )}
    </button>
  );
}

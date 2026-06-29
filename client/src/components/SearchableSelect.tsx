import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  allowOther?: boolean;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
  isDark?: boolean;
  size?: "sm" | "md";
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "اختر...",
  emptyMessage = "لا توجد خيارات",
  allowOther = true,
  otherValue = "",
  onOtherChange,
  isDark = false,
  size = "sm",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const filtered = search
    ? options.filter((opt) => opt.includes(search))
    : options;

  // Calculate dropdown position relative to viewport
  const updatePosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = Math.min(320, (filtered.length + (allowOther ? 1 : 0)) * 36 + 50);
      
      // If not enough space below, open above
      const top = spaceBelow < dropdownHeight && rect.top > dropdownHeight
        ? rect.top - dropdownHeight - 4 + window.scrollY
        : rect.bottom + 4 + window.scrollY;
      
      setDropdownPos({
        top,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 220),
      });
    }
  }, [filtered.length, allowOther]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on scroll of parent containers
  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => {
      updatePosition();
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [isOpen, updatePosition]);

  const isOther = value === "أخرى";
  const displayValue = isOther ? "أخرى" : value;

  const textSize = size === "sm" ? "text-[13px]" : "text-[14px]";
  const py = size === "sm" ? "py-2.5" : "py-3";

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (next) {
            updatePosition();
            setTimeout(() => inputRef.current?.focus(), 80);
          }
        }}
        className={`w-full px-4 ${py} ${
          "bg-slate-50 border-slate-200 text-slate-800 hover:border-cyan-400"
        } border rounded-xl ${textSize} text-right flex items-center justify-between gap-2 transition-all duration-150 min-h-[44px] ${
          isOpen ? ("border-cyan-400 ring-2 ring-cyan-400/10") : ""
        }`}
      >
        <span className={`truncate ${!displayValue ? ("text-slate-400") : ""}`}>
          {displayValue || placeholder}
        </span>
        <svg className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${"text-slate-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown - rendered via Portal to avoid overflow:hidden clipping */}
      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 9999,
          }}
          className={`${
            "bg-white border-slate-200 shadow-2xl shadow-black/15"
          } border rounded-xl overflow-hidden`}
        >
          {/* Search input */}
          <div className={`p-2 border-b ${"border-slate-100"}`}>
            <div className="relative">
              <svg className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${"text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث..."
                className={`w-full pr-8 pl-3 py-2.5 ${
                  "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400"
                } border rounded-lg text-[13px] outline-none focus:border-cyan-400/60 transition-all`}
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-[260px] overflow-y-auto overscroll-contain">
            {filtered.length === 0 && !allowOther && (
              <div className={`px-3 py-4 text-xs ${"text-slate-400"} text-center`}>
                {emptyMessage}
              </div>
            )}
            {filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                  setSearch("");
                }}
                className={`w-full text-right px-4 py-3 text-[13px] transition-colors ${
                  value === opt
                    ? "bg-cyan-50 text-cyan-700 font-medium"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {opt}
              </button>
            ))}
            {allowOther && (
              <button
                type="button"
                onClick={() => {
                  onChange("أخرى");
                  setIsOpen(false);
                  setSearch("");
                }}
                className={`w-full text-right px-4 py-3 text-[13px] border-t transition-colors ${
                  isOther
                    ? "bg-amber-50 text-amber-700 font-medium border-slate-100"
                    : "text-amber-600 hover:bg-amber-50/50 border-slate-100"
                }`}
              >
                أخرى (كتابة يدوية)
              </button>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Custom input for "other" */}
      {isOther && onOtherChange && (
        <input
          type="text"
          value={otherValue}
          onChange={(e) => onOtherChange(e.target.value)}
          placeholder="اكتب هنا..."
          className={`w-full px-3 py-2 ${
            "bg-amber-50 border-amber-200 text-slate-800 placeholder:text-slate-400"
          } border rounded-lg text-xs focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all`}
        />
      )}
    </div>
  );
}

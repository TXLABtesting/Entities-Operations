import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { TeamRegistration, checkTeamRegistrationComplete } from "@/components/TeamRegistration";
import { BRAND } from "@/lib/brand";

const AI_LOGO = BRAND.logoColor;
const AI_LOGO_WHITE = BRAND.logoWhite;

// Professional detailed SVG icons for each track
const OperationsIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10 sm:w-12 sm:h-12">
    <circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M24 18v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M24 4v4M24 40v4M4 24h4M40 24h4M9.86 9.86l2.83 2.83M35.31 35.31l2.83 2.83M9.86 38.14l2.83-2.83M35.31 12.69l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="24" cy="24" r="3" fill="currentColor" opacity="0.3" />
  </svg>
);

const ServicesIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10 sm:w-12 sm:h-12">
    <rect x="6" y="8" width="36" height="32" rx="4" stroke="currentColor" strokeWidth="2" />
    <path d="M6 16h36" stroke="currentColor" strokeWidth="2" />
    <circle cx="11" cy="12" r="1.5" fill="currentColor" opacity="0.5" />
    <circle cx="16" cy="12" r="1.5" fill="currentColor" opacity="0.5" />
    <circle cx="21" cy="12" r="1.5" fill="currentColor" opacity="0.5" />
    <rect x="12" y="22" width="10" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
    <rect x="12" y="32" width="10" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    <rect x="26" y="22" width="10" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
    <path d="M14 25h6M14 26.5h4" stroke="currentColor" strokeWidth="1" opacity="0.4" />
  </svg>
);

const CapacityIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10 sm:w-12 sm:h-12">
    <path d="M24 6l18 10v16L24 42 6 32V16L24 6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M24 22l18-10M24 22v20M24 22L6 12" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    <circle cx="24" cy="14" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M20 28l4 3 4-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 32l6 4 6-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
  </svg>
);

const TechIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10 sm:w-12 sm:h-12">
    <rect x="8" y="6" width="32" height="24" rx="3" stroke="currentColor" strokeWidth="2" />
    <path d="M18 42h12M24 30v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M16 16l4 4-4 4M26 16h6M26 24h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="36" cy="10" r="2" fill="currentColor" opacity="0.3" />
    <path d="M12 10h8" stroke="currentColor" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
  </svg>
);

const StrategyIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10 sm:w-12 sm:h-12">
    <path d="M8 38V22l8-6v22H8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M20 38V18l8-6v26h-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M32 38V14l8-6v30h-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M8 38h32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="20" r="1.5" fill="currentColor" opacity="0.4" />
    <circle cx="24" cy="16" r="1.5" fill="currentColor" opacity="0.4" />
    <circle cx="36" cy="12" r="1.5" fill="currentColor" opacity="0.4" />
    <path d="M12 20l12-4 12-4" stroke="currentColor" strokeWidth="1" opacity="0.3" strokeDasharray="2 2" />
  </svg>
);

const tracks = [
  {
    id: 3,
    name: "بناء القدرات والتدريب",
    desc: "تأهيل الكوادر الوطنية وبناء القدرات في مجال الذكاء الاصطناعي",
    icon: <CapacityIcon />,
    gradient: "from-emerald-400 to-teal-500",
    bgGradientDark: "from-emerald-500/10 to-teal-500/5",
    bgGradientLight: "from-emerald-50/80 to-teal-50/60",
    borderColorDark: "border-emerald-500/20 hover:border-emerald-400/50",
    borderColorLight: "border-emerald-200/80 hover:border-emerald-400",
    iconBg: "from-emerald-400 to-teal-500",
    accentColor: "text-emerald-400",
    number: "01",
  },
  {
    id: 4,
    name: "تقنيات الذكاء الاصطناعي والبيانات",
    desc: "تطوير البنية التحتية التقنية وإدارة البيانات الحكومية",
    icon: <TechIcon />,
    gradient: "from-violet-400 to-purple-600",
    bgGradientDark: "from-violet-500/10 to-purple-600/5",
    bgGradientLight: "from-violet-50/80 to-purple-50/60",
    borderColorDark: "border-violet-500/20 hover:border-violet-400/50",
    borderColorLight: "border-violet-200/80 hover:border-violet-400",
    iconBg: "from-violet-400 to-purple-600",
    accentColor: "text-violet-400",
    number: "02",
  },
  {
    id: 1,
    name: "العمليات والدعم المؤسسي",
    desc: "تحويل العمليات الداخلية والدعم المؤسسي باستخدام الذكاء الاصطناعي",
    icon: <OperationsIcon />,
    gradient: "from-sky-500 to-blue-600",
    bgGradientDark: "from-sky-500/10 to-blue-600/5",
    bgGradientLight: "from-sky-50/80 to-blue-50/60",
    borderColorDark: "border-sky-500/20 hover:border-sky-400/50",
    borderColorLight: "border-sky-200/80 hover:border-sky-400",
    iconBg: "from-sky-500 to-blue-600",
    accentColor: "text-sky-400",
    number: "03",
  },
  {
    id: 5,
    name: "العمل الحكومي الاستراتيجي",
    desc: "توظيف الذكاء الاصطناعي في صنع القرار والتخطيط الاستراتيجي",
    icon: <StrategyIcon />,
    gradient: "from-rose-400 to-pink-600",
    bgGradientDark: "from-rose-500/10 to-pink-600/5",
    bgGradientLight: "from-rose-50/80 to-pink-50/60",
    borderColorDark: "border-rose-500/20 hover:border-rose-400/50",
    borderColorLight: "border-rose-200/80 hover:border-rose-400",
    iconBg: "from-rose-400 to-pink-600",
    accentColor: "text-rose-400",
    number: "04",
  },
  {
    id: 2,
    name: "الخدمات",
    desc: "تطوير الخدمات الحكومية الرقمية وتحسين تجربة المتعاملين",
    icon: <ServicesIcon />,
    gradient: "from-amber-400 to-orange-500",
    bgGradientDark: "from-amber-500/10 to-orange-500/5",
    bgGradientLight: "from-amber-50/80 to-orange-50/60",
    borderColorDark: "border-amber-500/20 hover:border-amber-400/50",
    borderColorLight: "border-amber-200/80 hover:border-amber-400",
    iconBg: "from-amber-400 to-orange-500",
    accentColor: "text-amber-400",
    number: "05",
  },
];



// Save selected paths to localStorage
const SELECTED_PATHS_KEY = "selectedPaths";

function getSelectedPaths(): number[] {
  try {
    const raw = localStorage.getItem(SELECTED_PATHS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveSelectedPaths(paths: number[]) {
  localStorage.setItem(SELECTED_PATHS_KEY, JSON.stringify(paths));
}

// Calculate track completion percentage from saved data
function getTrackCompletion(trackId: number): { percent: number; status: "empty" | "in-progress" | "completed" } {
  const key = `workplan_track_${trackId}_v2`;
  const raw = localStorage.getItem(key);
  if (!raw) return { percent: 0, status: "empty" };
  try {
    const data = JSON.parse(raw);
    const fields = data.fields || {};
    const tables = data.tables || {};
    // Count filled fields
    const fieldKeys = Object.keys(fields);
    const filledFields = fieldKeys.filter((k) => fields[k] && fields[k].trim() !== "").length;
    // Count table rows with data
    const tableKeys = Object.keys(tables);
    let tableScore = 0;
    let tableTotal = 0;
    tableKeys.forEach((k) => {
      const rows = tables[k] || [];
      rows.forEach((row: Record<string, string>) => {
        const vals = Object.values(row);
        tableTotal += vals.length;
        tableScore += vals.filter((v) => v && String(v).trim() !== "").length;
      });
    });
    // Total score
    const totalPossible = Math.max(fieldKeys.length + tableTotal, 1);
    const totalFilled = filledFields + tableScore;
    const percent = Math.min(Math.round((totalFilled / totalPossible) * 100), 100);
    if (percent === 0) return { percent: 0, status: "empty" };
    if (percent >= 90) return { percent, status: "completed" };
    return { percent, status: "in-progress" };
  } catch {
    return { percent: 0, status: "empty" };
  }
}

export default function TracksList() {
  const [loaded, setLoaded] = useState(false);
  const [trackStats, setTrackStats] = useState<{ percent: number; status: "empty" | "in-progress" | "completed" }[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<number[]>([]);
  const [showTeamReg, setShowTeamReg] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    setTimeout(() => setLoaded(true), 50);
    // Calculate completion for all tracks
    const stats = tracks.map((t) => getTrackCompletion(t.id));
    setTrackStats(stats);
    // Load previously selected paths
    const saved = getSelectedPaths();
    if (saved.length > 0) {
      setSelectedTracks(saved);
    }
  }, []);

  const selectTrack = (trackId: number) => {
    // Check if team registration is complete before allowing navigation
    if (!checkTeamRegistrationComplete()) {
      setShowTeamReg(true);
      return;
    }
    const newSelection = [trackId];
    setSelectedTracks(newSelection);
    saveSelectedPaths(newSelection);
    // Navigate directly to the selected track
    navigate(`/workplan/${trackId}`);
  };

  return (
    <div
      className={`min-h-screen flex flex-col relative overflow-hidden ${
        "bg-gradient-to-b from-[#f5f8fc] to-[#edf2f9]"
      }`}
      dir="rtl"
      style={{ fontFamily: 'Tajawal, "IBM Plex Sans Arabic", sans-serif' }}
    >
      {/* Ambient background effects */}
      <div className="absolute inset-0 pointer-events-none">
        {(
          <>
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-200/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-100/25 rounded-full blur-[100px]" />
          </>
        )}
      </div>

      {/* Header - Both logos */}
      <header className="relative z-10 px-5 sm:px-8 pt-5 pb-3">
        <div className="flex items-center justify-between">
          {/* Right: AI Logo */}
          <img
            alt="مشروع الذكاء الاصطناعي المساعد"
            className="h-16 sm:h-24 object-contain"
src={AI_LOGO}
           />
          {/* Center spacer */}
          <div className="flex items-center gap-2"><Link href="/" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-medium ${
              "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            }`}>
              <ArrowLeft className="w-3.5 h-3.5" />
              رجوع
            </Link>
          </div>
          {/* Left: spacer for balance */}
          <div className="h-16 sm:h-24 w-16 sm:w-24" />
        </div>
      </header>

      {/* Title */}
      <div className={`relative z-10 flex flex-col items-center gap-1 px-4 pt-1 pb-3 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <h1 className={`text-lg sm:text-xl font-bold tracking-tight ${"text-[#0a1628]"}`}>
          مشروع الذكاء الاصطناعي المساعد
        </h1>
      </div>

      {/* Team Registration button - prominent */}
      <div className={`relative z-10 flex items-center justify-center px-4 pb-5 transition-all duration-700 delay-100 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <button
          onClick={() => setShowTeamReg(true)}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-bold transition-all active:scale-[0.97] shadow-lg hover:shadow-xl hover:scale-[1.02] ${
            "bg-gradient-to-l from-blue-500 to-indigo-600 text-white border-2 border-blue-400/50 hover:from-blue-600 hover:to-indigo-700 shadow-blue-500/25"
          }`}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          تسجيل فرق العمل
        </button>
      </div>

      {/* Team Registration Modal */}
      {showTeamReg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowTeamReg(false)} />
          <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <TeamRegistration onClose={() => setShowTeamReg(false)} />
          </div>
        </div>
      )}

      {/* Tracks Grid - Horizontal layout */}
      <div className="relative z-10 flex-1 px-4 sm:px-6 lg:px-10 xl:px-16 pb-4">
        <div className="max-w-7xl mx-auto">
          {/* Grid: 5 cards in a row on large screens, 3 on medium, 2 on small */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
            {tracks.map((track, idx) => {
              const isSelected = selectedTracks.includes(track.id);
              return (
                <div
                  key={track.id}
                  onClick={() => selectTrack(track.id)}
                  className={`group relative flex flex-col items-center text-center p-5 sm:p-6 rounded-2xl bg-white border ${
                    isSelected
                      ? "border-blue-500 ring-1 ring-blue-500/40 shadow-md shadow-blue-100"
                      : "border-slate-200 group-hover:border-blue-300"
                  } transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer h-full ${
                    loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                  } hover:shadow-md hover:shadow-slate-200/70`}
                  style={{ transitionDelay: `${idx * 80}ms` }}
                >
                  {/* Track number badge */}
                  <div className="absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">
                    {track.number}
                  </div>

                  {/* Icon container */}
                  <div className={`relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl flex items-center justify-center mb-5 transition-colors duration-300 ${
                    isSelected ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                  }`}>
                    <div className="relative z-10">
                      {track.icon}
                    </div>
                  </div>

                  {/* Text content */}
                  <h3 className="text-sm sm:text-base font-bold mb-2 leading-snug text-[#0a1628]">
                    {track.name}
                  </h3>
                  <p className={`text-[11px] sm:text-xs leading-relaxed transition-colors line-clamp-2 ${
                    "text-slate-500 group-hover:text-slate-700"
                  }`}>
                    {track.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className={`relative z-10 px-6 py-5 text-center border-t ${"border-slate-200/60"}`}>
        <p className={`text-[11px] tracking-wide ${"text-slate-400"}`}>
          © 2026 وزارة شؤون مجلس الوزراء، جميع الحقوق محفوظة
        </p>
      </footer>
    </div>
  );
}

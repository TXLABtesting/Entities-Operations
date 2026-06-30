import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { TeamRegistration } from "@/components/TeamRegistration";
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

// Determine track completion from saved data using meaningful milestones, so a
// track is only "completed" when all of its applicable steps are genuinely done
// — not when a single cell happens to be filled.
function getTrackCompletion(trackId: number): { percent: number; status: "empty" | "in-progress" | "completed" } {
  const key = `workplan_track_${trackId}_v2`;
  const raw = localStorage.getItem(key);
  if (!raw) return { percent: 0, status: "empty" };
  try {
    const data = JSON.parse(raw);
    const f: Record<string, string> = data.fields || {};
    const t: Record<string, Array<Record<string, string>>> = data.tables || {};
    const has = (v?: string) => !!v && String(v).trim() !== "";
    const trackName = tracks.find((tk) => tk.id === trackId)?.name || "";

    // Tracks 3 & 4 hide the operations/targets sections.
    const hasOpsSections = ![3, 4].includes(trackId);
    // Ignore the auto-filled track reference (set just by opening the form).
    const isAuto = (k: string, v: string) => (k === "track" || k === "relatedTrack") && v === trackName;

    // --- track-specific signals (shared contact info does NOT count) ---
    const opsRows = t.tblOps || [];
    const opsAny = opsRows.some((r) => has(r.taskName) || has(r.subActivities));
    const opsDone = opsRows.some((r) => has(r.taskName) && has(r.eligibility) && has(r.readiness));
    const projAny = (t.tblExisting || []).some((r) => Object.entries(r).some(([k, v]) => has(v) && !isAuto(k, v)));
    const phaseEntries = data.phaseEntries || {};
    const timelineAny = Object.values(phaseEntries).some((arr: any) => Array.isArray(arr) && arr.some((e: any) => has(e?.desc)));
    const targetsAny = has(f.outcome1) || has(f.output1) || has(f.aiModelsCount);
    const targetsDone = (has(f.outcome1) || has(f.output1)) && has(f.aiModelsCount);

    // Completion milestones (applicable to this track)
    const milestones: boolean[] = [projAny];
    if (hasOpsSections) { milestones.push(opsDone, targetsDone); }
    milestones.push(timelineAny);
    const done = milestones.filter(Boolean).length;
    const total = milestones.length;

    // "Started" only when real track-specific content exists — not on open.
    const started = opsAny || projAny || timelineAny || (hasOpsSections && targetsAny);
    if (!started) return { percent: 0, status: "empty" };

    if (done === total && total > 0) return { percent: 100, status: "completed" };
    const percent = Math.round((done / total) * 100);
    return { percent: Math.max(percent, 5), status: "in-progress" };
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
    // Team registration is optional — open the track form directly so users can
    // fill the models themselves. The "تسجيل فرق العمل" button remains available.
    const newSelection = [trackId];
    setSelectedTracks(newSelection);
    saveSelectedPaths(newSelection);
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

      {/* Logo — centered */}
      <div className={`relative z-10 flex justify-center pt-6 pb-5 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <img alt="مشروع الذكاء الاصطناعي المساعد" className="h-12 sm:h-16 object-contain" src={AI_LOGO} />
      </div>

      {/* Header bar — within the cards' width */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 xl:px-16 pb-6">
        <div className={`flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-gradient-to-l from-slate-50 to-white shadow-[0_4px_18px_-10px_rgba(15,23,42,0.15)] px-5 sm:px-7 py-4 transition-all duration-700 delay-100 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}`}>
          {/* right: back arrow + title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" title="رجوع" className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M14 5l7 7-7 7M21 12H3" /></svg>
            </Link>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-[#0a1628] truncate">
              مشروع الذكاء الاصطناعي المساعد
            </h1>
          </div>
          {/* left: primary action */}
          <button
            onClick={() => setShowTeamReg(true)}
            className="flex-shrink-0 flex items-center gap-2.5 px-5 sm:px-6 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.97] shadow-lg hover:shadow-xl bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/25"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="hidden sm:inline">تسجيل فرق العمل</span>
            <span className="sm:hidden">الفرق</span>
          </button>
        </div>
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
              const stat = trackStats[idx] || { percent: 0, status: "empty" as const };
              const active = stat.status !== "empty";
              const statusMeta =
                stat.status === "completed"
                  ? { label: "مكتمل", cls: "bg-blue-50 text-blue-700", cta: "مراجعة" }
                  : stat.status === "in-progress"
                  ? { label: `قيد التعبئة · ${stat.percent}%`, cls: "bg-blue-50 text-blue-600", cta: "متابعة التعبئة" }
                  : { label: "لم يبدأ", cls: "bg-slate-100 text-slate-400", cta: "ابدأ التعبئة" };
              return (
                <div
                  key={track.id}
                  onClick={() => selectTrack(track.id)}
                  className={`group relative flex flex-col items-center text-center p-5 sm:p-6 rounded-3xl bg-white border transition-all duration-300 hover:-translate-y-1 active:scale-[0.99] cursor-pointer h-full ${
                    active
                      ? "border-blue-300 ring-1 ring-blue-200 shadow-[0_12px_28px_-10px_rgba(37,99,235,0.35)]"
                      : "border-slate-100 shadow-[0_6px_22px_-12px_rgba(15,23,42,0.18)] hover:shadow-[0_14px_30px_-12px_rgba(15,23,42,0.22)]"
                  } ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                  style={{ transitionDelay: `${idx * 80}ms` }}
                >
                  {/* Track number badge */}
                  <div className="absolute top-4 left-4 text-[10px] font-bold tracking-wider text-slate-300">
                    {track.number}
                  </div>

                  {/* Icon container */}
                  <div className={`relative w-16 h-16 sm:w-[68px] sm:h-[68px] rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 ${
                    active
                      ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                      : "bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500"
                  }`}>
                    {stat.status === "completed" && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </span>
                    )}
                    <div className="relative z-10">{track.icon}</div>
                  </div>

                  {/* Text content */}
                  <h3 className="text-sm sm:text-base font-bold mb-2 leading-snug text-[#0a1628]">
                    {track.name}
                  </h3>
                  <p className="text-[11px] sm:text-xs leading-relaxed line-clamp-2 text-slate-400 group-hover:text-slate-500 transition-colors">
                    {track.desc}
                  </p>

                  {/* Status + CTA pinned to the bottom (equal-height cards) */}
                  <div className="mt-auto w-full pt-5 flex flex-col items-center gap-3">
                    <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full ${statusMeta.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-current" : "bg-slate-300"}`} />
                      {statusMeta.label}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); selectTrack(track.id); }}
                      className={`w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[12.5px] font-bold transition-all active:scale-[0.98] ${
                        active ? "bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-500/20" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      }`}
                    >
                      {statusMeta.cta}
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress summary — dotted connector + completed count */}
          <div className="hidden xl:flex items-center justify-center gap-0 mt-8">
            <span className="flex-1 max-w-[180px] border-t border-dashed border-slate-300" />
            <div className="mx-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm">
              <span className={`w-2 h-2 rounded-full ${trackStats.some((s) => s.status !== "empty") ? "bg-blue-500" : "bg-slate-300"}`} />
              <span className="text-[12px] font-bold text-slate-600">{trackStats.filter((s) => s.status === "completed").length} من {tracks.length} مسارات مكتملة</span>
            </div>
            <span className="flex-1 max-w-[180px] border-t border-dashed border-slate-300" />
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

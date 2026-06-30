import { useEffect, useState } from "react";
import { reviewReadiness, aiReviewEnabled, type EnrichedReport } from "@/lib/aiReview";
import type { Finding, PlanState, Severity, FindingCategory } from "@/lib/readiness";
import { READY_THRESHOLD } from "@/lib/readiness";

const SEVERITY_META: Record<Severity, { label: string; dot: string; chip: string }> = {
  blocker: { label: "حرِج", dot: "bg-red-500", chip: "bg-red-50 text-red-700 border-red-200" },
  warning: { label: "ملاحظة", dot: "bg-amber-500", chip: "bg-amber-50 text-amber-700 border-amber-200" },
  suggestion: { label: "اقتراح", dot: "bg-sky-500", chip: "bg-sky-50 text-sky-700 border-sky-200" },
};

const CATEGORY_LABEL: Record<FindingCategory, string> = {
  completeness: "اكتمال",
  agentReadiness: "جاهزية الأتمتة",
  clarity: "وضوح",
  consistency: "اتساق",
  artifacts: "عناصر داعمة",
};

function scoreColor(score: number) {
  if (score >= READY_THRESHOLD) return { ring: "#10b981", text: "text-emerald-600" };
  if (score >= 60) return { ring: "#f59e0b", text: "text-amber-600" };
  return { ring: "#ef4444", text: "text-red-600" };
}

function ScoreRing({ score }: { score: number }) {
  const { ring, text } = scoreColor(score);
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={ring} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 700ms ease" }} />
      </svg>
      <div className={`absolute inset-0 flex flex-col items-center justify-center ${text}`}>
        <span className="text-2xl font-extrabold leading-none">{score}%</span>
        <span className="text-[10px] text-slate-400 mt-0.5">جاهزية</span>
      </div>
    </div>
  );
}

function FindingCard({ f }: { f: Finding }) {
  const meta = SEVERITY_META[f.severity];
  return (
    <div className="flex gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
      <span className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${meta.dot}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${meta.chip}`}>{meta.label}</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">{CATEGORY_LABEL[f.category]}</span>
          <span className="text-[13px] font-bold text-slate-800">{f.title}</span>
        </div>
        <p className="text-[12.5px] leading-relaxed text-slate-600">{f.detail}</p>
        {f.location && <p className="text-[11px] text-slate-400 mt-1">↳ {f.location}</p>}
      </div>
    </div>
  );
}

export default function ReadinessReview({ plan, trackName, open, onClose, onProceed, onEditManually }: { plan: PlanState; trackName?: string; open: boolean; onClose: () => void; onProceed?: () => void; onEditManually?: () => void }) {
  const [report, setReport] = useState<EnrichedReport | null>(null);
  const [loading, setLoading] = useState(false);

  const run = () => {
    setLoading(true);
    const controller = new AbortController();
    reviewReadiness(plan, { trackName, signal: controller.signal })
      .then(setReport)
      .finally(() => setLoading(false));
    return () => controller.abort();
  };

  useEffect(() => {
    if (open) return run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/40 backdrop-blur-sm" dir="rtl" onClick={onClose}>
      <div className="relative w-full max-w-2xl my-6 bg-slate-50 rounded-2xl shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start gap-5 p-5 sm:p-6 border-b border-slate-200 bg-white rounded-t-2xl">
          {report ? <ScoreRing score={report.overallScore} /> : <div className="w-24 h-24 rounded-full bg-slate-100 animate-pulse flex-shrink-0" />}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-extrabold text-slate-800">مراجعة جاهزية الأتمتة</h2>
              {report?.ready && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">جاهز للاعتماد</span>}
              {report && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${report.aiUsed ? "bg-violet-50 text-violet-700 border-violet-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                  {report.aiUsed ? "مُحقَّق بالذكاء الاصطناعي" : aiReviewEnabled ? "فحص آلي" : "فحص آلي (دون اتصال بالذكاء الاصطناعي)"}
                </span>
              )}
            </div>
            <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">{loading ? "جارٍ تحليل البيانات…" : report?.summary}</p>
            {report && (
              <div className="flex items-center gap-3 mt-3 text-[11px]">
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" />{report.counts.blocker} حرِج</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" />{report.counts.warning} ملاحظة</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-500" />{report.counts.suggestion} اقتراح</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center flex-shrink-0 text-xl leading-none">×</button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-2.5 max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="space-y-2.5">
              {[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-white border border-slate-200 animate-pulse" />)}
            </div>
          )}
          {!loading && report && report.findings.length === 0 && (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center text-2xl mb-3">✓</div>
              <p className="text-sm font-bold text-slate-700">جميع البيانات مكتملة وواضحة.</p>
              <p className="text-[12px] text-slate-500 mt-1">يمكن اعتماد النموذج والمضي في الأتمتة.</p>
            </div>
          )}
          {!loading && report?.findings.map((f) => <FindingCard key={f.id} f={f} />)}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-200 bg-white rounded-b-2xl">
          <p className="text-[11px] text-slate-400">يتبع منطق خوارزمية الأولوية: الحجم، الجهد، الأثر، البيانات، الأنظمة، المخاطر.</p>
          <div className="flex items-center gap-2">
            <button onClick={run} disabled={loading} className="px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition-colors">إعادة الفحص</button>
            {onProceed ? (
              <>
                <button onClick={() => (onEditManually ? onEditManually() : onClose())} className="px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">{onEditManually ? "تعديل يدوي للنقاط" : "متابعة التعبئة"}</button>
                <button onClick={() => { onClose(); onProceed(); }} disabled={loading} className={`px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors disabled:opacity-50 ${report?.ready ? "bg-emerald-600 hover:bg-emerald-500" : "bg-blue-600 hover:bg-blue-500"}`}>
                  {report?.ready ? "اعتماد ومتابعة" : "المتابعة للمراجعة النهائية"}
                </button>
              </>
            ) : (
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors">إغلاق</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

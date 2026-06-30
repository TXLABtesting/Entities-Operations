import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

/**
 * "التجربة الجديدة" — the new, enhanced experience.
 * Scaffold only: layout/flow/design to be filled in per the upcoming spec.
 */
export default function StartNew() {
  return (
    <div
      className="min-h-screen flex flex-col bg-slate-50"
      dir="rtl"
      style={{ fontFamily: '"Sakkal Majalla", Tajawal, "IBM Plex Sans Arabic", sans-serif' }}
    >
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-lg">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white mx-auto flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L23 12l-7.714 2.143L13 21l-2.286-6.857L3 12l7.714-2.143L13 3z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">التجربة الجديدة</h1>
          <p className="text-sm text-slate-500 mt-3 leading-relaxed">
            هذه التجربة قيد التجهيز — سيتم بناؤها وفق التصميم والتوجيهات الجديدة.
          </p>
          <Link href="/">
            <button className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-all active:scale-[0.97]">
              العودة للرئيسية
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}

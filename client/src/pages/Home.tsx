import { Link } from "wouter";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { BRAND } from "@/lib/brand";

const AI_LOGO_SVG = BRAND.logoWhite;
const LANDING_BG = BRAND.landing;

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [bgLoaded, setBgLoaded] = useState(false);
  const [logoOk, setLogoOk] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    // Preload the optional background image; only fade it in if it actually exists.
    const img = new Image();
    img.onload = () => setBgLoaded(true);
    img.src = LANDING_BG;
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="min-h-screen overflow-hidden flex flex-col relative bg-[#0a1430]"
      dir="rtl"
      style={{ fontFamily: '"Sakkal Majalla", Tajawal, "IBM Plex Sans Arabic", sans-serif' }}
    >
      {/* Designed gradient base (always present, looks good even with no image) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(125%_125%_at_50%_-10%,#1b2c6b_0%,#0f1c44_45%,#070d22_100%)]" />
        {/* Soft glow accents */}
        <div className="absolute -top-32 right-1/4 h-[28rem] w-[28rem] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute bottom-[-8rem] left-1/4 h-[26rem] w-[26rem] rounded-full bg-violet-500/15 blur-[120px]" />
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        {/* Optional brand background image (fades in only if /brand/landing.webp exists) */}
        <img
          src={LANDING_BG}
          alt=""
          aria-hidden
          onLoad={() => setBgLoaded(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            bgLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
        {/* Readability overlay (only meaningful when an image is shown) */}
        {bgLoaded && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628]/70 via-[#0a1628]/45 to-[#070d22]/85" />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <main className="flex-1 flex items-center justify-center px-6">
          <div
            className={`flex flex-col items-center text-center transition-all duration-1000 ${
              loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {/* AI Project logo (full lockup). Falls back to a wordmark if missing. */}
            <div className="relative mb-9 md:mb-12 flex flex-col items-center">
              <div className="absolute -inset-16 rounded-full blur-3xl bg-white/10" />
              {logoOk ? (
                <img
                  alt="مشروع الذكاء الاصطناعي المساعد"
                  onError={() => setLogoOk(false)}
                  className="relative w-[380px] sm:w-[520px] md:w-[660px] lg:w-[760px] h-auto object-contain drop-shadow-2xl"
                  src={AI_LOGO_SVG}
                />
              ) : (
                <h1 className="relative text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.2] drop-shadow-2xl">
                  مشروع الذكاء الاصطناعي المساعد
                </h1>
              )}
              <p className="relative mt-6 text-base sm:text-lg text-white/70 max-w-xl">
                منصة تخطيط ومتابعة مسارات العمل الحكومي الذكي
              </p>
            </div>

            {/* Entrance Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Start old — existing experience */}
              <Link href="/tracks-list">
                <button className="group relative inline-flex items-center gap-3 px-10 sm:px-12 py-4 sm:py-5 rounded-2xl text-base sm:text-lg font-bold shadow-2xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:border-white/40 hover:shadow-white/10">
                  <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-400/0 via-white/10 to-violet-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="relative">النسخة الحالية</span>
                  <ArrowLeft className="relative w-5 h-5 group-hover:-translate-x-1 transition-transform text-white/70 group-hover:text-white" />
                </button>
              </Link>
              {/* Start new — enhanced experience */}
              <Link href="/start-new">
                <button className="group relative inline-flex items-center gap-3 px-10 sm:px-12 py-4 sm:py-5 rounded-2xl text-base sm:text-lg font-bold shadow-2xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] bg-white text-[#0f1c44] border border-white/40 hover:shadow-white/20">
                  <span className="relative inline-flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L23 12l-7.714 2.143L13 21l-2.286-6.857L3 12l7.714-2.143L13 3z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    التجربة الجديدة
                  </span>
                  <ArrowLeft className="relative w-5 h-5 group-hover:-translate-x-1 transition-transform text-blue-600/70 group-hover:text-blue-600" />
                </button>
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-4 text-center">
          <p className="text-[11px] tracking-wide text-slate-400/80">
            © 2026 وزارة شؤون مجلس الوزراء، جميع الحقوق محفوظة
          </p>
        </footer>
      </div>
    </div>
  );
}

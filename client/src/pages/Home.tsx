import { Link } from "wouter";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

const AI_LOGO_SVG = "/manus-storage/GOVSPRINTS-THELOGO_WHITE_bb9815e1.svg";
const LANDING_BG = "/manus-storage/landingpage_79f62bda.webp";

export default function Home() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  return (
    <div
      className="min-h-screen overflow-hidden flex flex-col relative"
      dir="rtl"
      style={{ fontFamily: '"Sakkal Majalla", Tajawal, "IBM Plex Sans Arabic", sans-serif' }}
    >
      {/* Full-screen background image */}
      <div className="absolute inset-0 z-0">
        <img
          src={LANDING_BG}
          alt=""
          className="w-full h-full object-cover"
        />
        {/* Dark gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628]/60 via-[#0a1628]/30 to-[#0a1628]/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Main content - centered AI logo + entrance button */}
        <main className="flex-1 flex items-center justify-center px-6">
          <div
            className={`flex flex-col items-center text-center transition-all duration-1000 ${
              loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {/* AI Project Logo - larger and colored */}
            <div className="relative mb-10 md:mb-14">
              <div className="absolute -inset-16 rounded-full blur-3xl bg-white/8" />
              <img
                alt="مشروع الذكاء الاصطناعي المساعد"
                className="relative w-[340px] sm:w-[460px] md:w-[580px] lg:w-[700px] xl:w-[800px] h-auto object-contain drop-shadow-2xl"
                src={AI_LOGO_SVG}
              />
            </div>

            {/* Entrance Button */}
            <Link href="/tracks-list">
              <button className="group relative inline-flex items-center gap-3 px-12 sm:px-16 py-4 sm:py-5 rounded-2xl text-lg sm:text-xl font-bold shadow-2xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:border-white/40 hover:shadow-white/10">
                <span>الدخول</span>
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform text-white/70 group-hover:text-white" />
              </button>
            </Link>


          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-4 text-center">
          <p className="text-[11px] tracking-wide text-slate-400">
            © 2026 وزارة شؤون مجلس الوزراء، جميع الحقوق محفوظة
          </p>
        </footer>
      </div>
    </div>
  );
}

import { Link } from "wouter";
import { useEffect, useState } from "react";
import {
  LayoutGrid, Sparkles, Bell, CircleDot, ArrowUpDown, Database,
  Route, Settings2, FileText, Building2, BarChart3, Clock
} from "lucide-react";
import { BRAND } from "@/lib/brand";

const AI_LOGO = BRAND.logoColor;
const AI_LOGO_WHITE = BRAND.logoWhite;

interface MenuItem {
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  gradient: string;
  href?: string;
}

interface MenuCategory {
  title: string;
  items: MenuItem[];
}

const menuCategories: MenuCategory[] = [
  {
    title: "لوحة التحكم",
    items: [
      { id: "dashboard", label: "لوحة المؤشرات", desc: "نظرة شاملة على الأداء", icon: <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6 text-white" />, gradient: "from-blue-500 to-cyan-400" },
      { id: "recommendations", label: "التوصيات الذكية", desc: "مقترحات مبنية على البيانات", icon: <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />, gradient: "from-purple-500 to-violet-400" },
      { id: "notifications", label: "الإشعارات", desc: "تنبيهات ومتابعات", icon: <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />, gradient: "from-orange-400 to-amber-300" },
    ],
  },
  {
    title: "إدارة العمليات",
    items: [
      { id: "operations", label: "أداة اختيار العمليات", desc: "تقييم واختيار العمليات", icon: <CircleDot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />, gradient: "from-emerald-500 to-teal-400" },
      { id: "priorities", label: "ترتيب الأولويات", desc: "تصنيف حسب الأهمية", icon: <ArrowUpDown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />, gradient: "from-green-500 to-emerald-400" },
      { id: "data-entry", label: "إدخال البيانات", desc: "إضافة وتعديل المبادرات", icon: <Database className="w-5 h-5 sm:w-6 sm:h-6 text-white" />, gradient: "from-teal-500 to-cyan-400" },
    ],
  },
  {
    title: "المسارات والتخطيط",
    items: [
      { id: "tracks", label: "المسارات", desc: "المسارات الخمسة الرئيسية", icon: <Route className="w-5 h-5 sm:w-6 sm:h-6 text-white" />, gradient: "from-blue-600 to-indigo-500", href: "/tracks-list" },
      { id: "track-ops", label: "إدخال عمليات المسارات", desc: "تعبئة عمليات كل مسار", icon: <Settings2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />, gradient: "from-indigo-500 to-purple-500" },
      { id: "workplan", label: "نموذج خطة العمل", desc: "خطة العمل التفصيلية", icon: <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />, gradient: "from-sky-500 to-blue-500", href: "/tracks-list" },
    ],
  },
  {
    title: "التقارير والمقارنات",
    items: [
      { id: "compare", label: "مقارنة الجهات", desc: "مقارنة أداء الجهات", icon: <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />, gradient: "from-rose-500 to-pink-400" },
      { id: "export", label: "المقارنة والتصدير", desc: "تصدير التقارير", icon: <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />, gradient: "from-amber-500 to-orange-400" },
      { id: "timeline", label: "الجدول الزمني", desc: "المراحل والمعالم", icon: <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />, gradient: "from-cyan-500 to-blue-400" },
    ],
  },
];

export default function Tracks() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 50);
  }, []);

  return (
    <div
      className="min-h-screen bg-gradient-to-bl from-[#0a1628] to-[#0f1f3d] flex flex-col"
      dir="rtl"
      style={{ fontFamily: 'Tajawal, "IBM Plex Sans Arabic", sans-serif' }}
    >
      {/* Header - AI logo on right */}
      <header className="flex items-center justify-between px-5 sm:px-8 pt-5 pb-3">
        <img
          alt="مشروع الذكاء الاصطناعي المساعد"
          className="h-16 sm:h-24 object-contain"
          src={AI_LOGO_WHITE}
        /><div className="h-16 sm:h-24 w-16 sm:w-24" />
      </header>

      {/* Title */}
      <div className="flex flex-col items-center gap-1 px-4 pb-4">
        <h1 className="text-white text-sm sm:text-base font-bold">
          مشروع الذكاء الاصطناعي المساعد
        </h1>
        <p className="text-blue-300/70 text-[9px] sm:text-[11px] tracking-wider">
          AGENTIC AI FOR UAE GOVERNMENT
        </p>
      </div>

      {/* Menu Grid */}
      <div className="flex-1 px-4 sm:px-6 pb-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-5">
          {menuCategories.map((category, catIdx) => (
            <div
              key={category.title}
              className={`transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              style={{ transitionDelay: `${catIdx * 100}ms` }}
            >
              {/* Category divider */}
              <div className="flex items-center gap-2 mb-2.5 px-1">
                <div className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
                <span className="text-slate-400 text-[11px] sm:text-xs font-medium tracking-wide">
                  {category.title}
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
              </div>

              {/* Items grid */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {category.items.map((item) => {
                  const content = (
                    <button
                      key={item.id}
                      className="group relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-400/20 hover:shadow-lg hover:shadow-blue-900/10 transition-all duration-300 hover:scale-[1.02] active:scale-[0.97] backdrop-blur-sm"
                    >
                      {/* Icon */}
                      <div className={`w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                        {item.icon}
                      </div>
                      {/* Label */}
                      <span className="text-slate-200 text-[10px] sm:text-xs font-medium text-center leading-tight group-hover:text-blue-300 transition-colors">
                        {item.label}
                      </span>
                      {/* Description */}
                      <span className="text-slate-400 text-[8px] sm:text-[9px] text-center leading-tight hidden sm:block">
                        {item.desc}
                      </span>
                    </button>
                  );

                  if (item.href) {
                    return (
                      <Link key={item.id} href={item.href}>
                        {content}
                      </Link>
                    );
                  }
                  return <div key={item.id}>{content}</div>;
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-4 text-center">
        <p className="text-[11px] tracking-wide text-slate-400">
          © 2026 وزارة شؤون مجلس الوزراء، جميع الحقوق محفوظة
        </p>
      </footer>

      {/* Bottom progress card */}
      <div className="px-4 sm:px-6 pb-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-slate-400 text-[9px]">المرحلة الحالية</p>
                  <h3 className="text-white text-xs sm:text-sm font-bold">التقييم والتهيئة</h3>
                </div>
              </div>
              <div className="text-left">
                <p className="text-blue-400 text-lg sm:text-xl font-bold">63%</p>
                <p className="text-slate-400 text-[9px]">إنجاز</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full w-[63%] bg-gradient-to-l from-blue-500 to-cyan-400 rounded-full transition-all duration-1000" />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-slate-400 text-[9px]">20 يوم منقضي</span>
              <span className="text-slate-400 text-[9px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                تحديث مباشر
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

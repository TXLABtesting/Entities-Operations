import { useState, useEffect, useCallback } from "react";
import { SearchableSelect } from "@/components/SearchableSelect";
import { Users, Building2, UserCheck, Phone, Mail, Briefcase, Plus, Trash2, ChevronLeft, ChevronRight, Save, AlertCircle, CheckCircle2, Shield, RotateCcw, Pencil } from "lucide-react";

// ===== CONSTANTS =====
const TRACKS = [
  "العمليات والدعم المؤسسي",
  "العمليات التخصصية",
  "الخدمات",
  "بناء القدرات والتدريب",
  "تقنيات الذكاء الاصطناعي والبيانات",
  "العمل الحكومي الاستراتيجي",
];

const FEDERAL_ENTITIES = [
  // الوزارات
  "وزارة المالية",
  "وزارة الداخلية",
  "وزارة الخارجية",
  "وزارة الدفاع",
  "وزارة الصحة ووقاية المجتمع",
  "وزارة الدولة لشؤون المجلس الوطني الاتحادي",
  "وزارة الطاقة والبنية التحتية",
  "وزارة الصناعة والتكنولوجيا المتقدمة",
  "وزارة الرياضة",
  "وزارة التجارة الخارجية",
  "وزارة تمكين المجتمع",
  "وزارة التربية والتعليم",
  "وزارة الاقتصاد والسياحة",
  "وزارة الموارد البشرية والتوطين",
  "وزارة التعليم العالي والبحث العلمي",
  "وزارة العدل",
  "وزارة الثقافة",
  "وزارة الاستثمار",
  "وزارة التغير المناخي والبيئة",
  "وزارة الأسرة",
  // الجهات الاتحادية
  "الهيئة الاتحادية للرقابة النووية",
  "الهيئة الاتحادية للضرائب",
  "الهيئة العامة للمعاشات والتأمينات الاجتماعية",
  "الهيئة العامة للطيران المدني",
  "الهيئة الاتحادية للموارد البشرية الحكومية",
  "الهيئة الاتحادية للهوية والجنسية والجمارك وأمن المنافذ",
  "الهيئة العامة لتنظيم قطاع الاتصالات والحكومة الرقمية",
  "الهيئة العامة للشؤون الإسلامية والأوقاف والزكاة",
  "الهيئة الوطنية للإعلام",
  "هيئة سوق المال",
  "مؤسسة الإمارات للخدمات الصحية",
  "مؤسسة الإمارات للدواء",
  "المؤسسة الاتحادية للشباب",
  "المركز الاتحادي للمعلومات الجغرافية",
  "جامعة الإمارات العربية المتحدة",
  "جامعة زايد",
  "مجمع كليات التقنية العليا",
  "مصرف الإمارات العربية المتحدة المركزي",
  "الجهاز الوطني لمكافحة المخدرات",
  "أكاديمية أنور قرقاش الدبلوماسية",
  "المجلس الأعلى للأمومة والطفولة",
  "المجلس الاتحادي للتركيبة السكانية",
  "مجلس الإمارات للتوازن بين الجنسين",
  "مجلس تنافسية الكوادر الإماراتية",
  "الهيئة الاتحادية للإسعاف والدفاع المدني",
  "الهيئة الاتحادية للذكاء الاصطناعي والبيانات",
  "مجلس الأمن السيبراني",
  "وزير التسامح والتعايش",
  "مجلس التعليم والتنمية البشرية والمجتمع",
];

// ===== STORAGE =====
const TEAM_STORAGE_KEY = "team_registration_data";

interface TeamData {
  entity: string;
  preparer: string;
  phone: string;
  email: string;
  leadName: string;
  leadTitle: string;
  deputyName: string;
  deputyTitle: string;
  tblTeam: Record<string, string>[];
  tblCoord: Record<string, string>[];
}

function getInitialTeamData(): TeamData {
  return {
    entity: "",
    preparer: "",
    phone: "",
    email: "",
    leadName: "",
    leadTitle: "",
    deputyName: "",
    deputyTitle: "",
    tblTeam: [{}],
    tblCoord: TRACKS.map(() => ({})),
  };
}

function loadTeamData(): TeamData {
  try {
    const raw = localStorage.getItem(TEAM_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...getInitialTeamData(), ...parsed };
    }
    for (let i = 1; i <= 5; i++) {
      const trackRaw = localStorage.getItem(`workplan_track_${i}_v2`);
      if (trackRaw) {
        const trackData = JSON.parse(trackRaw);
        if (trackData.fields && (trackData.fields.entity || trackData.fields.preparer)) {
          return {
            entity: trackData.fields.entity || "",
            preparer: trackData.fields.preparer || "",
            phone: trackData.fields.phone || "",
            email: trackData.fields.email || "",
            leadName: trackData.fields.leadName || "",
            leadTitle: trackData.fields.leadTitle || "",
            deputyName: trackData.fields.deputyName || "",
            deputyTitle: trackData.fields.deputyTitle || "",
            tblTeam: trackData.tables?.tblTeam || [{}],
            tblCoord: trackData.tables?.tblCoord || TRACKS.map(() => ({})),
          };
        }
      }
    }
  } catch {}
  return getInitialTeamData();
}

function saveTeamData(data: TeamData) {
  try {
    localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(data));
    for (let i = 1; i <= 5; i++) {
      const key = `workplan_track_${i}_v2`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.fields.entity = data.entity;
        parsed.fields.preparer = data.preparer;
        parsed.fields.phone = data.phone;
        parsed.fields.email = data.email;
        parsed.fields.leadName = data.leadName;
        parsed.fields.leadTitle = data.leadTitle;
        parsed.fields.deputyName = data.deputyName;
        parsed.fields.deputyTitle = data.deputyTitle;
        parsed.tables.tblTeam = data.tblTeam;
        parsed.tables.tblCoord = data.tblCoord;
        localStorage.setItem(key, JSON.stringify(parsed));
      }
    }
  } catch {}
}

// ===== VALIDATION =====
function validateGeneralTab(data: TeamData): string[] {
  const errors: string[] = [];
  if (!data.entity) errors.push("اسم الجهة الاتحادية");
  if (!data.preparer.trim()) errors.push("اسم معد الخطة");
  if (!data.phone.trim()) errors.push("رقم الهاتف");
  if (!data.email.trim()) errors.push("البريد الإلكتروني");
  return errors;
}

function validateTeamTab(data: TeamData): string[] {
  const errors: string[] = [];
  if (!data.leadName.trim()) errors.push("اسم قائد الفريق");
  if (!data.leadTitle.trim()) errors.push("المسمى الوظيفي لقائد الفريق");
  const hasTeamMember = data.tblTeam.some(r => r.name && r.name.trim());
  if (!hasTeamMember) errors.push("عضو واحد على الأقل في الفريق");
  return errors;
}

function validateCoordinatorsTab(data: TeamData): string[] {
  const errors: string[] = [];
  const hasCoord = data.tblCoord.some(r => r.name && r.name.trim());
  if (!hasCoord) errors.push("منسق واحد على الأقل");
  return errors;
}

function isTeamRegistrationComplete(data: TeamData): boolean {
  return (
    validateGeneralTab(data).length === 0 &&
    validateTeamTab(data).length === 0 &&
    validateCoordinatorsTab(data).length === 0
  );
}

export function checkTeamRegistrationComplete(): boolean {
  try {
    const raw = localStorage.getItem(TEAM_STORAGE_KEY);
    if (!raw) return false;
    const data = { ...getInitialTeamData(), ...JSON.parse(raw) };
    return isTeamRegistrationComplete(data);
  } catch {
    return false;
  }
}

// ===== COMPONENT =====
interface TeamRegistrationProps {
  onClose: () => void;
}

export function TeamRegistration({ onClose }: TeamRegistrationProps) {
  const [data, setData] = useState<TeamData>(() => loadTeamData());
  const [activeTab, setActiveTab] = useState<"general" | "team" | "coordinators">("general");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [showErrors, setShowErrors] = useState(false);

  // Auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      saveTeamData(data);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 500);
    return () => clearTimeout(timer);
  }, [data]);

  const updateField = useCallback((key: keyof TeamData, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateTeamRow = useCallback((idx: number, field: string, value: string) => {
    setData((prev) => {
      const rows = [...prev.tblTeam];
      rows[idx] = { ...rows[idx], [field]: value };
      return { ...prev, tblTeam: rows };
    });
  }, []);

  const addTeamRow = useCallback(() => {
    setData((prev) => ({ ...prev, tblTeam: [...prev.tblTeam, {}] }));
  }, []);

  const removeTeamRow = useCallback((idx: number) => {
    setData((prev) => ({
      ...prev,
      tblTeam: prev.tblTeam.length > 1 ? prev.tblTeam.filter((_, i) => i !== idx) : [{}],
    }));
  }, []);

  const updateCoordRow = useCallback((idx: number, field: string, value: string) => {
    setData((prev) => {
      const rows = [...prev.tblCoord];
      rows[idx] = { ...rows[idx], [field]: value };
      return { ...prev, tblCoord: rows };
    });
  }, []);

  const tabOrder = ["general", "team", "coordinators"] as const;
  const currentTabIdx = tabOrder.indexOf(activeTab);

  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left");
  const [isAnimating, setIsAnimating] = useState(false);

  const switchTab = (newTab: typeof activeTab) => {
    if (newTab === activeTab || isAnimating) return;
    const newIdx = tabOrder.indexOf(newTab);
    setSlideDirection(newIdx > currentTabIdx ? "left" : "right");
    setIsAnimating(true);
    setTimeout(() => {
      setActiveTab(newTab);
      setShowErrors(false);
      setTimeout(() => setIsAnimating(false), 180);
    }, 120);
  };

  const getCurrentTabErrors = () => {
    if (activeTab === "general") return validateGeneralTab(data);
    if (activeTab === "team") return validateTeamTab(data);
    return validateCoordinatorsTab(data);
  };

  const goNext = () => {
    const errors = getCurrentTabErrors();
    if (errors.length > 0) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    if (currentTabIdx < tabOrder.length - 1) {
      switchTab(tabOrder[currentTabIdx + 1]);
    }
  };

  const goPrev = () => {
    setShowErrors(false);
    if (currentTabIdx > 0) {
      switchTab(tabOrder[currentTabIdx - 1]);
    }
  };

  const handleSave = () => {
    const allErrors = [
      ...validateGeneralTab(data),
      ...validateTeamTab(data),
      ...validateCoordinatorsTab(data),
    ];
    if (allErrors.length > 0) {
      setShowErrors(true);
      return;
    }
    saveTeamData(data);
    onClose();
  };

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    setData(getInitialTeamData());
    localStorage.removeItem(TEAM_STORAGE_KEY);
    setActiveTab("general");
    setShowErrors(false);
    setShowResetConfirm(false);
    setSaveStatus("idle");
  };

  const tabs = [
    { id: "general" as const, label: "المعلومات العامة", icon: Building2, desc: "بيانات الجهة" },
    { id: "team" as const, label: "فريق العمل", icon: Users, desc: "القيادة والأعضاء" },
    { id: "coordinators" as const, label: "منسقو المسارات", icon: UserCheck, desc: "منسق كل مسار" },
  ];

  const currentErrors = showErrors ? getCurrentTabErrors() : [];



  return (
    <div className="rounded-3xl border border-slate-200/80 overflow-hidden bg-white shadow-2xl shadow-slate-200/50">
      {/* Header - Simple & Clean */}
      <div className="px-6 sm:px-8 py-5 border-b border-slate-100 bg-gradient-to-l from-blue-50/80 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">تسجيل فرق العمل</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">يرجى تعبئة جميع البيانات المطلوبة</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Edit button - allows editing after save */}
            <button
              onClick={() => { setActiveTab("general"); setShowErrors(false); }}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all active:scale-[0.97]"
              title="تعديل البيانات"
            >
              <Pencil className="w-3.5 h-3.5" />
              تعديل
            </button>
            {/* Reset button */}
            <button
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all active:scale-[0.97]"
              title="مسح جميع البيانات"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              مسح
            </button>
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                تم الحفظ
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="px-6 sm:px-8 py-4 bg-red-50 border-b border-red-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs font-medium text-red-700">هل أنت متأكد من مسح جميع البيانات؟ لا يمكن التراجع.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all"
              >
                نعم، مسح الكل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step Tabs - Simple Horizontal */}
      <div className="flex border-b border-slate-100">
        {tabs.map((tab, idx) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-xs sm:text-sm font-medium transition-all duration-200 relative ${
                isActive
                  ? "text-blue-600"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-6 right-6 h-[2.5px] bg-blue-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Validation Errors */}
      {currentErrors.length > 0 && (
        <div className="mx-5 sm:mx-7 mt-5 flex items-start gap-3 bg-red-50 border border-red-200/60 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-200">
          <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-red-700">الحقول التالية مطلوبة:</p>
            <p className="text-[11px] mt-1 text-red-600 leading-relaxed">{currentErrors.join(" • ")}</p>
          </div>
        </div>
      )}

      {/* Content with smooth transition */}
      <div
        className="p-5 sm:p-7 max-h-[48vh] overflow-y-auto"
        style={{
          transform: isAnimating ? `translateX(${slideDirection === "left" ? "-16px" : "16px"})` : "translateX(0)",
          opacity: isAnimating ? 0 : 1,
          transition: "transform 200ms cubic-bezier(0.23, 1, 0.32, 1), opacity 120ms ease-out",
        }}
      >
        {activeTab === "general" && (
          <div className="space-y-6">
            {/* Entity Selection */}
            <div className="flex flex-col gap-2.5">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500" />
                اسم الجهة الاتحادية <span className="text-red-400 mr-1 text-xs">*</span>
              </label>
              <SearchableSelect
                options={FEDERAL_ENTITIES}
                value={data.entity}
                onChange={(val) => updateField("entity", val)}
                placeholder="اختر الجهة الاتحادية"
                allowOther={false}
                isDark={false}
              />
            </div>

            {/* Name & Phone Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2.5">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  اسم معد الخطة <span className="text-red-400 mr-1 text-xs">*</span>
                </label>
                <input
                  type="text"
                  value={data.preparer}
                  onChange={(e) => updateField("preparer", e.target.value)}
                  placeholder="مثال: أحمد محمد العلي"
                  className={`w-full px-4 py-3.5 bg-white text-slate-800 placeholder:text-slate-400 border ${showErrors && !data.preparer.trim() ? "border-red-400 ring-2 ring-red-400/20" : "border-slate-200"} rounded-xl focus:border-blue-400 focus:ring-3 focus:ring-blue-400/10 transition-all outline-none text-sm shadow-sm`}
                />
              </div>
              <div className="flex flex-col gap-2.5">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-500" />
                  رقم الهاتف <span className="text-red-400 mr-1 text-xs">*</span>
                </label>
                <input
                  type="tel"
                  value={data.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="0501234567"
                  dir="ltr"
                  className={`w-full px-4 py-3.5 bg-white text-slate-800 placeholder:text-slate-400 border ${showErrors && !data.phone.trim() ? "border-red-400 ring-2 ring-red-400/20" : "border-slate-200"} rounded-xl focus:border-blue-400 focus:ring-3 focus:ring-blue-400/10 transition-all outline-none text-sm shadow-sm`}
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2.5">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500" />
                البريد الإلكتروني <span className="text-red-400 mr-1 text-xs">*</span>
              </label>
              <input
                type="email"
                value={data.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="ahmed.ali@moca.gov.ae"
                dir="ltr"
                className={`w-full px-4 py-3.5 bg-white text-slate-800 placeholder:text-slate-400 border ${showErrors && !data.email.trim() ? "border-red-400 ring-2 ring-red-400/20" : "border-slate-200"} rounded-xl focus:border-blue-400 focus:ring-3 focus:ring-blue-400/10 transition-all outline-none text-sm shadow-sm`}
              />
            </div>
          </div>
        )}

        {activeTab === "team" && (
          <div className="space-y-6">
            {/* Leadership Card */}
            <div className="relative overflow-hidden bg-gradient-to-bl from-slate-50 to-blue-50/30 border border-slate-200/80 rounded-2xl p-6">
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-blue-500 via-blue-400 to-indigo-500" />
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">القيادة</h3>
                  <p className="text-[10px] text-slate-500">قائد الفريق ونائبه</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-700">اسم قائد الفريق <span className="text-red-400">*</span></label>
                  <input type="text" value={data.leadName} onChange={(e) => updateField("leadName", e.target.value)} placeholder="مثال: فاطمة سعيد المنصوري"
                    className={`w-full px-4 py-3 bg-white text-slate-800 placeholder:text-slate-400 border ${showErrors && !data.leadName.trim() ? "border-red-400 ring-2 ring-red-400/20" : "border-slate-200"} rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all outline-none text-sm shadow-sm`} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-700">المسمى الوظيفي <span className="text-red-400">*</span></label>
                  <input type="text" value={data.leadTitle} onChange={(e) => updateField("leadTitle", e.target.value)} placeholder="مثال: مدير إدارة التحول الرقمي"
                    className={`w-full px-4 py-3 bg-white text-slate-800 placeholder:text-slate-400 border ${showErrors && !data.leadTitle.trim() ? "border-red-400 ring-2 ring-red-400/20" : "border-slate-200"} rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all outline-none text-sm shadow-sm`} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-700">اسم نائب القائد</label>
                  <input type="text" value={data.deputyName} onChange={(e) => updateField("deputyName", e.target.value)} placeholder="مثال: خالد عبدالله الشامسي"
                    className="w-full px-4 py-3 bg-white text-slate-800 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all outline-none text-sm shadow-sm" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-700">المسمى الوظيفي</label>
                  <input type="text" value={data.deputyTitle} onChange={(e) => updateField("deputyTitle", e.target.value)} placeholder="مثال: رئيس قسم الذكاء الاصطناعي"
                    className="w-full px-4 py-3 bg-white text-slate-800 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all outline-none text-sm shadow-sm" />
                </div>
              </div>
            </div>

            {/* Team Members */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2.5">
                  <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
                  أعضاء الفريق <span className="text-red-400 text-xs">*</span>
                </h3>
                <span className="text-[10px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                  {data.tblTeam.filter(r => r.name?.trim()).length} أعضاء
                </span>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
                <table className="w-full min-w-[650px] border-collapse text-xs">
                  <thead>
                    <tr className="bg-gradient-to-l from-slate-700 to-slate-800">
                      <th className="text-white text-[10px] font-bold py-3.5 px-3 text-right w-10 rounded-tr-xl">#</th>
                      <th className="text-white text-[10px] font-bold py-3.5 px-3 text-right">الاسم</th>
                      <th className="text-white text-[10px] font-bold py-3.5 px-3 text-right">المسمى الوظيفي</th>
                      <th className="text-white text-[10px] font-bold py-3.5 px-3 text-right">الإدارة</th>
                      <th className="text-white text-[10px] font-bold py-3.5 px-3 text-right">المجال المسؤول</th>
                      <th className="text-white text-[10px] font-bold py-3.5 px-3 text-right">البريد الإلكتروني</th>
                      <th className="text-white text-[10px] font-bold py-3.5 px-3 w-10 rounded-tl-xl"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tblTeam.map((row, idx) => (
                      <tr key={idx} className={`${idx % 2 === 1 ? "bg-slate-50/70" : "bg-white"} hover:bg-blue-50/40 transition-colors group`}>
                        <td className="text-center text-blue-600 font-bold text-xs py-2.5 px-3 border-b border-slate-100">{idx + 1}</td>
                        {["name", "title", "dept", "area", "email"].map((field) => (
                          <td key={field} className="py-2 px-1.5 border-b border-slate-100">
                            <input
                              type={field === "email" ? "email" : "text"}
                              value={row[field] || ""}
                              onChange={(e) => updateTeamRow(idx, field, e.target.value)}
                              dir={field === "email" ? "ltr" : "rtl"}
                              placeholder={field === "name" ? "الاسم" : field === "title" ? "المسمى" : field === "dept" ? "الإدارة" : field === "area" ? "المجال" : "البريد"}
                              className="w-full px-3 py-2.5 bg-transparent border border-transparent text-slate-800 placeholder:text-slate-300 rounded-lg text-xs focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-400/15 outline-none transition-all hover:bg-white hover:border-slate-200"
                            />
                          </td>
                        ))}
                        <td className="py-2 px-1.5 border-b border-slate-100">
                          <button onClick={() => removeTeamRow(idx)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={addTeamRow} className="mt-4 flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all bg-blue-50 text-blue-600 border border-blue-200/60 hover:bg-blue-100 hover:border-blue-300 active:scale-[0.97]">
                <Plus className="w-4 h-4" />
                إضافة عضو جديد
              </button>
            </div>
          </div>
        )}

        {activeTab === "coordinators" && (
          <div className="space-y-5">
            {/* Coordinators Cards */}
            <div className="space-y-3">
              {TRACKS.map((track, idx) => {
                const hasData = data.tblCoord[idx]?.name?.trim();
                return (
                  <div
                    key={idx}
                    className={`border rounded-2xl p-4 transition-all duration-200 ${
                      hasData
                        ? "border-emerald-200 bg-emerald-50/30"
                        : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/20"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                        hasData ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                      }`}>
                        {hasData ? "✓" : idx + 1}
                      </div>
                      <span className="text-xs font-bold text-slate-700">{track}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { field: "name", placeholder: "اسم المنسق", dir: "rtl" },
                        { field: "title", placeholder: "المسمى الوظيفي", dir: "rtl" },
                        { field: "email", placeholder: "البريد الإلكتروني", dir: "ltr" },
                        { field: "phone", placeholder: "رقم الهاتف", dir: "ltr" },
                      ].map(({ field, placeholder, dir }) => (
                        <input
                          key={field}
                          type={field === "email" ? "email" : "text"}
                          value={data.tblCoord[idx]?.[field] || ""}
                          onChange={(e) => updateCoordRow(idx, field, e.target.value)}
                          dir={dir}
                          placeholder={placeholder}
                          className="w-full px-3.5 py-2.5 bg-white text-slate-800 placeholder:text-slate-400 border border-slate-200 rounded-xl text-xs focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15 outline-none transition-all shadow-sm"
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="px-5 sm:px-7 py-5 border-t border-slate-100 bg-gradient-to-l from-slate-50/80 to-white flex items-center justify-between">
        {/* Previous Button */}
        <button
          onClick={goPrev}
          disabled={currentTabIdx === 0}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
        >
          <ChevronRight className="w-4 h-4" />
          السابق
        </button>

        {/* Step indicator - dots */}
        <div className="flex items-center gap-2.5">
          {tabOrder.map((_, idx) => (
            <div
              key={idx}
              className={`rounded-full transition-all duration-300 ${
                idx === currentTabIdx
                  ? "w-8 h-2.5 bg-blue-500"
                  : idx < currentTabIdx
                    ? "w-2.5 h-2.5 bg-emerald-500"
                    : "w-2.5 h-2.5 bg-slate-200"
              }`}
            />
          ))}
        </div>

        {/* Next / Save Button */}
        {currentTabIdx < tabOrder.length - 1 ? (
          <button
            onClick={goNext}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-l from-blue-500 to-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.97] transition-all"
          >
            التالي
            <ChevronLeft className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-l from-emerald-500 to-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.97] transition-all"
          >
            <Save className="w-4 h-4" />
            حفظ وإغلاق
          </button>
        )}
      </div>
    </div>
  );
}

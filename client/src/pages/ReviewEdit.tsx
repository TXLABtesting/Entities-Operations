import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "wouter";
import { exportToExcel } from "@/lib/exportExcel";
import { exportToPptx } from "@/lib/exportPptx";

// ===== CONSTANTS =====
const TRACKS = [
  "العمليات والدعم المؤسسي",
  "الخدمات",
  "بناء القدرات والتدريب",
  "تقنيات الذكاء الاصطناعي والبيانات",
  "العمل الحكومي الاستراتيجي",
];

const SECTIONS = [
  { id: "s1", name: "المعلومات العامة", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { id: "s2", name: "المشاريع القائمة وقيد التنفيذ", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { id: "s3", name: "المشاريع الجديدة", icon: "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "s4", name: "العمليات والدعم المؤسسي", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { id: "s5", name: "المستهدفات والنتائج المتوقعة", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { id: "s6", name: "البرنامج الزمني للتنفيذ", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { id: "s7", name: "خطة الإطلاقات والإعلانات", icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
  { id: "s8", name: "فريق عمل الجهة الاتحادية", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { id: "s9", name: "منسقو المسارات", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" },
];

const PHASES = [
  { num: "1", title: "التقييم والتهيئة", date: "يونيو – يوليو 2026" },
  { num: "2", title: "إطلاق الدفعة الأولى", date: "يوليو – نوفمبر 2026" },
  { num: "3", title: "إطلاق الدفعة الثانية", date: "ديسمبر 2026 – فبراير 2027" },
  { num: "4", title: "إطلاق الدفعة الثالثة", date: "مارس – مايو 2027" },
  { num: "5", title: "إطلاق الدفعة الرابعة", date: "يونيو – أغسطس 2027" },
  { num: "6", title: "إطلاق الدفعة الخامسة", date: "سبتمبر – نوفمبر 2027" },
  { num: "7", title: "إطلاق الدفعة السادسة", date: "ديسمبر 2027 – فبراير 2028" },
  { num: "8", title: "التحسين والتوسع في التطبيق", date: "مارس – مايو 2028" },
];

import { BRAND } from "@/lib/brand";

const AI_LOGO = BRAND.logoColor;
const AI_LOGO_WHITE = BRAND.logoWhite;

const OPS_COLUMNS = [
  { key: "taskName", label: "المهمة/العملية/الخدمة" },
  { key: "classification", label: "التصنيف" },
  { key: "subActivities", label: "الأنشطة الفرعية" },
  { key: "isShared", label: "مشتركة" },
  { key: "sector", label: "القطاع" },
  { key: "department", label: "الإدارة" },
  { key: "automationLevel", label: "مستوى الأتمتة" },
  { key: "eligibility", label: "القابلية" },
  { key: "readiness", label: "الجاهزية" },
  { key: "transformPriority", label: "أولوية التحول" },
  { key: "impactLevel", label: "الأثر" },
  { key: "complexityLevel", label: "التعقيد" },
  { key: "relatedTrack", label: "المسار" },
];

// ===== TYPES =====
interface TableRow { [key: string]: string; }
interface PhaseEntry { desc: string; startDate: string; endDate: string; }
interface LaunchEntry { date: string; desc: string; }
interface FormState {
  fields: { [key: string]: string };
  tables: { [key: string]: TableRow[] };
  phaseEntries?: { [phaseIdx: number]: PhaseEntry[] };
  launches?: LaunchEntry[];
}

// ===== HELPERS =====
function getStorageKey(trackId: number) { return `workplan_track_${trackId}_v2`; }

function loadState(trackId: number): FormState {
  try {
    const raw = localStorage.getItem(getStorageKey(trackId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.phaseEntries) parsed.phaseEntries = {};
      if (!parsed.launches) parsed.launches = [];
      return parsed;
    }
  } catch {}
  return { fields: {}, tables: {}, phaseEntries: {}, launches: [] };
}

function saveState(trackId: number, state: FormState) {
  try { localStorage.setItem(getStorageKey(trackId), JSON.stringify(state)); } catch {}
}

// ===== COMPONENT =====
export default function ReviewEdit() {
  const params = useParams<{ trackId: string }>();
  const trackId = parseInt(params.trackId || "1");
  const trackName = TRACKS[trackId - 1] || TRACKS[0];

  const [formState, setFormState] = useState<FormState>(() => loadState(trackId));
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0, 1, 2, 3, 4, 5, 6, 7, 8]));
  const [toastMsg, setToastMsg] = useState("");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSavedTime, setLastSavedTime] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => { setFormState(loadState(trackId)); }, [trackId]);

  useEffect(() => {
    setHasUnsavedChanges(true);
    setAutoSaveStatus("saving");
    const timer = setTimeout(() => {
      saveState(trackId, formState);
      setAutoSaveStatus("saved");
      setHasUnsavedChanges(false);
      setLastSavedTime(new Date().toLocaleTimeString("ar-AE", { hour: "2-digit", minute: "2-digit" }));
      setTimeout(() => setAutoSaveStatus("idle"), 3000);
    }, 500);
    return () => clearTimeout(timer);
  }, [formState, trackId]);

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "لديك تغييرات غير محفوظة. هل أنت متأكد من المغادرة؟";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2600);
  }, []);

  const updateField = (key: string, value: string) => {
    setFormState((prev) => ({ ...prev, fields: { ...prev.fields, [key]: value } }));
  };

  const updateTableCell = (tableId: string, rowIdx: number, field: string, value: string) => {
    setFormState((prev) => {
      const table = [...(prev.tables[tableId] || [])];
      table[rowIdx] = { ...table[rowIdx], [field]: value };
      return { ...prev, tables: { ...prev.tables, [tableId]: table } };
    });
  };

  const addRow = (tableId: string) => {
    setFormState((prev) => ({
      ...prev,
      tables: { ...prev.tables, [tableId]: [...(prev.tables[tableId] || []), {}] },
    }));
  };

  const removeRow = (tableId: string, idx: number) => {
    setFormState((prev) => ({
      ...prev,
      tables: { ...prev.tables, [tableId]: (prev.tables[tableId] || []).filter((_, i) => i !== idx) },
    }));
  };

  // Phase entries
  const updatePhaseEntry = (phaseIdx: number, entryIdx: number, field: keyof PhaseEntry, value: string) => {
    setFormState((prev) => {
      const phaseEntries = { ...(prev.phaseEntries || {}) };
      const entries = [...(phaseEntries[phaseIdx] || [{ desc: "", startDate: "", endDate: "" }])];
      entries[entryIdx] = { ...entries[entryIdx], [field]: value };
      phaseEntries[phaseIdx] = entries;
      return { ...prev, phaseEntries };
    });
  };

  const addPhaseEntry = (phaseIdx: number) => {
    setFormState((prev) => {
      const phaseEntries = { ...(prev.phaseEntries || {}) };
      const entries = [...(phaseEntries[phaseIdx] || [])];
      entries.push({ desc: "", startDate: "", endDate: "" });
      phaseEntries[phaseIdx] = entries;
      return { ...prev, phaseEntries };
    });
  };

  const removePhaseEntry = (phaseIdx: number, entryIdx: number) => {
    setFormState((prev) => {
      const phaseEntries = { ...(prev.phaseEntries || {}) };
      const entries = (phaseEntries[phaseIdx] || []).filter((_, i) => i !== entryIdx);
      phaseEntries[phaseIdx] = entries.length ? entries : [{ desc: "", startDate: "", endDate: "" }];
      return { ...prev, phaseEntries };
    });
  };

  // Launch entries
  const updateLaunch = (idx: number, field: keyof LaunchEntry, value: string) => {
    setFormState((prev) => {
      const launches = [...(prev.launches || [])];
      launches[idx] = { ...launches[idx], [field]: value };
      return { ...prev, launches };
    });
  };

  const addLaunch = () => {
    setFormState((prev) => ({ ...prev, launches: [...(prev.launches || []), { date: "", desc: "" }] }));
  };

  const removeLaunch = (idx: number) => {
    setFormState((prev) => ({ ...prev, launches: (prev.launches || []).filter((_, i) => i !== idx) }));
  };

  const toggleSection = (idx: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const expandAll = () => setExpandedSections(new Set([0, 1, 2, 3, 4, 5, 6, 7, 8]));
  const collapseAll = () => setExpandedSections(new Set());

  const handleSave = () => { saveState(trackId, formState); showToast("تم حفظ جميع التعديلات بنجاح"); };

  // Auto-calculated values
  const tblOps = formState.tables.tblOps || [];
  const totalOps = tblOps.filter(r => r.taskName && r.taskName.trim()).length;
  const totalEligible = tblOps.filter(r => r.eligibility === "قابل كلياً" || r.eligibility === "قابل جزئياً").length;
  const totalTargeted = tblOps.filter(r => r.transformPriority === "نعم").length;

  const exportJSON = () => {
    const entity = formState.fields.entity || "federal-entity";
    const blob = new Blob([JSON.stringify(formState, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `خطة-عمل-${entity}-مسار-${trackId}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("تم تصدير ملف البيانات");
  };

  const exportPDF = () => {
    const entity = formState.fields.entity || "الجهة الاتحادية";
    const preparer = formState.fields.preparer || "";
    const startDate = formState.fields.startDate || "";
    const endDate = formState.fields.endDate || "";
    const phone = formState.fields.phone || "";
    const email = formState.fields.email || "";

    const buildTableHTML = (tableId: string, columns: {key: string; label: string}[]) => {
      const rows = formState.tables[tableId] || [];
      if (rows.length === 0) return '<p style="color:#999;font-size:12px;">لا توجد بيانات مدخلة</p>';
      let html = '<table style="width:100%;border-collapse:collapse;margin:8px 0;font-size:11px;">';
      html += '<thead><tr>';
      html += '<th style="background:#0066cc;color:white;padding:8px 6px;text-align:right;border:1px solid #ddd;">#</th>';
      columns.forEach(col => { html += `<th style="background:#0066cc;color:white;padding:8px 6px;text-align:right;border:1px solid #ddd;">${col.label}</th>`; });
      html += '</tr></thead><tbody>';
      rows.forEach((row, idx) => {
        const bg = idx % 2 === 1 ? '#f8fbff' : 'white';
        html += `<tr style="background:${bg};"><td style="padding:6px;border:1px solid #e0eaf5;text-align:center;font-weight:bold;color:#0066cc;">${idx + 1}</td>`;
        columns.forEach(col => { html += `<td style="padding:6px;border:1px solid #e0eaf5;text-align:right;">${row[col.key] || '—'}</td>`; });
        html += '</tr>';
      });
      html += '</tbody></table>';
      return html;
    };

    const phasesHTML = PHASES.map((phase, pIdx) => {
      const entries = formState.phaseEntries?.[pIdx] || [];
      const entriesHTML = entries.map((e, i) => `<div style="margin:4px 0;padding:4px 8px;background:#f8fbff;border-radius:4px;border:1px solid #e0eaf5;font-size:11px;"><strong>نشاط ${i+1}:</strong> ${e.desc || '—'} <span style="color:#0066cc;">(${e.startDate || '—'} → ${e.endDate || '—'})</span></div>`).join('');
      return `<div class="phase-item"><div class="phase-num">${phase.num}</div><div class="phase-content"><div class="phase-title">${phase.title} <span class="phase-date">${phase.date}</span></div>${entriesHTML || '<div style="font-size:11px;color:#999;">لا توجد أنشطة</div>'}</div></div>`;
    }).join('');

    const launchesHTML = (formState.launches || []).map((l, i) => `<div class="field-row"><span class="field-label">الإطلاق ${i+1}</span><span class="field-value">${l.date || '—'} — ${l.desc || '—'}</span></div>`).join('') || '<p style="color:#999;font-size:12px;">لا توجد إطلاقات</p>';

    const pdfContent = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600;700&display=swap');
      @font-face { font-family: 'Sakkal Majalla'; src: local('Sakkal Majalla'), local('Sakkal Majalla Bold'); }
      *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Sakkal Majalla','Noto Naskh Arabic',sans-serif;direction:rtl;padding:30px;color:#1e3a5f;font-size:14px}
      .header{display:flex;align-items:center;justify-content:space-between;padding-bottom:20px;border-bottom:3px solid #0066cc;margin-bottom:24px}.header img{height:70px}
      .header-center{text-align:center}.header-center h1{font-size:18px;color:#0066cc;font-weight:800}.header-center p{font-size:13px;color:#0055b8;font-weight:600;margin-top:4px}
      .track-badge{background:linear-gradient(135deg,#0055b8 0%,#0077cc 100%);color:white;padding:10px 20px;border-radius:10px;text-align:center;margin-bottom:20px}
      .track-badge h2{font-size:16px;font-weight:700}.track-badge p{font-size:11px;opacity:0.9}
      .section{margin-bottom:20px;page-break-inside:avoid}.section-title{background:#f0f5ff;border-right:4px solid #0066cc;padding:10px 14px;font-size:14px;font-weight:700;color:#0066cc;border-radius:0 8px 8px 0;margin-bottom:10px}
      .field-row{display:flex;padding:6px 0;border-bottom:1px solid #e0eaf5}.field-label{width:180px;font-weight:600;color:#1e3a5f;opacity:0.6;font-size:11px;flex-shrink:0}.field-value{flex:1;color:#1e3a5f;font-size:12px}
      .phase-item{display:flex;gap:10px;align-items:flex-start;padding:8px;background:#f8fbff;border-radius:8px;margin-bottom:6px;border:1px solid #e0eaf5}
      .phase-num{width:28px;height:28px;background:linear-gradient(135deg,#0077cc,#0055b8);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0}
      .phase-content{flex:1}.phase-title{font-weight:700;font-size:12px;color:#1e3a5f}.phase-date{font-size:10px;color:#0066cc}
      .footer{margin-top:30px;padding-top:15px;border-top:2px solid #e0eaf5;text-align:center;font-size:10px;color:#1e3a5f;opacity:0.5}
      @media print{body{padding:15px}.section{page-break-inside:avoid}}
    </style></head><body>
      <div class="header"><div class="header-center"><h1>مشروع الذكاء الاصطناعي المساعد</h1><p>مشروع الذكاء الاصطناعي المساعد لحكومة دولة الإمارات</p></div><img src="${AI_LOGO}" alt="AI المساعد" style="height:50px" /></div>
      <div class="track-badge"><p>المسار ${trackId}</p><h2>${trackName}</h2></div>
      <div class="section"><div class="section-title">1. المعلومات العامة</div><div class="field-row"><span class="field-label">اسم الجهة الاتحادية</span><span class="field-value">${entity}</span></div><div class="field-row"><span class="field-label">تاريخ البدء</span><span class="field-value">${startDate}</span></div><div class="field-row"><span class="field-label">تاريخ الانتهاء</span><span class="field-value">${endDate}</span></div><div class="field-row"><span class="field-label">اسم معد الخطة</span><span class="field-value">${preparer}</span></div><div class="field-row"><span class="field-label">رقم الهاتف</span><span class="field-value">${phone}</span></div><div class="field-row"><span class="field-label">البريد الإلكتروني</span><span class="field-value">${email}</span></div></div>
      <div class="section"><div class="section-title">2. المشاريع القائمة وقيد التنفيذ</div>${buildTableHTML('tblExisting', [{key:'name',label:'اسم المشروع'},{key:'desc',label:'الوصف'},{key:'output',label:'المخرجات'},{key:'end',label:'تاريخ الانتهاء'},{key:'status',label:'الحالة'},{key:'track',label:'المسار'}])}</div>
      <div class="section"><div class="section-title">3. المشاريع الجديدة</div>${buildTableHTML('tblNew', [{key:'name',label:'اسم المشروع'},{key:'desc',label:'الوصف'},{key:'output',label:'المخرجات'},{key:'impact',label:'الأثر المتوقع'},{key:'dates',label:'الفترة الزمنية'},{key:'track',label:'المسار'}])}</div>
      <div class="section"><div class="section-title">4. العمليات والدعم المؤسسي</div><div style="display:flex;gap:12px;margin-bottom:12px;"><div style="flex:1;background:#f0f5ff;border:1px solid #0066cc;border-top:3px solid #0066cc;border-radius:8px;padding:10px;text-align:center;"><p style="font-size:10px;color:#1e3a5f;opacity:0.6;">الإجمالي</p><p style="font-size:20px;font-weight:800;color:#0066cc;">${totalOps}</p></div><div style="flex:1;background:#f0fff4;border:1px solid #10b981;border-top:3px solid #10b981;border-radius:8px;padding:10px;text-align:center;"><p style="font-size:10px;color:#1e3a5f;opacity:0.6;">القابلة للتحول</p><p style="font-size:20px;font-weight:800;color:#10b981;">${totalEligible}</p></div><div style="flex:1;background:#fffbeb;border:1px solid #f59e0b;border-top:3px solid #f59e0b;border-radius:8px;padding:10px;text-align:center;"><p style="font-size:10px;color:#1e3a5f;opacity:0.6;">المستهدفة</p><p style="font-size:20px;font-weight:800;color:#f59e0b;">${totalTargeted}</p></div></div>${buildTableHTML('tblOps', OPS_COLUMNS)}</div>
      <div class="section"><div class="section-title">5. المستهدفات والنتائج المتوقعة</div><div class="field-row"><span class="field-label">المخرجات الرئيسية (Outputs)</span><span class="field-value">${formState.fields.output1 || '—'}</span></div><div class="field-row"><span class="field-label">النتائج المتوقعة (Outcomes)</span><span class="field-value">${formState.fields.outcome1 || '—'}</span></div><div class="field-row"><span class="field-label">عدد نماذج الذكاء الاصطناعي المتوقعة</span><span class="field-value">${formState.fields.aiModelsCount || '—'}</span></div><div class="field-row"><span class="field-label">نسبة التحول المستهدفة</span><span class="field-value">${formState.fields.transformPct || '—'}%</span></div></div>
      <div class="section"><div class="section-title">6. البرنامج الزمني للتنفيذ</div>${phasesHTML}</div>
      <div class="section"><div class="section-title">7. خطة الإطلاقات والإعلانات</div>${launchesHTML}</div>
      <div class="section"><div class="section-title">8. فريق عمل الجهة الاتحادية</div><div class="field-row"><span class="field-label">قائد الفريق</span><span class="field-value">${formState.fields.leadName || '—'} — ${formState.fields.leadTitle || '—'}</span></div><div class="field-row"><span class="field-label">نائب القائد</span><span class="field-value">${formState.fields.deputyName || '—'} — ${formState.fields.deputyTitle || '—'}</span></div><h4 style="font-size:12px;color:#0066cc;margin:10px 0 4px;">أعضاء الفريق</h4>${buildTableHTML('tblTeam', [{key:'name',label:'الاسم'},{key:'title',label:'المسمى الوظيفي'},{key:'dept',label:'الإدارة'},{key:'area',label:'المجال المسؤول'},{key:'email',label:'البريد الإلكتروني'}])}</div>
      <div class="section"><div class="section-title">9. منسقو المسارات</div>${(() => { const coordRows = formState.tables.tblCoord || []; if (coordRows.length === 0) return '<p style="color:#999;font-size:12px;">لا توجد بيانات</p>'; let html = '<table style="width:100%;border-collapse:collapse;font-size:11px;"><thead><tr><th style="background:#0066cc;color:white;padding:8px 6px;text-align:right;border:1px solid #ddd;">المسار</th><th style="background:#0066cc;color:white;padding:8px 6px;text-align:right;border:1px solid #ddd;">الاسم</th><th style="background:#0066cc;color:white;padding:8px 6px;text-align:right;border:1px solid #ddd;">المسمى</th><th style="background:#0066cc;color:white;padding:8px 6px;text-align:right;border:1px solid #ddd;">البريد</th><th style="background:#0066cc;color:white;padding:8px 6px;text-align:right;border:1px solid #ddd;">الهاتف</th></tr></thead><tbody>'; TRACKS.forEach((track, tIdx) => { const bg = tIdx % 2 === 1 ? '#f8fbff' : 'white'; html += `<tr style="background:${bg};"><td style="padding:6px;border:1px solid #e0eaf5;font-weight:bold;color:#0066cc;">${track}</td><td style="padding:6px;border:1px solid #e0eaf5;">${coordRows[tIdx]?.name || '—'}</td><td style="padding:6px;border:1px solid #e0eaf5;">${coordRows[tIdx]?.title || '—'}</td><td style="padding:6px;border:1px solid #e0eaf5;">${coordRows[tIdx]?.email || '—'}</td><td style="padding:6px;border:1px solid #e0eaf5;">${coordRows[tIdx]?.phone || '—'}</td></tr>`; }); html += '</tbody></table>'; return html; })()}</div>
      <div class="footer"><p>مشروع الذكاء الاصطناعي المساعد لحكومة دولة الإمارات • وزارة شؤون مجلس الوزراء</p><p>استراتيجية الإمارات للذكاء الاصطناعي 2031</p></div>
    </body></html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) { printWindow.document.write(pdfContent); printWindow.document.close(); setTimeout(() => { printWindow.print(); }, 1000); }
    showToast("جاري تصدير الملف كـ PDF...");
  };

  // ===== RENDER HELPERS =====
  const renderEditableField = (label: string, key: string, type = "text") => {
    const value = formState.fields[key] || "";
    const isEditing = editingField === key;
    return (
      <div className={`flex items-center gap-3 py-2.5 border-b last:border-0 ${"border-slate-100"}`}>
        <span className={`text-xs sm:text-sm font-semibold w-36 sm:w-44 flex-shrink-0 ${"text-slate-700"}`}>{label}</span>
        {isEditing ? (
          <input type={type} value={value} onChange={(e) => updateField(key, e.target.value)} onBlur={() => setEditingField(null)} autoFocus
            dir={type === "email" ? "ltr" : "rtl"}
            className={`flex-1 px-3 py-2 border border-blue-400/40 rounded-lg text-sm focus:ring-2 focus:ring-blue-400/20 outline-none ${"bg-white text-slate-800"}`} />
        ) : (
          <div onClick={() => setEditingField(key)}
            className={`flex-1 px-3 py-2 border rounded-lg text-sm cursor-pointer transition-all min-h-[36px] flex items-center ${"bg-slate-50 border-slate-200 text-slate-800 hover:border-blue-300 hover:bg-white"}`}>
            {value || <span className={"text-slate-400"}>انقر للتعديل</span>}
          </div>
        )}
      </div>
    );
  };

  const renderEditableTextarea = (label: string, key: string) => {
    const value = formState.fields[key] || "";
    const isEditing = editingField === key;
    return (
      <div className={`flex flex-col gap-1.5 py-2.5 border-b last:border-0 ${"border-slate-100"}`}>
        <span className={`text-xs sm:text-sm font-semibold ${"text-slate-700"}`}>{label}</span>
        {isEditing ? (
          <textarea value={value} onChange={(e) => updateField(key, e.target.value)} onBlur={() => setEditingField(null)} autoFocus rows={4}
            className={`w-full px-3 py-2 border border-blue-400/40 rounded-lg text-sm focus:ring-2 focus:ring-blue-400/20 outline-none resize-y ${"bg-white text-slate-800"}`} />
        ) : (
          <div onClick={() => setEditingField(key)}
            className={`w-full px-3 py-2 border rounded-lg text-sm cursor-pointer transition-all min-h-[60px] ${"bg-slate-50 border-slate-200 text-slate-800 hover:border-blue-300 hover:bg-white"}`}>
            {value || <span className={"text-slate-400"}>انقر للتعديل</span>}
          </div>
        )}
      </div>
    );
  };

  const renderEditableTable = (tableId: string, columns: { key: string; label: string; type?: string }[]) => {
    const rows = formState.tables[tableId] || [];
    if (rows.length === 0) return <p className={`text-sm py-2 ${"text-slate-400"}`}>لا توجد بيانات مدخلة</p>;
    return (
      <div className={`overflow-x-auto border rounded-xl ${"border-slate-200"}`}>
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr>
              <th className="bg-blue-600 text-white text-xs font-bold py-2.5 px-3 text-right w-8">#</th>
              {columns.map((col) => (
                <th key={col.key} className="bg-blue-600 text-white text-xs font-bold py-2.5 px-3 text-right">{col.label}</th>
              ))}
              <th className="bg-blue-600 text-white text-xs font-bold py-2.5 px-3 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 1 ? ("bg-slate-50") : "bg-transparent"}>
                <td className={`text-center text-blue-500 font-bold text-xs py-2 px-2 border-b ${"border-slate-100"}`}>{idx + 1}</td>
                {columns.map((col) => (
                  <td key={col.key} className={`py-1.5 px-2 border-b ${"border-slate-100"}`}>
                    <input type={col.type || "text"} value={row[col.key] || ""} onChange={(e) => updateTableCell(tableId, idx, col.key, e.target.value)}
                      className={`w-full px-2 py-1.5 border rounded-lg text-xs focus:border-blue-400 outline-none ${"bg-white border-slate-200 text-slate-800"}`} />
                  </td>
                ))}
                <td className={`py-1.5 px-1 border-b ${"border-slate-100"}`}>
                  <button onClick={() => removeRow(tableId, idx)} className="text-red-400 hover:text-red-500 hover:bg-red-400/10 rounded-lg w-6 h-6 flex items-center justify-center text-sm transition-colors">×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={`p-2 border-t ${"border-slate-100"}`}>
          <button onClick={() => addRow(tableId)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed rounded-lg text-xs font-bold transition-colors ${"bg-blue-50 text-blue-600 border-blue-300 hover:bg-blue-100"}`}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>
            إضافة صف
          </button>
        </div>
      </div>
    );
  };

  // ===== SECTION CONTENT RENDERERS =====
  const renderSectionContent = (idx: number) => {
    switch (idx) {
      case 0:
        return (
          <div className="space-y-1">
            {renderEditableField("اسم الجهة الاتحادية", "entity")}
            {renderEditableField("تاريخ البدء", "startDate", "date")}
            {renderEditableField("تاريخ الانتهاء", "endDate", "date")}
            {renderEditableField("اسم معد الخطة", "preparer")}
            {renderEditableField("رقم الهاتف", "phone", "tel")}
            {renderEditableField("البريد الإلكتروني", "email", "email")}
          </div>
        );
      case 1:
        return renderEditableTable("tblExisting", [
          { key: "name", label: "اسم المشروع" }, { key: "desc", label: "الوصف" },
          { key: "output", label: "المخرجات" }, { key: "end", label: "تاريخ الانتهاء", type: "date" },
          { key: "status", label: "الحالة" }, { key: "track", label: "المسار" },
        ]);
      case 2:
        return renderEditableTable("tblNew", [
          { key: "name", label: "اسم المشروع" }, { key: "desc", label: "الوصف" },
          { key: "output", label: "المخرجات" }, { key: "impact", label: "الأثر المتوقع" },
          { key: "dates", label: "الفترة الزمنية" }, { key: "track", label: "المسار" },
        ]);
      case 3:
        return (
          <div className="space-y-4">
            {/* Auto-calculated summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className={`border border-t-4 border-t-blue-500 rounded-xl p-3 text-center ${"bg-blue-50 border-blue-200"}`}>
                <p className={`text-[10px] mb-1 ${"text-slate-600"}`}>الإجمالي</p>
                <p className="text-2xl font-bold text-blue-500">{totalOps}</p>
              </div>
              <div className={`border border-t-4 border-t-emerald-500 rounded-xl p-3 text-center ${"bg-emerald-50 border-emerald-200"}`}>
                <p className={`text-[10px] mb-1 ${"text-slate-600"}`}>القابلة للتحول</p>
                <p className="text-2xl font-bold text-emerald-500">{totalEligible}</p>
              </div>
              <div className={`border border-t-4 border-t-amber-500 rounded-xl p-3 text-center ${"bg-amber-50 border-amber-200"}`}>
                <p className={`text-[10px] mb-1 ${"text-slate-600"}`}>المستهدفة</p>
                <p className="text-2xl font-bold text-amber-500">{totalTargeted}</p>
              </div>
            </div>
            {renderEditableTable("tblOps", OPS_COLUMNS)}
          </div>
        );
      case 4:
        return (
          <div className="space-y-3">
            {renderEditableTextarea("المخرجات الرئيسية (Outputs)", "output1")}
            {renderEditableTextarea("النتائج المتوقعة (Outcomes)", "outcome1")}
            {renderEditableField("عدد نماذج الذكاء الاصطناعي المتوقعة", "aiModelsCount", "number")}
            {renderEditableField("نسبة التحول المستهدفة (%)", "transformPct")}
          </div>
        );
      case 5:
        return (
          <div className="space-y-3">
            {PHASES.map((phase, pIdx) => {
              const entries = formState.phaseEntries?.[pIdx] || [{ desc: "", startDate: "", endDate: "" }];
              return (
                <div key={pIdx} className={`border rounded-xl p-3 ${"bg-white border-slate-200 shadow-sm"}`}>
                  <div className="flex gap-3 items-start mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">{phase.num}</div>
                    <div className="flex-1">
                      <span className={`font-bold text-sm ${"text-slate-800"}`}>{phase.title}</span>
                      <span className="text-xs text-blue-400 mr-2">{phase.date}</span>
                    </div>
                  </div>
                  <div className="space-y-2 mr-11">
                    {entries.map((entry, entryIdx) => (
                      <div key={entryIdx} className={`border rounded-lg p-2.5 ${"bg-slate-50 border-slate-200"}`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[10px] font-bold ${"text-blue-600"}`}>نشاط {entryIdx + 1}</span>
                          {entries.length > 1 && (
                            <button onClick={() => removePhaseEntry(pIdx, entryIdx)} className={`text-[10px] mr-auto ${"text-red-500 hover:text-red-600"}`}>حذف</button>
                          )}
                        </div>
                        <textarea value={entry.desc} onChange={(e) => updatePhaseEntry(pIdx, entryIdx, "desc", e.target.value)} placeholder="وصف النشاط..."
                          className={`w-full px-2 py-1.5 border rounded-lg text-xs focus:border-blue-400 outline-none resize-y mb-1.5 ${"bg-white border-slate-200 text-slate-800 placeholder:text-slate-400"}`} rows={2} />
                        <div className="grid grid-cols-2 gap-2">
                          <input type="date" value={entry.startDate} onChange={(e) => updatePhaseEntry(pIdx, entryIdx, "startDate", e.target.value)}
                            className={`px-2 py-1 border rounded-lg text-xs focus:border-blue-400 outline-none ${"bg-white border-slate-200 text-slate-800"}`} />
                          <input type="date" value={entry.endDate} onChange={(e) => updatePhaseEntry(pIdx, entryIdx, "endDate", e.target.value)}
                            className={`px-2 py-1 border rounded-lg text-xs focus:border-blue-400 outline-none ${"bg-white border-slate-200 text-slate-800"}`} />
                        </div>
                      </div>
                    ))}
                    <button onClick={() => addPhaseEntry(pIdx)} className={`inline-flex items-center gap-1 text-[10px] font-bold transition-colors ${"text-blue-600 hover:text-blue-700"}`}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>
                      إضافة نشاط
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      case 6:
        return (
          <div className="space-y-3">
            {(formState.launches || []).map((launch, i) => (
              <div key={i} className={`border rounded-xl p-3 flex gap-3 items-center ${"bg-white border-slate-200 shadow-sm"}`}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">{i + 1}</div>
                <input type="date" value={launch.date} onChange={(e) => updateLaunch(i, "date", e.target.value)}
                  className={`px-2 py-1.5 border rounded-lg text-xs focus:border-amber-400 outline-none w-40 ${"bg-white border-slate-200 text-slate-800"}`} />
                <input type="text" value={launch.desc} onChange={(e) => updateLaunch(i, "desc", e.target.value)} placeholder="وصف الإطلاق"
                  className={`flex-1 px-2 py-1.5 border rounded-lg text-xs focus:border-amber-400 outline-none ${"bg-white border-slate-200 text-slate-800 placeholder:text-slate-400"}`} />
                {(formState.launches || []).length > 1 && (
                  <button onClick={() => removeLaunch(i)} className="text-red-400 hover:text-red-500 w-6 h-6 flex items-center justify-center">×</button>
                )}
              </div>
            ))}
            <button onClick={addLaunch} className={`inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed rounded-lg text-xs font-bold transition-colors ${"bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"}`}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>
              إضافة إطلاق
            </button>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <div className={`border rounded-xl p-4 ${"bg-blue-50/50 border-blue-200"}`}>
              <span className="inline-block bg-gradient-to-l from-blue-600 to-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-3">القيادة</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {renderEditableField("قائد الفريق", "leadName")}
                {renderEditableField("المسمى الوظيفي", "leadTitle")}
                {renderEditableField("نائب القائد", "deputyName")}
                {renderEditableField("المسمى الوظيفي", "deputyTitle")}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-blue-400 mb-2">أعضاء الفريق</h4>
              {renderEditableTable("tblTeam", [
                { key: "name", label: "الاسم" }, { key: "title", label: "المسمى الوظيفي" },
                { key: "dept", label: "الإدارة" }, { key: "area", label: "المجال المسؤول" },
                { key: "email", label: "البريد الإلكتروني" },
              ])}
            </div>
          </div>
        );
      case 8:
        return (
          <div className={`overflow-x-auto border rounded-xl ${"border-slate-200"}`}>
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr>
                  <th className="bg-blue-600 text-white text-xs font-bold py-2.5 px-3 text-right">المسار</th>
                  <th className="bg-blue-600 text-white text-xs font-bold py-2.5 px-3 text-right">الاسم</th>
                  <th className="bg-blue-600 text-white text-xs font-bold py-2.5 px-3 text-right">المسمى</th>
                  <th className="bg-blue-600 text-white text-xs font-bold py-2.5 px-3 text-right">البريد</th>
                  <th className="bg-blue-600 text-white text-xs font-bold py-2.5 px-3 text-right">الهاتف</th>
                </tr>
              </thead>
              <tbody>
                {TRACKS.map((track, tIdx) => {
                  const coordRows = formState.tables.tblCoord || [];
                  return (
                    <tr key={tIdx} className={tIdx % 2 === 1 ? ("bg-slate-50") : "bg-transparent"}>
                      <td className={`py-2 px-3 border-b text-xs font-bold text-blue-500 ${"border-slate-100"}`}>{track}</td>
                      {["name", "title", "email", "phone"].map((field) => (
                        <td key={field} className={`py-1.5 px-2 border-b ${"border-slate-100"}`}>
                          <input type="text" value={coordRows[tIdx]?.[field] || ""} onChange={(e) => updateTableCell("tblCoord", tIdx, field, e.target.value)}
                            className={`w-full px-2 py-1.5 border rounded-lg text-xs focus:border-blue-400 outline-none ${"bg-white border-slate-200 text-slate-800"}`}
                            dir={field === "email" || field === "phone" ? "ltr" : "rtl"} />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      default:
        return null;
    }
  };

  // Calculate completion
  const filledFields = Object.values(formState.fields).filter(v => v && v.trim()).length;
  const totalTables = Object.values(formState.tables).reduce((sum, t) => sum + t.filter(r => Object.values(r).some(v => v && v.trim())).length, 0);
  const completionScore = filledFields + totalTables;

  return (
    <div className={`min-h-screen ${"bg-slate-50"}`} dir="rtl" style={{ fontFamily: 'Tajawal, "IBM Plex Sans Arabic", sans-serif' }}>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${"bg-white/90 border-slate-200"}`}>
        {/* Logo bar */}
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 pt-2 pb-1 flex items-center justify-between">
          <img src={AI_LOGO} alt="مشروع الذكاء الاصطناعي المساعد" className="h-14 sm:h-20 object-contain" /><div className="h-14 sm:h-20 w-14 sm:w-20" />
        </div>
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <h1 className={`text-sm md:text-lg font-bold truncate ${"text-slate-800"}`}>مراجعة وتعديل البيانات</h1>
            <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] md:text-xs font-bold whitespace-nowrap ${"text-blue-600 border-blue-200 bg-blue-50"} border`}>
              {trackName}
            </span>
          </div>
          <div className="flex gap-1.5 sm:gap-2 flex-wrap items-center">
            <button onClick={handleSave} className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-2 bg-emerald-600 text-white rounded-md text-[10px] sm:text-xs font-bold hover:bg-emerald-500 transition-colors shadow-sm">
              <svg className="w-3 sm:w-3.5 h-3 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
              حفظ
            </button>
            {/* Auto-save indicator */}
            {autoSaveStatus !== "idle" && (
              <span className={`inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-all duration-300 ${autoSaveStatus === "saving" ? ("text-amber-600") : ("text-emerald-600")}`}>
                {autoSaveStatus === "saving" ? (
                  <><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg><span className="hidden sm:inline">جاري الحفظ...</span></>
                ) : (
                  <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg><span className="hidden sm:inline">تم الحفظ {lastSavedTime}</span></>
                )}
              </span>
            )}
            <button onClick={exportJSON} className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 bg-transparent border rounded-md text-[10px] sm:text-xs font-medium transition-colors h-7 md:h-8 ${"border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              <svg className="w-3 sm:w-3.5 h-3 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              <span className="hidden sm:inline">JSON</span>
            </button>
            <button onClick={exportPDF} className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 bg-transparent border rounded-md text-[10px] sm:text-xs font-medium transition-colors h-7 md:h-8 ${"border-slate-200 text-red-600 hover:bg-red-50"}`}>
              <svg className="w-3 sm:w-3.5 h-3 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button onClick={() => exportToExcel({ ...formState, phaseEntries: formState.phaseEntries || {}, launches: formState.launches || [] }, trackId)} className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 border rounded-md text-[10px] sm:text-xs font-medium transition-colors h-7 md:h-8 ${"bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"}`}>
              <svg className="w-3 sm:w-3.5 h-3 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button onClick={() => exportToPptx({ ...formState, phaseEntries: formState.phaseEntries || {}, launches: formState.launches || [] }, trackId)} className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 border rounded-md text-[10px] sm:text-xs font-medium transition-colors h-7 md:h-8 ${"bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"}`}>
              <svg className="w-3 sm:w-3.5 h-3 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              <span className="hidden sm:inline">PowerPoint</span>
            </button><button onClick={() => window.print()} className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 bg-transparent border rounded-md text-[10px] sm:text-xs font-medium transition-colors h-7 md:h-8 ${"border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              <svg className="w-3 sm:w-3.5 h-3 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              <span className="hidden sm:inline">طباعة</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* Track Badge */}
        <div className={`relative overflow-hidden border rounded-xl px-5 py-4 mb-6 flex items-center gap-4 ${"bg-white border-slate-200 shadow-sm"}`}>
          <div className="relative flex items-center gap-4 w-full">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-md">
              {trackId}
            </div>
            <div className="flex-1">
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${"text-slate-500"}`}>مراجعة وتعديل البيانات</p>
              <p className={`text-lg font-bold ${"text-slate-800"}`}>{trackName}</p>
            </div>
            <div className={`border rounded-xl px-4 py-2 flex items-center gap-2 ${"bg-slate-50 border-slate-200"}`}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className={`text-[10px] font-bold ${"text-slate-500"}`}>حقول مكتملة</p>
                <p className={`text-lg font-bold ${"text-slate-800"}`}>{completionScore}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-5 flex-wrap">
          <div className="flex gap-2 mr-auto">
            <button onClick={expandAll} className="text-xs text-blue-400 hover:underline font-bold">فتح الكل</button>
            <span className={"text-slate-300"}>|</span>
            <button onClick={collapseAll} className={`text-xs hover:underline font-bold ${"text-slate-500"}`}>إغلاق الكل</button>
          </div>
          <Link href={`/workplan/${trackId}`} className={`inline-flex items-center gap-2 text-sm transition-colors ${"text-slate-500 hover:text-blue-600"}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>
            العودة للنموذج
          </Link>
        </div>

        {/* Accordion Sections */}
        <div className="space-y-3">
          {SECTIONS.map((sec, idx) => (
            <div key={sec.id} className={`border rounded-xl overflow-hidden transition-all ${"bg-white border-slate-200 hover:border-blue-300 shadow-sm"}`}>
              <button onClick={() => toggleSection(idx)} className={`w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 sm:py-4 text-right transition-colors ${"hover:bg-slate-50"}`}>
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-md">
                  {idx + 1}
                </span>
                <svg className={`w-4 h-4 flex-shrink-0 ${"text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d={sec.icon} /></svg>
                <span className={`flex-1 font-bold text-sm ${"text-slate-800"}`}>{sec.name}</span>
                <svg className={`w-5 h-5 transition-transform duration-200 ${expandedSections.has(idx) ? "rotate-180" : ""} ${"text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 9l-7 7-7-7" /></svg>
              </button>
              {expandedSections.has(idx) && (
                <div className={`px-4 sm:px-5 pb-5 border-t ${"border-slate-100"}`}>
                  <div className="pt-4">{renderSectionContent(idx)}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 flex items-center gap-3 justify-center flex-wrap">
          <button onClick={handleSave} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-l from-blue-600 to-blue-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M5 13l4 4L19 7" /></svg>
            حفظ جميع التعديلات
          </button>
          <Link href="/tracks-list" className={`inline-flex items-center gap-2 px-6 py-3 border rounded-xl font-bold transition-colors ${"bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            العودة للمسارات
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className={`no-print border-t mt-8 ${"border-slate-200 bg-white"}`}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-5 flex items-center justify-between flex-wrap gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <img src={AI_LOGO} alt="مشروع الذكاء الاصطناعي المساعد" className="h-9 sm:h-11 w-auto opacity-70" />
          </div>
          <div className={`text-[10px] sm:text-[11px] text-center leading-relaxed ${"text-slate-500"}`}>
            <p>مشروع الذكاء الاصطناعي المساعد لحكومة دولة الإمارات</p>
            <p className="mt-1">© 2026 وزارة شؤون مجلس الوزراء، جميع الحقوق محفوظة</p>
          </div>
          <div className={`text-[10px] sm:text-[11px] ${"text-slate-500"}`}><p>للتواصل: info@mofa.gov.ae</p></div>
        </div>
      </footer>

      {/* Print Header */}
      <div className="print-header">
        <div className="print-title">
          <div>مراجعة بيانات نموذج خطة العمل</div>
          <div className="print-track">{trackName}</div>
        </div>
        <img src={AI_LOGO} alt="مشروع الذكاء الاصطناعي المساعد" />
      </div>

      {/* Print Footer */}
      <div className="print-footer">
        مشروع الذكاء الاصطناعي المساعد لحكومة دولة الإمارات &bull; وزارة شؤون مجلس الوزراء &bull; استراتيجية الإمارات للذكاء الاصطناعي 2031
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className={`fixed bottom-7 left-1/2 -translate-x-1/2 backdrop-blur-xl px-6 py-3 rounded-xl shadow-2xl border text-sm font-bold z-[200] animate-in fade-in slide-in-from-bottom-4 duration-300 flex items-center gap-2 ${"bg-white/95 text-slate-800 border-slate-200 shadow-slate-200/50"}`}>
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          {toastMsg}
        </div>
      )}
    </div>
  );
}

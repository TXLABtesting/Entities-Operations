import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useLocation } from "wouter";
import { exportToExcel } from "@/lib/exportExcel";
import { exportToPptx } from "@/lib/exportPptx";
import { SearchableSelect } from "@/components/SearchableSelect";
import ReadinessReview from "@/components/ReadinessReview";
import BulkUpload from "@/components/BulkUpload";
import federalServicesData from "@/data/federalServices.json";
import servicePackagesData from "@/data/servicePackages.json";
import federalSubServicesData from "@/data/federalSubServices.json";

// Service packages: { entity: { packageName: [services] } }
const SERVICE_PACKAGES: Record<string, Record<string, string[]>> = servicePackagesData as any;

// Federal sub-services: { entity: { mainService: [subServices] } }
const FEDERAL_SUB_SERVICES: Record<string, Record<string, string[]>> = federalSubServicesData as any;

// ===== CONSTANTS =====
const TRACKS = [
  "العمليات والدعم المؤسسي",
  "الخدمات",
  "بناء القدرات والتدريب",
  "تقنيات الذكاء الاصطناعي والبيانات",
  "العمل الحكومي الاستراتيجي",
];

// Federal services data: { entityName: [services list] }
const FEDERAL_SERVICES: Record<string, string[]> = federalServicesData as any;

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

// Entity email domain mapping
const ENTITY_EMAIL_DOMAINS: { [key: string]: string } = {
  "وزارة شؤون مجلس الوزراء": "moca.gov.ae",
  "وزارة الخارجية": "mofaic.gov.ae",
  "وزارة الدفاع": "mod.gov.ae",
  "وزارة المالية": "mof.gov.ae",
  "وزارة الداخلية": "moi.gov.ae",
  "وزارة التربية والتعليم": "moe.gov.ae",
  "وزارة الصحة ووقاية المجتمع": "mohap.gov.ae",
  "وزارة الموارد البشرية والتوطين": "mohre.gov.ae",
  "وزارة العدل": "moj.gov.ae",
  "وزارة الاقتصاد": "moec.gov.ae",
  "وزارة الطاقة والبنية التحتية": "moei.gov.ae",
  "وزارة تنمية المجتمع": "mocd.gov.ae",
  "وزارة الثقافة والشباب": "mcy.gov.ae",
  "وزارة الصناعة والتكنولوجيا المتقدمة": "moiat.gov.ae",
  "وزارة التغير المناخي والبيئة": "moccae.gov.ae",
  "الهيئة الاتحادية للموارد البشرية الحكومية": "fahr.gov.ae",
  "الهيئة الاتحادية للهوية والجنسية والجمارك وأمن المنافذ": "icp.gov.ae",
  "هيئة تنظيم الاتصالات والحكومة الرقمية": "tdra.gov.ae",
  "الهيئة الاتحادية للضرائب": "tax.gov.ae",
  "الهيئة الوطنية لإدارة الطوارئ والأزمات والكوارث": "ncema.gov.ae",
  "المكتب الإعلامي لحكومة الإمارات": "mediaoffice.ae",
  "الأرشيف والمكتبة الوطنية": "na.ae",
  "الهيئة الاتحادية للرقابة النووية": "fanr.gov.ae",
  "هيئة الأوراق المالية والسلع": "sca.gov.ae",
  "المصرف المركزي": "cbuae.gov.ae",
  "مجلس تنافسية الكوادر الإماراتية": "nafis.gov.ae",
  "الهيئة العامة للشؤون الإسلامية والأوقاف والزكاة": "awqaf.gov.ae",
  "الهيئة العامة للمعاشات والتأمينات الاجتماعية": "gpssa.gov.ae",
  "الهيئة الاتحادية للجمارك": "fca.gov.ae",
  "الهيئة العامة للطيران المدني": "gcaa.gov.ae",
  "مؤسسة الإمارات للخدمات الصحية": "ehs.gov.ae",
  "البرنامج الوطني للذكاء الاصطناعي": "ai.gov.ae",
};


const ALL_SECTIONS = [
  { id: "s2", name: "المشاريع والمبادرات", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { id: "s4", name: "العمليات والدعم المؤسسي", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { id: "s5", name: "المستهدفات والنتائج المتوقعة", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { id: "s6", name: "البرنامج الزمني للتنفيذ", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { id: "s7", name: "خطة الإطلاقات والإعلانات", icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
];

// Sections to hide for track 3 (بناء القدرات والتدريب): s4 (العمليات) and s5 (المستهدفات)
const HIDDEN_SECTIONS_BY_TRACK: Record<number, string[]> = {
  3: ["s4", "s5"],
  4: ["s4", "s5"],
};

const SECTION_NAME_OVERRIDES: Record<number, Partial<Record<string, string>>> = {
  2: { s4: "الخدمات" },
  5: { s4: "الأنشطة والمهام المستهدفة" },
};

function getSectionsForTrack(trackId: number) {
  const hidden = HIDDEN_SECTIONS_BY_TRACK[trackId] || [];
  const nameOverrides = SECTION_NAME_OVERRIDES[trackId] || {};
  return ALL_SECTIONS
    .filter((s) => !hidden.includes(s.id))
    .map((s) => ({ ...s, name: nameOverrides[s.id] || s.name }));
}

const PHASES = [
  { num: "1", title: "التقييم والتهيئة", date: "يونيو – يوليو 2026" },
  { num: "2", title: "إطلاق المرحلة الأولى", date: "يوليو – نوفمبر 2026" },
  { num: "3", title: "إطلاق المرحلة الثانية", date: "ديسمبر 2026 – فبراير 2027" },
  { num: "4", title: "إطلاق المرحلة الثالثة", date: "مارس – مايو 2027" },
  { num: "5", title: "إطلاق المرحلة الرابعة", date: "يونيو – أغسطس 2027" },
  { num: "6", title: "إطلاق المرحلة الخامسة", date: "سبتمبر – نوفمبر 2027" },
  { num: "7", title: "إطلاق المرحلة السادسة", date: "ديسمبر 2027 – فبراير 2028" },
  { num: "8", title: "التحسين والتوسع في التطبيق", date: "مارس – مايو 2028" },
];

// Section 4 dropdown options
const DROPDOWN_OPTIONS = {
  processType: ["العمليات التخصصية", "عمليات الدعم المؤسسي"],
  supportProcesses: ["الموارد البشرية", "الشؤون المالية", "المشتريات والعقود", "الدعم التقني", "الأمن السيبراني", "الشؤون الإدارية", "التدقيق الداخلي والحوكمة المؤسسية", "الشؤون التشريعية", "الإعلام والاتصال الحكومي", "إدارة المرافق والصيانة"],
  automation: ["نعم", "جزئياً", "لا"],
  usageIntensity: ["منخفضة", "متوسطة", "عالية"],
  complexity: ["منخفض", "متوسط", "عالٍ"],
  eligibility: ["قابل كلياً", "قابل جزئياً", "غير قابل للتحول", "أخرى"],
  readiness: ["الجاهزية للتحول بنسبة 80% فأكثر", "الجاهزية للتحول بنسبة بين 50% إلى 80%", "الجاهزية للتحول بنسبة بين 30% إلى 50%", "الجاهزية للتحول بنسبة 30% فأقل", "أخرى"],
  priority: ["منخفضة", "متوسطة", "عالية"],
  priorityOriginal: ["نعم", "لا"],
  impact: ["منخفض", "متوسط", "عالٍ"],
  impactOriginal: ["عالي", "متوسط", "منخفض", "أخرى"],
  automationOriginal: ["مؤتمتة كلياً", "مؤتمتة جزئياً", "غير مؤتمتة", "أخرى"],
  complexityOriginal: ["عالي", "متوسط", "منخفض", "أخرى"],
  repetition: ["عالية التكرار", "متوسطة التكرار", "منخفضة التكرار", "أخرى"],
  classification: ["العمليات الاستراتيجية", "العمليات الرئيسية", "عمليات الدعم المؤسسي", "الخدمات الرئيسية", "باقة خدمات", "أخرى"],
  shared: ["نعم", "لا"],
};

const STRATEGIC_ACTIVITY_OPTIONS = {
  automationLevel: ["مؤتمتة كلياً", "مؤتمتة جزئياً", "غير مؤتمتة"],
  usageIntensity: ["عالي", "متوسط", "منخفض"],
  complexityLevel: ["عالي", "متوسط", "منخفض"],
  eligibility: ["قابل كلياً", "قابل جزئياً", "غير قابل للتحول"],
  readiness: [
    "الجاهزية للتحول بنسبة 80% فأكثر",
    "الجاهزية للتحول بنسبة بين 50% إلى 80%",
    "الجاهزية للتحول بنسبة بين 30% إلى 50%",
    "الجاهزية للتحول بنسبة 30% فأقل",
  ],
  transformPriority: ["نعم", "لا"],
  impactLevel: ["عالي", "متوسط", "منخفض"],
};

const STRATEGIC_REFERENCE_ROWS = [
  {
    automationLevel: "مؤتمتة كلياً",
    usageIntensity: "عالي",
    complexityLevel: "عالي",
    eligibility: "قابل كلياً",
    readiness: "الجاهزية للتحول بنسبة 80% فأكثر",
    transformPriority: "نعم",
    impactLevel: "عالي",
  },
  {
    automationLevel: "مؤتمتة جزئياً",
    usageIntensity: "متوسط",
    complexityLevel: "متوسط",
    eligibility: "قابل جزئياً",
    readiness: "الجاهزية للتحول بنسبة بين 50% إلى 80%",
    transformPriority: "لا",
    impactLevel: "متوسط",
  },
  {
    automationLevel: "غير مؤتمتة",
    usageIntensity: "منخفض",
    complexityLevel: "منخفض",
    eligibility: "غير قابل للتحول",
    readiness: "الجاهزية للتحول بنسبة بين 30% إلى 50%",
    transformPriority: "",
    impactLevel: "منخفض",
  },
  {
    automationLevel: "",
    usageIntensity: "",
    complexityLevel: "",
    eligibility: "",
    readiness: "الجاهزية للتحول بنسبة 30% فأقل",
    transformPriority: "",
    impactLevel: "",
  },
];

const SECTION_GUIDANCE: Record<string, string> = {
  s2: "أدخل جميع المشاريع والمبادرات (القائمة وقيد التنفيذ والجديدة) في مجال الذكاء الاصطناعي مع تحديد حالتها والمسار المرتبط بها.",
  s4: "تعبئة بيانات العملية وتقييم جاهزيتها للتحول الذكي. أضف عملية جديدة لكل عملية في الجهة مع تحديد التصنيف والأنشطة الفرعية ومستوى الأتمتة وقابلية التحول.",
  s5: "حدد المخرجات الملموسة المتوقعة من التحول ثم النتائج والأثر المتوقع. أدخل أيضاً عدد نماذج وأنظمة الذكاء الاصطناعي المتوقعة.",
  s6: "حدد الأنشطة والمهام لكل مرحلة زمنية مع إمكانية إضافة إدخالات متعددة لكل مرحلة بتواريخ بدء وانتهاء مستقلة.",
  s7: "أضف الإطلاقات والإعلانات المخطط لها مع تحديد التاريخ والوصف لكل إطلاق.",
};

import { BRAND } from "@/lib/brand";

const AI_LOGO = BRAND.logoColor;
const AI_LOGO_WHITE = BRAND.logoWhite;

// ===== TYPES =====
interface TableRow { [key: string]: string; }
interface PhaseEntry { desc: string; startDate: string; endDate: string; }
interface LaunchEntry { date: string; desc: string; type?: string; }
interface FormState {
  fields: { [key: string]: string };
  tables: { [key: string]: TableRow[] };
  phaseEntries: { [phaseIdx: number]: PhaseEntry[] };
  launches: LaunchEntry[];
}

// ===== HELPERS =====
function getStorageKey(trackId: number) { return `workplan_track_${trackId}_v2`; }

function getInitialState(): FormState {
  return {
    fields: {},
    tables: {
      tblExisting: [{}], tblOps: [{}], tblTeam: [{}],
      tblCoord: TRACKS.map(() => ({})),
    },
    phaseEntries: Object.fromEntries(PHASES.map((_, idx) => [idx, [{ desc: "", startDate: "", endDate: "" }]])),
    launches: [{ date: "", desc: "" }],
  };
}

// Fields that should be shared/auto-filled across all tracks
const SHARED_FIELDS = ["entity", "preparer", "phone", "email", "leadName", "leadTitle", "deputyName", "deputyTitle"] as const;
// Tables that should be shared across tracks
const SHARED_TABLES = ["tblTeam", "tblCoord"] as const;

// Get shared table data from any other track that has them filled
function getSharedTablesFromOtherTracks(currentTrackId: number): Record<string, any[]> {
  const shared: Record<string, any[]> = {};
  for (let i = 1; i <= TRACKS.length; i++) {
    if (i === currentTrackId) continue;
    try {
      const raw = localStorage.getItem(getStorageKey(i));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.tables) {
          for (const tblKey of SHARED_TABLES) {
            if (!shared[tblKey] && parsed.tables[tblKey]) {
              const tbl = parsed.tables[tblKey];
              const hasData = tbl && tbl.length > 0 && !(tbl.length === 1 && Object.keys(tbl[0] || {}).length === 0);
              if (hasData) {
                shared[tblKey] = tbl;
              }
            }
          }
        }
        if (SHARED_TABLES.every(k => shared[k])) break;
      }
    } catch {}
  }
  return shared;
}

// Get shared field values from any other track that has them filled
function getSharedFieldsFromOtherTracks(currentTrackId: number): Record<string, string> {
  const shared: Record<string, string> = {};
  for (let i = 1; i <= TRACKS.length; i++) {
    if (i === currentTrackId) continue;
    try {
      const raw = localStorage.getItem(getStorageKey(i));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.fields) {
          for (const key of SHARED_FIELDS) {
            if (!shared[key] && parsed.fields[key]) {
              shared[key] = parsed.fields[key];
            }
          }
        }
        // If all shared fields found, stop searching
        if (SHARED_FIELDS.every(k => shared[k])) break;
      }
    } catch {}
  }
  return shared;
}

// Load team registration data from page 2
function getTeamRegistrationData(): { fields: Record<string, string>; tblTeam: any[]; tblCoord: any[] } | null {
  try {
    const raw = localStorage.getItem("team_registration_data");
    if (raw) {
      const data = JSON.parse(raw);
      return {
        fields: {
          entity: data.entity || "",
          preparer: data.preparer || "",
          phone: data.phone || "",
          email: data.email || "",
          leadName: data.leadName || "",
          leadTitle: data.leadTitle || "",
          deputyName: data.deputyName || "",
          deputyTitle: data.deputyTitle || "",
        },
        tblTeam: data.tblTeam || [{}],
        tblCoord: data.tblCoord || TRACKS.map(() => ({})),
      };
    }
  } catch {}
  return null;
}

function loadState(trackId: number): FormState {
  try {
    const raw = localStorage.getItem(getStorageKey(trackId));
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migration: ensure new fields exist
      if (!parsed.phaseEntries) parsed.phaseEntries = Object.fromEntries(PHASES.map((_, idx) => [idx, [{ desc: "", startDate: "", endDate: "" }]]));
      if (!parsed.launches) parsed.launches = [{ date: "", desc: "" }];
      if (!parsed.tables.tblOps) parsed.tables.tblOps = [{}];
      // Load from team registration (page 2) - always override shared fields
      const teamData = getTeamRegistrationData();
      if (teamData) {
        for (const key of SHARED_FIELDS) {
          if (teamData.fields[key]) {
            parsed.fields[key] = teamData.fields[key];
          }
        }
        parsed.tables.tblTeam = teamData.tblTeam;
        parsed.tables.tblCoord = teamData.tblCoord;
      } else {
        // Fallback: Auto-fill shared fields from other tracks if empty
        const sharedData = getSharedFieldsFromOtherTracks(trackId);
        for (const key of SHARED_FIELDS) {
          if (!parsed.fields[key] && sharedData[key]) {
            parsed.fields[key] = sharedData[key];
          }
        }
        // Auto-fill shared tables (team & coordinators) from other tracks if empty
        const sharedTables = getSharedTablesFromOtherTracks(trackId);
        for (const tblKey of SHARED_TABLES) {
          const currentTable = parsed.tables[tblKey];
          const isTableEmpty = !currentTable || currentTable.length === 0 || (currentTable.length === 1 && Object.keys(currentTable[0] || {}).length === 0);
          if (isTableEmpty && sharedTables[tblKey]) {
            parsed.tables[tblKey] = sharedTables[tblKey];
          }
        }
      }
      return parsed;
    }
  } catch {}
  // New track: try to auto-fill from team registration first
  const initial = getInitialState();
  const teamData = getTeamRegistrationData();
  if (teamData) {
    for (const key of SHARED_FIELDS) {
      if (teamData.fields[key]) {
        initial.fields[key] = teamData.fields[key];
      }
    }
    initial.tables.tblTeam = teamData.tblTeam;
    initial.tables.tblCoord = teamData.tblCoord;
  } else {
    const sharedData = getSharedFieldsFromOtherTracks(trackId);
    for (const key of SHARED_FIELDS) {
      if (sharedData[key]) {
        initial.fields[key] = sharedData[key];
      }
    }
    // Auto-fill shared tables for new tracks
    const sharedTables = getSharedTablesFromOtherTracks(trackId);
    for (const tblKey of SHARED_TABLES) {
      if (sharedTables[tblKey]) {
        initial.tables[tblKey] = sharedTables[tblKey];
      }
    }
  }
  return initial;
}

function saveState(trackId: number, state: FormState) {
  try { localStorage.setItem(getStorageKey(trackId), JSON.stringify(state)); } catch {}
  // Sync shared fields and tables to ALL other tracks automatically
  syncSharedDataToOtherTracks(trackId, state);
}

function syncSharedDataToOtherTracks(sourceTrackId: number, sourceState: FormState) {
  try {
    for (let i = 1; i <= TRACKS.length; i++) {
      if (i === sourceTrackId) continue;
      const raw = localStorage.getItem(getStorageKey(i));
      if (!raw) continue; // Only sync to tracks that already have data
      const parsed = JSON.parse(raw);
      let changed = false;
      // Sync shared fields
      for (const key of SHARED_FIELDS) {
        const sourceVal = sourceState.fields[key];
        if (sourceVal && parsed.fields[key] !== sourceVal) {
          parsed.fields[key] = sourceVal;
          changed = true;
        }
      }
      // Sync shared tables (team & coordinators)
      for (const tblKey of SHARED_TABLES) {
        const sourceTable = sourceState.tables[tblKey];
        const hasSourceData = sourceTable && sourceTable.length > 0 && !(sourceTable.length === 1 && Object.keys(sourceTable[0] || {}).length === 0);
        if (hasSourceData) {
          const currentStr = JSON.stringify(parsed.tables[tblKey] || []);
          const sourceStr = JSON.stringify(sourceTable);
          if (currentStr !== sourceStr) {
            parsed.tables[tblKey] = sourceTable;
            changed = true;
          }
        }
      }
      if (changed) {
        localStorage.setItem(getStorageKey(i), JSON.stringify(parsed));
      }
    }
  } catch {}
}

function validateEmail(email: string): boolean {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}



// Visual order of tracks as displayed in TracksList page
const TRACKS_VISUAL_ORDER = [3, 4, 1, 5, 2];

// Get selected paths from localStorage
function getSelectedPaths(): number[] {
  try {
    const raw = localStorage.getItem("selectedPaths");
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

// ===== COMPONENT =====
export default function WorkPlan() {
  const params = useParams<{ trackId: string }>();
  const trackId = parseInt(params.trackId || "1");
  const trackName = TRACKS[trackId - 1] || TRACKS[0];

  const [, navigate] = useLocation();
  const [currentSection, setCurrentSection] = useState(0);
  const [formState, setFormState] = useState<FormState>(() => loadState(trackId));
  const [toastMsg, setToastMsg] = useState("");
  const [readinessOpen, setReadinessOpen] = useState(false);
  // Entry path: choose between manual form and bulk upload (skip if data exists)
  const [entryChoice, setEntryChoice] = useState<"choose" | "manual" | "bulk">(() => {
    const init = loadState(trackId);
    const hasData = (init.tables.tblOps || []).some((r) => r.taskName && r.taskName.trim()) || !!(init.fields.entity && init.fields.entity.trim());
    return hasData ? "manual" : "choose";
  });
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSavedTime, setLastSavedTime] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Selected paths navigation
  const selectedPaths = getSelectedPaths();
  // Order selected paths by visual order
  const orderedSelectedPaths = TRACKS_VISUAL_ORDER.filter(id => selectedPaths.includes(id));
  const currentTrackIndex = orderedSelectedPaths.indexOf(trackId);
  const isTrackSelected = selectedPaths.length === 0 || selectedPaths.includes(trackId);
  const hasPrevTrack = currentTrackIndex > 0;
  const hasNextTrack = currentTrackIndex >= 0 && currentTrackIndex < orderedSelectedPaths.length - 1;
  const prevTrackId = hasPrevTrack ? orderedSelectedPaths[currentTrackIndex - 1] : null;
  const nextTrackId = hasNextTrack ? orderedSelectedPaths[currentTrackIndex + 1] : null;



  useEffect(() => {
    const saved = loadState(trackId);
    // Auto-fill track name in relatedTrack field
    const currentTrackName = TRACKS[trackId - 1] || TRACKS[0];
    // Always set relatedTrack to current track name (force override)
    saved.fields.relatedTrack = currentTrackName;
    // Auto-fill relatedTrack in all existing tblOps rows (force override)
    if (saved.tables.tblOps && saved.tables.tblOps.length > 0) {
      saved.tables.tblOps = saved.tables.tblOps.map((row: any) => ({
        ...row,
        relatedTrack: currentTrackName,
      }));
    } else {
      // Initialize first row with relatedTrack
      saved.tables.tblOps = [{ relatedTrack: currentTrackName }];
    }
    // Auto-fill track in tblExisting rows
    if (saved.tables.tblExisting && saved.tables.tblExisting.length > 0) {
      saved.tables.tblExisting = saved.tables.tblExisting.map((row: any) => ({
        ...row,
        track: currentTrackName,
      }));
    } else {
      saved.tables.tblExisting = [{ track: currentTrackName }];
    }
    // Migrate old tblNew data into tblExisting if exists
    if (saved.tables.tblNew && saved.tables.tblNew.length > 0) {
      const migratedRows = saved.tables.tblNew.map((row: any) => ({
        ...row,
        track: currentTrackName,
        status: row.status || "مشروع جديد",
      }));
      saved.tables.tblExisting = [...(saved.tables.tblExisting || []), ...migratedRows];
      delete saved.tables.tblNew;
    }
    setFormState(saved);
    setCurrentSection(0);
    // Show toast notification
    setTimeout(() => {
      setToastMsg(`\u062a\u0645 \u062a\u0639\u0628\u0626\u0629 \u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u0639\u0646\u064a \u062a\u0644\u0642\u0627\u0626\u064a\u0627\u064b: ${currentTrackName}`);
      setTimeout(() => setToastMsg(""), 3500);
    }, 500);
  }, [trackId]);
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

  const showToast = useCallback((msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 2600); }, []);

  const updateField = (key: string, value: string) => {
    setFormState((prev) => {
      const newFields = { ...prev.fields, [key]: value };
      const newTables = { ...prev.tables };
      // Auto-fill email domain when entity is selected
      if (key === "entity" && value) {
        const domain = ENTITY_EMAIL_DOMAINS[value];
        if (domain && !prev.fields.email) {
          newFields.email = `@${domain}`;
        }
        // Clear section 4 table when entity changes (services are entity-specific)
        if (prev.fields.entity && prev.fields.entity !== value) {
          newTables.tblOps = [{}];
        }
      }
      return { ...prev, fields: newFields, tables: newTables };
    });
    // Clear validation error when user types
    if (validationErrors[key]) {
      setValidationErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
    }
  };

  // Fields that should auto-fill across all rows in tblOps when entered
  const AUTO_FILL_FIELDS = ["sector", "department", "section", "relatedTrack"];

  const updateTableCell = (tableId: string, rowIdx: number, field: string, value: string) => {
    setFormState((prev) => {
      const table = [...(prev.tables[tableId] || [])];
      table[rowIdx] = { ...table[rowIdx], [field]: value };
      // Auto-fill similar fields in other rows of tblOps
      if (tableId === "tblOps" && AUTO_FILL_FIELDS.includes(field) && value) {
        for (let i = 0; i < table.length; i++) {
          if (i !== rowIdx && (!table[i][field] || table[i][field] === "")) {
            table[i] = { ...table[i], [field]: value };
          }
        }
      }
      return { ...prev, tables: { ...prev.tables, [tableId]: table } };
    });
  };

  const addRow = (tableId: string) => {
    setFormState((prev) => {
      const currentTable = prev.tables[tableId] || [];
      // Pre-fill new row with common fields from existing rows
      const newRow: Record<string, string> = {};
      if (tableId === "tblOps" && currentTable.length > 0) {
        const lastRow = currentTable[currentTable.length - 1] || {};
        for (const field of AUTO_FILL_FIELDS) {
          if (lastRow[field]) {
            newRow[field] = lastRow[field];
          }
        }
        // Always fill relatedTrack with current track name
        newRow.relatedTrack = TRACKS[trackId - 1] || TRACKS[0];
      }
      // Auto-fill track for tblExisting
      if (tableId === "tblExisting") {
        newRow.track = TRACKS[trackId - 1] || TRACKS[0];
      }
      return { ...prev, tables: { ...prev.tables, [tableId]: [...currentTable, newRow] } };
    });
  };

  const removeRow = (tableId: string, idx: number) => {
    setFormState((prev) => ({ ...prev, tables: { ...prev.tables, [tableId]: (prev.tables[tableId] || []).filter((_, i) => i !== idx) } }));
  };

  // Phase entries management
  const updatePhaseEntry = (phaseIdx: number, entryIdx: number, field: keyof PhaseEntry, value: string) => {
    setFormState((prev) => {
      const entries = [...(prev.phaseEntries[phaseIdx] || [{ desc: "", startDate: "", endDate: "" }])];
      entries[entryIdx] = { ...entries[entryIdx], [field]: value };
      return { ...prev, phaseEntries: { ...prev.phaseEntries, [phaseIdx]: entries } };
    });
  };

  const addPhaseEntry = (phaseIdx: number) => {
    setFormState((prev) => {
      const entries = [...(prev.phaseEntries[phaseIdx] || [])];
      entries.push({ desc: "", startDate: "", endDate: "" });
      return { ...prev, phaseEntries: { ...prev.phaseEntries, [phaseIdx]: entries } };
    });
  };

  const removePhaseEntry = (phaseIdx: number, entryIdx: number) => {
    setFormState((prev) => {
      const entries = (prev.phaseEntries[phaseIdx] || []).filter((_, i) => i !== entryIdx);
      return { ...prev, phaseEntries: { ...prev.phaseEntries, [phaseIdx]: entries.length ? entries : [{ desc: "", startDate: "", endDate: "" }] } };
    });
  };

  // Launch entries management
  const updateLaunch = (idx: number, field: keyof LaunchEntry, value: string) => {
    setFormState((prev) => {
      const launches = [...prev.launches];
      launches[idx] = { ...launches[idx], [field]: value };
      return { ...prev, launches };
    });
  };

  const addLaunch = () => {
    setFormState((prev) => ({ ...prev, launches: [...prev.launches, { date: "", desc: "" }] }));
  };

  const removeLaunch = (idx: number) => {
    setFormState((prev) => ({ ...prev, launches: prev.launches.filter((_, i) => i !== idx) }));
  };

  // Validation
  const validateCurrentSection = (): boolean => {
    const errors: { [key: string]: string } = {};
    if (currentSection === 0) {
      if (formState.fields.email && !validateEmail(formState.fields.email)) {
        errors.email = "صيغة البريد الإلكتروني غير صحيحة";
      }
      if (formState.fields.phone && !/^05\d{8}$/.test(formState.fields.phone)) {
        errors.phone = "رقم الهاتف يجب أن يبدأ بـ 05 ويتكون من 10 أرقام";
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const exportJSON = () => {
    const entity = formState.fields.entity || "federal-entity";
    const blob = new Blob([JSON.stringify(formState, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `خطة-عمل-${entity}-مسار-${trackId}.json`; a.click(); URL.revokeObjectURL(a.href);
    showToast("تم تصدير ملف البيانات");
  };

  const handleSave = () => { saveState(trackId, formState); showToast("تم حفظ النموذج بنجاح"); };


  const handleReset = () => {
    if (window.confirm("هل أنت متأكد من إعادة تعيين النموذج؟")) {
      const fresh = getInitialState(); setFormState(fresh); saveState(trackId, fresh); setCurrentSection(0); showToast("تم إعادة تعيين النموذج");
    }
  };

  // Auto-calculated values from Section 4
  const tblOps = formState.tables.tblOps || [{}];
  const totalOps = tblOps.filter(r => r.taskName && r.taskName.trim()).length;
  const totalEligible = tblOps.filter(r => r.eligibility === "قابل كلياً" || r.eligibility === "قابل جزئياً").length;
  const totalTargeted = tblOps.filter((r) => trackId === 1 ? r.transformPriority === "عالية" : r.transformPriority === "نعم").length;

  const filledFields = Object.values(formState.fields).filter((v) => v && v.trim()).length;
  const totalTableCells = Object.values(formState.tables).reduce((sum, rows) => sum + rows.reduce((s, r) => s + Object.values(r).filter((v) => v && v.trim()).length, 0), 0);
  const completionCount = filledFields + totalTableCells;

  // ===== RENDER HELPERS (Dark Theme - Polished) =====
  const REQUIRED_FIELDS = ["entity", "preparer", "email", "phone"];

  const renderField = (label: string, key: string, type = "text", placeholder = "", options?: { large?: boolean; dir?: string }) => (
    <div className="flex flex-col gap-2.5 group">
      <label className={`text-sm font-semibold group-focus-within:text-blue-500 transition-colors duration-200 ${"text-slate-800"}`}>
        {label}
        {REQUIRED_FIELDS.includes(key) && <span className="text-red-400 mr-1">*</span>}
      </label>
      <input
        type={type}
        value={formState.fields[key] || ""}
        onChange={(e) => updateField(key, e.target.value)}
        placeholder={placeholder}
        dir={options?.dir || (type === "email" ? "ltr" : "rtl")}
        className={`w-full px-5 ${options?.large ? "py-5 text-base" : "py-4 text-[15px]"} ${"bg-white text-slate-800 placeholder:text-slate-400 focus:bg-white shadow-sm"} border ${validationErrors[key] ? "border-red-400/60 ring-2 ring-red-400/10" : "border-slate-200"} rounded-xl focus:border-blue-400/60 focus:ring-3 focus:ring-blue-400/10 transition-all duration-200 outline-none leading-relaxed`}
      />
      {validationErrors[key] && (
        <span className="text-xs text-red-400/90 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          {validationErrors[key]}
        </span>
      )}
    </div>
  );

  const renderSelect = (label: string, key: string, options: string[], placeholder = "اختر...") => (
    <div className="flex flex-col gap-2 group">
      <label className={`text-[13px] font-semibold group-focus-within:text-blue-500 transition-colors duration-200 ${"text-slate-800"}`}>
        {label}
        {REQUIRED_FIELDS.includes(key) && <span className="text-red-400 mr-1">*</span>}
      </label>
      <SearchableSelect
        options={options}
        value={formState.fields[key] || ""}
        onChange={(val) => updateField(key, val)}
        placeholder={placeholder}
        allowOther={false}
        isDark={false}
      />
    </div>
  );

  const renderTextarea = (label: string, key: string, placeholder = "", rows = 4) => (
    <div className="flex flex-col gap-2.5 group">
      <label className={`text-sm font-semibold group-focus-within:text-blue-500 transition-colors duration-200 ${"text-slate-800"}`}>{label}</label>
      <textarea
        value={formState.fields[key] || ""}
        onChange={(e) => updateField(key, e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full px-5 py-4 ${"bg-white text-slate-800 placeholder:text-slate-400 shadow-sm"} border ${"border-slate-200"} rounded-xl focus:border-blue-400/60 focus:ring-3 focus:ring-blue-400/10 transition-all duration-200 outline-none resize-y text-[15px] leading-relaxed`}
      />
    </div>
  );

  const renderGuidance = (text: string) => (
    <div className={`flex items-center gap-3 ${"bg-blue-50 border-blue-200/60"} border rounded-xl p-4 mb-6`}>
      <div className={`w-7 h-7 rounded-lg ${"bg-blue-100"} flex items-center justify-center flex-shrink-0`}>
        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </div>
      <p className={`text-[12px] leading-relaxed flex-1 min-w-0 ${"text-slate-700"}`}>{text}</p>
      <button
        onClick={() => setEntryChoice("bulk")}
        title="إدخال العمليات دفعة واحدة عبر ملف Excel"
        className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-bold bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors active:scale-[0.97]"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
        <span className="whitespace-nowrap">الرفع المجمّع</span>
      </button>
    </div>
  );

  // Get services for selected entity
  const getEntityMainServices = (): string[] => {
    const entity = formState.fields.entity;
    if (!entity) return [];
    const services = FEDERAL_SERVICES[entity];
    if (services) return services;
    // Try partial match
    const match = Object.keys(FEDERAL_SERVICES).find(k => k.includes(entity) || entity.includes(k));
    if (match) return FEDERAL_SERVICES[match];
    return [];
  };

  // Get service packages for the selected entity
  const getEntityPackages = (): { packageNames: string[]; packageServices: Record<string, string[]> } => {
    const entity = formState.fields.entity;
    if (!entity) return { packageNames: [], packageServices: {} };
    // Direct match
    let packages = SERVICE_PACKAGES[entity];
    if (!packages) {
      // Try partial match
      const match = Object.keys(SERVICE_PACKAGES).find(k => k.includes(entity) || entity.includes(k));
      if (match) packages = SERVICE_PACKAGES[match];
    }
    if (!packages) return { packageNames: [], packageServices: {} };
    return { packageNames: Object.keys(packages), packageServices: packages };
  };

  // Get main services and their sub-services for the selected entity (from federalSubServices.json)
  const getEntitySubServices = (): { mainServices: string[]; subServicesMap: Record<string, string[]> } => {
    const entity = formState.fields.entity;
    if (!entity) return { mainServices: [], subServicesMap: {} };
    // Direct match
    let data = FEDERAL_SUB_SERVICES[entity];
    if (!data) {
      // Try partial match
      const match = Object.keys(FEDERAL_SUB_SERVICES).find(k => k.includes(entity) || entity.includes(k));
      if (match) data = FEDERAL_SUB_SERVICES[match];
    }
    if (!data) return { mainServices: [], subServicesMap: {} };
    return { mainServices: Object.keys(data), subServicesMap: data };
  };

  // Get already selected values in a column to prevent duplicates
  const getUsedValues = (tableKey: string, colKey: string, excludeIdx: number): string[] => {
    const rows = formState.tables[tableKey] || [];
    return rows
      .filter((_: any, i: number) => i !== excludeIdx)
      .map((r: any) => r[colKey] || "")
      .filter((v: string) => v && v !== "أخرى");
  };

  // Section 4: Operations form - one row per field (matching form.html layout)
  const renderOpsFormRow = (rowIdx: number) => {
    const row = (formState.tables.tblOps || [{}])[rowIdx] || {};
    const processType = row.taskName_type || "";
    const arabicNums = ["١","٢","٣","٤","٥","٦","٧","٨","٩","١٠","١١","١٢","١٣","١٤","١٥","١٦"];

    const numBadge = (n: number) => (
      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 text-white text-[13px] font-bold flex items-center justify-center shadow-sm shadow-blue-500/20" style={{ fontFamily: "'DM Mono', monospace" }}>
        {arabicNums[n - 1]}
      </span>
    );

    const fieldRow = (num: number, label: string, children: React.ReactNode) => (
      <div className={`grid grid-cols-[1fr] sm:grid-cols-[220px_1fr] items-start sm:items-center gap-2 sm:gap-6 py-4 sm:py-5 border-b last:border-b-0 ${"border-slate-100"}`}>
        <label className={`flex items-center gap-3 text-[14px] font-semibold ${"text-slate-700"}`}>
          {numBadge(num)}
          <span className="leading-snug">{label}</span>
        </label>
        <div className="relative w-full">{children}</div>
      </div>
    );

    const inputCls = `w-full px-4 py-3 text-[14px] rounded-xl border transition-all duration-150 outline-none ${"bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-400/15"}`;

    const selectField = (key: string, options: string[], placeholder: string) => (
      <SearchableSelect
        options={options}
        value={row[key] || ""}
        onChange={(val) => updateTableCell("tblOps", rowIdx, key, val)}
        placeholder={placeholder}
        allowOther={false}
        isDark={false}
        size="md"
      />
    );

    return (
      <div className="space-y-0">
        {/* 1. العملية (process type) */}
        {fieldRow(1, "العملية", selectField("taskName_type", DROPDOWN_OPTIONS.processType, "اختر نوع العملية…"))}

        {/* 2. العملية (detail - conditional) */}
        {fieldRow(2, "العملية", processType === "عمليات الدعم المؤسسي" ? (
          selectField("taskName", DROPDOWN_OPTIONS.supportProcesses, "اختر عملية الدعم المؤسسي…")
        ) : (
          <input type="text" value={row.taskName || ""} onChange={(e) => updateTableCell("tblOps", rowIdx, "taskName", e.target.value)} placeholder="أدخل اسم العملية…" className={inputCls} />
        ))}

        {/* 3. الأنشطة الفرعية */}
        {fieldRow(3, "الأنشطة الفرعية", (
          <textarea value={row.subActivities || ""} onChange={(e) => updateTableCell("tblOps", rowIdx, "subActivities", e.target.value)} placeholder="اذكر الأنشطة الفرعية للعملية…" className={`${inputCls} resize-y min-h-[48px]`} rows={2} />
        ))}

        {/* 4. الجهة الاتحادية المعنية */}
        {fieldRow(4, "الجهة الاتحادية المعنية", (
          <input type="text" value={row.sector || formState.fields.entity || ""} onChange={(e) => updateTableCell("tblOps", rowIdx, "sector", e.target.value)} placeholder="اسم الجهة الاتحادية…" className={inputCls} />
        ))}

        {/* 5. القطاع المعني */}
        {fieldRow(5, "القطاع المعني", (
          <input type="text" value={row.department || ""} onChange={(e) => updateTableCell("tblOps", rowIdx, "department", e.target.value)} placeholder="اسم القطاع…" className={inputCls} />
        ))}

        {/* 6. الإدارة المعنية */}
        {fieldRow(6, "الإدارة المعنية", (
          <input type="text" value={row.section || ""} onChange={(e) => updateTableCell("tblOps", rowIdx, "section", e.target.value)} placeholder="اسم الإدارة…" className={inputCls} />
        ))}

        {/* 7. القسم المعني */}
        {fieldRow(7, "القسم المعني", (
          <input type="text" value={row.relatedSection || ""} onChange={(e) => updateTableCell("tblOps", rowIdx, "relatedSection", e.target.value)} placeholder="اسم القسم…" className={inputCls} />
        ))}

        {/* 8. مستوى الأتمتة */}
        {fieldRow(8, "مستوى الأتمتة", selectField("automationLevel", DROPDOWN_OPTIONS.automation, "اختر…"))}

        {/* 9. نسبة الأتمتة */}
        {fieldRow(9, "ما هي نسبة الأتمتة؟", (
          <div className="relative">
            <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none ${"text-slate-500"}`} style={{ fontFamily: "'DM Mono', monospace" }}>%</span>
            <input type="number" min={0} max={100} value={row.automationPct || ""} onChange={(e) => updateTableCell("tblOps", rowIdx, "automationPct", e.target.value)} placeholder="0 – 100" className={`${inputCls} pl-10`} />
          </div>
        ))}

        {/* 10. نظام الأتمتة */}
        {fieldRow(10, "ما هو نظام الأتمتة؟", (
          <input type="text" value={row.automationSystem || ""} onChange={(e) => updateTableCell("tblOps", rowIdx, "automationSystem", e.target.value)} placeholder="اسم النظام المستخدم…" className={inputCls} />
        ))}

        {/* 11. كثافة الاستخدام */}
        {fieldRow(11, "كثافة الاستخدام", selectField("usageIntensity", DROPDOWN_OPTIONS.usageIntensity, "اختر المستوى…"))}

        {/* 12. مستوى التعقيد */}
        {fieldRow(12, "مستوى التعقيد", selectField("complexityLevel", DROPDOWN_OPTIONS.complexity, "اختر المستوى…"))}

        {/* 13. قابلية التحول */}
        {fieldRow(13, "قابلية التحول", selectField("eligibility", DROPDOWN_OPTIONS.eligibility, "اختر…"))}

        {/* 14. جاهزية التحول */}
        {fieldRow(14, "جاهزية التحول", selectField("readiness", DROPDOWN_OPTIONS.readiness, "اختر…"))}

        {/* 15. أولوية التحول */}
        {fieldRow(15, "أولوية التحول", selectField("transformPriority", DROPDOWN_OPTIONS.priority, "اختر المستوى…"))}

        {/* 16. مستوى الأثر المتوقع */}
        {fieldRow(16, "مستوى الأثر المتوقع من التحول", selectField("impactLevel", DROPDOWN_OPTIONS.impact, "اختر المستوى…"))}
      </div>
    );
  };

  const renderTable = (tableId: string, columns: { key: string; label: string; type?: string; hint?: string; options?: string[] }[]) => {
    const rows = formState.tables[tableId] || [{}];
    return (
      <div className={`overflow-x-auto border ${"border-slate-200 shadow-sm"} rounded-2xl`}>
        <table className="w-full min-w-[500px] sm:min-w-[700px] border-collapse text-xs sm:text-sm">
          <thead>
            <tr>
              <th className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] sm:text-xs font-bold py-3 sm:py-3.5 px-2 sm:px-3 text-right w-8 sm:w-10">#</th>
              {columns.map((col) => (
                <th key={col.key} className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] sm:text-xs font-bold py-3 sm:py-3.5 px-2 sm:px-3 text-right">
                  {col.label}
                  {col.hint && <span className={`block text-[10px] font-normal mt-0.5 ${"text-white/80"}`}>{col.hint}</span>}
                </th>
              ))}
              <th className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] sm:text-xs font-bold py-3 sm:py-3.5 px-2 sm:px-3 w-8 sm:w-10"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className={`${idx % 2 === 1 ? ("bg-slate-50/50") : "bg-transparent"} ${"hover:bg-blue-50/30"} transition-colors`}>
                <td className={`text-center text-blue-500 font-bold text-xs py-2.5 px-2 border-b ${"border-slate-100"}`}>{idx + 1}</td>
                {columns.map((col) => (
                  <td key={col.key} className={`py-2 px-2 border-b ${"border-slate-100"}`}>
                    {col.type === "readonly" ? (
                      <div className={`w-full px-3 py-2.5 ${"bg-blue-50 border-blue-200 text-blue-700"} border rounded-lg text-xs font-bold text-center`}>
                        {row[col.key] || trackName}
                      </div>
                    ) : col.type === "select" || col.type === "dropdown" ? (
                      <SearchableSelect
                        options={col.options || (col.key === "track" ? TRACKS : col.key === "status" ? ["قائم", "قيد التنفيذ", "مشروع جديد"] : [])}
                        value={row[col.key] || ""}
                        onChange={(val) => {
                          if (val === "أخرى") {
                            updateTableCell(tableId, idx, col.key, "أخرى");
                          } else {
                            updateTableCell(tableId, idx, col.key, val);
                            updateTableCell(tableId, idx, col.key + "_custom", "");
                          }
                        }}
                        placeholder="اختر..."
                        allowOther={col.key !== "track" && col.key !== "status"}
                        otherValue={row[col.key + "_custom"] || ""}
                        onOtherChange={(val) => updateTableCell(tableId, idx, col.key + "_custom", val)}
                        isDark={false}
                      />
                    ) : col.type === "textarea" ? (
                      <textarea
                        value={row[col.key] || ""}
                        onChange={(e) => updateTableCell(tableId, idx, col.key, e.target.value)}
                        placeholder={col.hint || ""}
                        className={`w-full px-3.5 py-3 ${"bg-white border-slate-200 text-slate-800 placeholder:text-slate-300"} border rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none resize-y min-h-[52px] transition-all leading-relaxed`}
                        rows={3}
                      />
                    ) : (
                      <input
                        type={col.type || "text"}
                        value={row[col.key] || ""}
                        onChange={(e) => updateTableCell(tableId, idx, col.key, e.target.value)}
                        placeholder={col.hint || ""}
                        className={`w-full px-3.5 py-3 ${"bg-white border-slate-200 text-slate-800 placeholder:text-slate-300"} border rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all`}
                      />
                    )}
                  </td>
                ))}
                <td className={`py-2 px-2 border-b ${"border-slate-100"}`}>
                  <button onClick={() => removeRow(tableId, idx)} className="text-red-400 hover:text-red-600 hover:bg-red-400/10 rounded-lg w-7 h-7 flex items-center justify-center text-base transition-all" title="حذف">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={`p-3.5 border-t ${"border-slate-100"}`}>
          <button onClick={() => addRow(tableId)} className={`inline-flex items-center gap-2 px-4 py-2.5 border border-dashed rounded-xl text-xs font-bold transition-all active:scale-[0.97] ${"bg-blue-50 text-blue-600 border-blue-300 hover:bg-blue-100 hover:border-blue-400"}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>
            إضافة صف
          </button>
        </div>
      </div>
    );
  };

  // ===== SECTION RENDERERS =====
  const renderSection1 = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {renderSelect("اسم الجهة الاتحادية", "entity", FEDERAL_ENTITIES, "اختر الجهة الاتحادية")}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {renderField("اسم معد الخطة", "preparer", "text", "مثال: أحمد محمد العلي")}
        {renderField("رقم الهاتف", "phone", "tel", "0501234567", { dir: "ltr" })}
      </div>
      {renderField("البريد الإلكتروني", "email", "email", "ahmed.ali@moca.gov.ae", { large: true })}
    </div>
  );

  const renderSection2 = () => (
    <div>
      {renderGuidance(SECTION_GUIDANCE.s2)}
      {renderTable("tblExisting", [
        { key: "name", label: "اسم المشروع", hint: "مثال: مشروع أتمتة خدمات المتعاملين" }, { key: "desc", label: "الوصف", type: "textarea", hint: "وصف مختصر للمشروع" },
        { key: "output", label: "المخرجات", type: "textarea", hint: "مثال: نظام ذكي للرد الآلي" }, { key: "end", label: "تاريخ الانتهاء", type: "date" },
        { key: "impact", label: "الأثر المتوقع", type: "textarea", hint: "مثال: تقليل وقت المعالجة 50%" },
        { key: "status", label: "الحالة", type: "select" }, { key: "track", label: "المسار", type: "readonly" },
      ])}
    </div>
  );

  const [activeOpsIdx, setActiveOpsIdx] = useState(0);

  const renderSection4Strategic = () => {
    const rows = formState.tables.tblOps || [{}];
    const cellInputCls = `w-full min-w-[130px] px-3.5 py-3 ${"bg-white border-slate-200 text-slate-800 placeholder:text-slate-300"} border rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15 outline-none transition-all`;
    const cellTextAreaCls = `${cellInputCls} resize-y min-h-[72px] leading-relaxed`;
    const headerCls = "bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] sm:text-xs font-bold py-3 px-3 text-right align-top";
    const cellCls = `py-2 px-2 border-b align-top ${"border-slate-100"}`;

    const renderStrategicSelect = (row: Record<string, string>, idx: number, key: string, options: string[], placeholder = "اختر...") => (
      <select
        value={row[key] || ""}
        onChange={(e) => updateTableCell("tblOps", idx, key, e.target.value)}
        className={cellInputCls}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    );

    return (
      <div className="space-y-6">
        <div className={`${"bg-white border-slate-200 shadow-sm"} border rounded-2xl overflow-hidden`}>
          <div className={`px-5 sm:px-6 py-5 border-b ${"bg-gradient-to-l from-blue-50/70 to-transparent border-slate-100"}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold border ${"bg-blue-50 border-blue-200 text-blue-700"}`}>
                  ضمن مسؤولية فريق عمل المسار
                </span>
                <h3 className={`text-xl sm:text-2xl font-bold mt-3 ${"text-slate-800"}`}>الأنشطة والمهام المستهدفة</h3>
                <p className={`text-sm mt-2 max-w-4xl leading-7 ${"text-slate-600"}`}>
                  الأنشطة والمهام ذات الأولوية للتحول إلى أنظمة الذكاء الاصطناعي المساعد والتي سيتم تطويرها وتنفيذها من قبل فريق عمل المسار.
                </p>
              </div>
              <div className={`grid grid-cols-3 gap-2 min-w-[220px] ${"text-slate-700"}`}>
                <div className={`rounded-xl border p-3 text-center ${"bg-slate-50 border-slate-200"}`}>
                  <p className="text-[10px] font-bold mb-1">إجمالي العناصر</p>
                  <p className="text-2xl font-bold text-blue-500">{totalOps}</p>
                </div>
                <div className={`rounded-xl border p-3 text-center ${"bg-slate-50 border-slate-200"}`}>
                  <p className="text-[10px] font-bold mb-1">قابلة للتحول</p>
                  <p className="text-2xl font-bold text-emerald-500">{totalEligible}</p>
                </div>
                <div className={`rounded-xl border p-3 text-center ${"bg-slate-50 border-slate-200"}`}>
                  <p className="text-[10px] font-bold mb-1">أولوية التحول</p>
                  <p className="text-2xl font-bold text-amber-500">{totalTargeted}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className={`overflow-x-auto border ${"border-slate-200 shadow-sm"} rounded-2xl`}>
              <table className="w-full min-w-[1700px] border-collapse text-xs sm:text-sm">
                <thead>
                  <tr>
                    <th className={`${headerCls} w-10`}>#</th>
                    <th className={headerCls}>المهام</th>
                    <th className={headerCls}>الأنشطة</th>
                    <th className={headerCls}>الجهة الاتحادية المعنية</th>
                    <th className={headerCls}>الوحدة التنظيمية المعنية</th>
                    <th className={headerCls}>مستوى الأتمتة</th>
                    <th className={headerCls}>ما هي نسبة الأتمتة؟</th>
                    <th className={headerCls}>ما هو نظام الأتمتة؟</th>
                    <th className={headerCls}>كثافة الاستخدام</th>
                    <th className={headerCls}>مستوى التعقيد</th>
                    <th className={headerCls}>قابلية التحول</th>
                    <th className={headerCls}>جاهزية التحول</th>
                    <th className={headerCls}>أولوية التحول</th>
                    <th className={headerCls}>مستوى الأثر المتوقع من التحول</th>
                    <th className={`${headerCls} w-10`}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} className={`${idx % 2 === 1 ? ("bg-slate-50/60") : "bg-transparent"} ${"hover:bg-blue-50/40"} transition-colors`}>
                      <td className={`${cellCls} text-center text-blue-500 font-bold`}>{idx + 1}</td>
                      <td className={cellCls}>
                        <textarea
                          value={row.taskName || ""}
                          onChange={(e) => updateTableCell("tblOps", idx, "taskName", e.target.value)}
                          placeholder="أدخل المهام المستهدفة..."
                          className={cellTextAreaCls}
                          rows={3}
                        />
                      </td>
                      <td className={cellCls}>
                        <textarea
                          value={row.subActivities || ""}
                          onChange={(e) => updateTableCell("tblOps", idx, "subActivities", e.target.value)}
                          placeholder="أدخل الأنشطة المرتبطة..."
                          className={cellTextAreaCls}
                          rows={3}
                        />
                      </td>
                      <td className={cellCls}>
                        <input
                          type="text"
                          value={row.sector || formState.fields.entity || ""}
                          onChange={(e) => updateTableCell("tblOps", idx, "sector", e.target.value)}
                          placeholder="اسم الجهة الاتحادية..."
                          className={cellInputCls}
                        />
                      </td>
                      <td className={cellCls}>
                        <input
                          type="text"
                          value={row.department || ""}
                          onChange={(e) => updateTableCell("tblOps", idx, "department", e.target.value)}
                          placeholder="اسم الوحدة التنظيمية..."
                          className={cellInputCls}
                        />
                      </td>
                      <td className={cellCls}>{renderStrategicSelect(row, idx, "automationLevel", STRATEGIC_ACTIVITY_OPTIONS.automationLevel)}</td>
                      <td className={cellCls}>
                        <div className="relative">
                          <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-[13px] pointer-events-none ${"text-slate-500"}`}>%</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={row.automationPct || ""}
                            onChange={(e) => updateTableCell("tblOps", idx, "automationPct", e.target.value)}
                            placeholder="0 - 100"
                            className={`${cellInputCls} pl-9`}
                          />
                        </div>
                      </td>
                      <td className={cellCls}>
                        <input
                          type="text"
                          value={row.automationSystem || ""}
                          onChange={(e) => updateTableCell("tblOps", idx, "automationSystem", e.target.value)}
                          placeholder="اسم النظام..."
                          className={cellInputCls}
                        />
                      </td>
                      <td className={cellCls}>{renderStrategicSelect(row, idx, "usageIntensity", STRATEGIC_ACTIVITY_OPTIONS.usageIntensity)}</td>
                      <td className={cellCls}>{renderStrategicSelect(row, idx, "complexityLevel", STRATEGIC_ACTIVITY_OPTIONS.complexityLevel)}</td>
                      <td className={cellCls}>{renderStrategicSelect(row, idx, "eligibility", STRATEGIC_ACTIVITY_OPTIONS.eligibility)}</td>
                      <td className={cellCls}>{renderStrategicSelect(row, idx, "readiness", STRATEGIC_ACTIVITY_OPTIONS.readiness)}</td>
                      <td className={cellCls}>{renderStrategicSelect(row, idx, "transformPriority", STRATEGIC_ACTIVITY_OPTIONS.transformPriority)}</td>
                      <td className={cellCls}>{renderStrategicSelect(row, idx, "impactLevel", STRATEGIC_ACTIVITY_OPTIONS.impactLevel)}</td>
                      <td className={cellCls}>
                        <button onClick={() => removeRow("tblOps", idx)} className="text-red-400 hover:text-red-600 hover:bg-red-400/10 rounded-lg w-8 h-8 flex items-center justify-center text-base transition-all" title="حذف">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className={`p-3.5 border-t ${"border-slate-100"}`}>
                <button onClick={() => addRow("tblOps")} className={`inline-flex items-center gap-2 px-4 py-2.5 border border-dashed rounded-xl text-xs font-bold transition-all active:scale-[0.97] ${"bg-blue-50 text-blue-600 border-blue-300 hover:bg-blue-100 hover:border-blue-400"}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>
                  إضافة مهمة / نشاط
                </button>
              </div>
            </div>
          </div>
        </div>


      </div>
    );
  };

  const renderSection4TableOps = () => {
    const rows = formState.tables.tblOps || [{}];
    const columns = [
      { key: "taskName_type", label: "نوع العملية", type: "dropdown", options: DROPDOWN_OPTIONS.processType },
      { key: "taskName", label: "العملية", type: "text", hint: "أدخل اسم العملية" },
      { key: "subActivities", label: "الأنشطة الفرعية", type: "text", hint: "اذكر الأنشطة الفرعية" },
      { key: "sector", label: "الجهة الاتحادية المعنية", type: "text", hint: "اسم الجهة" },
      { key: "department", label: "القطاع المعني", type: "text", hint: "اسم القطاع" },
      { key: "section", label: "الإدارة المعنية", type: "text", hint: "اسم الإدارة" },
      { key: "relatedSection", label: "القسم المعني", type: "text", hint: "اسم القسم" },
      { key: "automationLevel", label: "مستوى الأتمتة", type: "dropdown", options: DROPDOWN_OPTIONS.automation },
      { key: "automationPct", label: "نسبة الأتمتة", type: "text", hint: "0 - 100" },
      { key: "automationSystem", label: "نظام الأتمتة", type: "text", hint: "اسم النظام" },
      { key: "usageIntensity", label: "كثافة الاستخدام", type: "dropdown", options: DROPDOWN_OPTIONS.usageIntensity },
      { key: "complexityLevel", label: "مستوى التعقيد", type: "dropdown", options: DROPDOWN_OPTIONS.complexity },
      { key: "eligibility", label: "قابلية التحول", type: "dropdown", options: DROPDOWN_OPTIONS.eligibility },
      { key: "readiness", label: "جاهزية التحول", type: "dropdown", options: DROPDOWN_OPTIONS.readiness },
      { key: "transformPriority", label: "أولوية التحول", type: "dropdown", options: DROPDOWN_OPTIONS.priority },
      { key: "impactLevel", label: "مستوى الأثر المتوقع", type: "dropdown", options: DROPDOWN_OPTIONS.impact },
    ];
    return (
      <div className={`overflow-x-auto border ${"border-slate-200 shadow-sm"} rounded-2xl`}>
        <table className="w-full min-w-[2400px] border-collapse text-xs">
          <thead>
            <tr>
              <th className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] font-bold py-3.5 px-2 text-right w-8 sticky left-0 z-10">#</th>
              {columns.map((col) => (
                <th key={col.key} className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] font-bold py-3.5 px-2 text-right min-w-[120px]">
                  {col.label}
                </th>
              ))}
              <th className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] font-bold py-3.5 px-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className={`${idx % 2 === 1 ? ("bg-slate-50/50") : "bg-transparent"} ${"hover:bg-blue-50/30"} transition-colors`}>
                <td className={`text-center text-blue-500 font-bold text-xs py-2 px-2 border-b ${"border-slate-100"} sticky left-0 bg-inherit`}>{idx + 1}</td>
                {columns.map((col) => (
                  <td key={col.key} className={`py-2.5 px-2 border-b ${"border-slate-100"}`}>
                    {col.type === "dropdown" ? (
                      <SearchableSelect
                        options={col.options || []}
                        value={row[col.key] || ""}
                        onChange={(val) => {
                          updateTableCell("tblOps", idx, col.key, val);
                        }}
                        placeholder="اختر..."
                        allowOther={false}
                        isDark={false}
                      />
                    ) : (
                      <input
                        type="text"
                        value={row[col.key] || ""}
                        onChange={(e) => updateTableCell("tblOps", idx, col.key, e.target.value)}
                        placeholder={col.hint || ""}
                        className={`w-full px-3 py-2.5 ${"bg-white border-slate-200 text-slate-800 placeholder:text-slate-300"} border rounded-lg text-xs focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all`}
                      />
                    )}
                  </td>
                ))}
                <td className={`py-2 px-2 border-b ${"border-slate-100"}`}>
                  <button onClick={() => removeRow("tblOps", idx)} className="text-red-400 hover:text-red-600 hover:bg-red-400/10 rounded-lg w-7 h-7 flex items-center justify-center text-base transition-all" title="حذف">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={`p-3.5 border-t ${"border-slate-100"}`}>
          <button onClick={() => addRow("tblOps")} className={`inline-flex items-center gap-2 px-4 py-2.5 border border-dashed rounded-xl text-xs font-bold transition-all active:scale-[0.97] ${"bg-blue-50 text-blue-600 border-blue-300 hover:bg-blue-100 hover:border-blue-400"}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>
            إضافة صف
          </button>
        </div>
      </div>
    );
  };

  const renderSection4Table = () => {
    const rows = formState.tables.tblOps || [{}];
    const entityMainServices = getEntityMainServices();
    const { packageNames, packageServices } = getEntityPackages();
    const { mainServices: entityMainSvcList, subServicesMap } = getEntitySubServices();
    // Show service dropdown only for track 2 (الخدمات) AND only if entity has services in the data
    const hasServices = trackId === 2 && entityMainServices.length > 0;
    const hasPackages = trackId === 2 && packageNames.length > 0;
    const hasSubServices = trackId === 2 && entityMainSvcList.length > 0;

    // Merge packages and main services into one unified list for "الخدمة الرئيسية"
    // Both packages and main services appear together in the same dropdown
    const unifiedMainServices: string[] = [];
    const unifiedSubServicesMap: Record<string, string[]> = {};
    if (hasPackages) {
      for (const pkg of packageNames) {
        unifiedMainServices.push(pkg);
        unifiedSubServicesMap[pkg] = packageServices[pkg] || [];
      }
    }
    if (hasSubServices) {
      for (const svc of entityMainSvcList) {
        if (!unifiedMainServices.includes(svc)) {
          unifiedMainServices.push(svc);
        }
        // Merge sub-services (packages may have same name as main service)
        const existing = unifiedSubServicesMap[svc] || [];
        const newSubs = subServicesMap[svc] || [];
        unifiedSubServicesMap[svc] = [...existing, ...newSubs.filter(s => !existing.includes(s))];
      }
    }
    const hasUnifiedServices = unifiedMainServices.length > 0;

    const columns = [
      // Priority: 1) Unified (packages + main services), 2) Flat services, 3) Text
      ...(hasUnifiedServices ? [
        { key: "mainServiceName", label: "الخدمة الرئيسية", type: "unified-main-dropdown", options: unifiedMainServices },
        { key: "taskName", label: "الخدمة الفرعية", type: "unified-sub-dropdown", options: [] as string[] },
      ] : hasServices ? [
        { key: "taskName", label: "الخدمة", type: "entity-dropdown", options: entityMainServices },
      ] : [
        { key: "taskName", label: "الخدمة الرئيسية", type: "text", hint: "مثال: خدمة إصدار التصاريح" },
        { key: "subActivities", label: "الخدمة الفرعية", type: "text", hint: "مثال: تجديد التصريح - إلغاء التصريح" },
      ]),
      { key: "classification", label: "التصنيف", type: "dropdown", options: DROPDOWN_OPTIONS.classification },
      { key: "isShared", label: "هل تعتبر مشتركة؟", type: "dropdown", options: DROPDOWN_OPTIONS.shared },

      { key: "automationLevel", label: "مستوى الأتمتة", type: "dropdown", options: DROPDOWN_OPTIONS.automationOriginal },
      { key: "automationPct", label: "نسبة الأتمتة", type: "text", hint: "مثال: 60%" },
      { key: "automationSystem", label: "نظام الأتمتة", type: "text", hint: "مثال: SAP / Oracle" },
      { key: "usageIntensity", label: "كثافة الاستخدام", type: "text", hint: "مثال: 500 معاملة/شهر" },

      { key: "eligibility", label: "القابلية للتحول", type: "dropdown", options: DROPDOWN_OPTIONS.eligibility },
      { key: "readiness", label: "الجاهزية للتحول", type: "dropdown", options: DROPDOWN_OPTIONS.readiness },
      { key: "transformPriority", label: "أولوية التحول", type: "dropdown", options: DROPDOWN_OPTIONS.priorityOriginal },
      { key: "impactLevel", label: "مستوى الأثر المتوقع", type: "dropdown", options: DROPDOWN_OPTIONS.impactOriginal },
      { key: "complexityLevel", label: "مستوى التعقيد", type: "dropdown", options: DROPDOWN_OPTIONS.complexityOriginal },
      { key: "relatedTrack", label: "المسار المعني", type: "readonly" },
      { key: "notes", label: "الملاحظات", type: "text", hint: "ملاحظات إضافية إن وجدت" },
    ];
    return (
      <div className={`overflow-x-auto border ${"border-slate-200 shadow-sm"} rounded-2xl`}>
        <table className="w-full min-w-[2400px] border-collapse text-xs">
          <thead>
            <tr>
              <th className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] font-bold py-3.5 px-2 text-right w-8 sticky left-0 z-10">#</th>
              {columns.map((col) => (
                <th key={col.key} className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] font-bold py-3.5 px-2 text-right min-w-[120px]">
                  {col.label}
                </th>
              ))}
              <th className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] font-bold py-3.5 px-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className={`${idx % 2 === 1 ? ("bg-slate-50/50") : "bg-transparent"} ${"hover:bg-blue-50/30"} transition-colors`}>
                <td className={`text-center text-blue-500 font-bold text-xs py-2 px-2 border-b ${"border-slate-100"} sticky left-0 bg-inherit`}>{idx + 1}</td>
                {columns.map((col) => {
                  // Get available sub-services for this row's selected main service (unified)
                  const rowMainService = row.mainServiceName || "";
                  const availableUnifiedSubServices = rowMainService && unifiedSubServicesMap[rowMainService] ? unifiedSubServicesMap[rowMainService] : [];
                  // Filter out already-used sub-services within same main service to prevent duplicates
                  const usedUnifiedSubServices = getUsedValues("tblOps", "taskName", idx).filter(v => {
                    const otherRows = (formState.tables.tblOps || []).filter((_: any, i: number) => i !== idx);
                    return otherRows.some((r: any) => r.mainServiceName === rowMainService && r.taskName === v);
                  });
                  const filteredUnifiedSubServices = availableUnifiedSubServices.filter(s => !usedUnifiedSubServices.includes(s));


                  return (
                  <td key={col.key} className={`py-2.5 px-2 border-b ${"border-slate-100"}`}>
                    {col.type === "unified-main-dropdown" ? (
                      <SearchableSelect
                        options={col.options || []}
                        value={row[col.key] || ""}
                        onChange={(val) => {
                          if (val === "أخرى") {
                            updateTableCell("tblOps", idx, col.key, "أخرى");
                          } else {
                            updateTableCell("tblOps", idx, col.key, val);
                            updateTableCell("tblOps", idx, col.key + "_custom", "");
                            // Clear the sub-service when main service changes
                            updateTableCell("tblOps", idx, "taskName", "");
                            updateTableCell("tblOps", idx, "taskName_custom", "");
                            // Auto-set classification to باقة خدمات if it's a package
                            if (packageNames.includes(val)) {
                              updateTableCell("tblOps", idx, "classification", "باقة خدمات");
                            }
                          }
                        }}
                        placeholder="اختر الخدمة الرئيسية..."
                        allowOther={true}
                        otherValue={row[col.key + "_custom"] || ""}
                        onOtherChange={(val) => updateTableCell("tblOps", idx, col.key + "_custom", val)}
                        isDark={false}
                      />
                    ) : col.type === "unified-sub-dropdown" ? (
                      <SearchableSelect
                        options={filteredUnifiedSubServices}
                        value={row[col.key] || ""}
                        onChange={(val) => {
                          if (val === "أخرى") {
                            updateTableCell("tblOps", idx, col.key, "أخرى");
                          } else {
                            updateTableCell("tblOps", idx, col.key, val);
                            updateTableCell("tblOps", idx, col.key + "_custom", "");
                          }
                        }}
                        placeholder={rowMainService ? "اختر الخدمة الفرعية..." : "اختر الخدمة الرئيسية أولاً"}
                        allowOther={true}
                        otherValue={row[col.key + "_custom"] || ""}
                        onOtherChange={(val) => updateTableCell("tblOps", idx, col.key + "_custom", val)}
                        isDark={false}
                      />
                    ) : col.type === "entity-dropdown" ? (
                      <SearchableSelect
                        options={(col.options || []).filter(o => !getUsedValues("tblOps", col.key, idx).includes(o))}
                        value={row[col.key] || ""}
                        onChange={(val) => {
                          if (val === "أخرى") {
                            updateTableCell("tblOps", idx, col.key, "أخرى");
                          } else {
                            updateTableCell("tblOps", idx, col.key, val);
                            updateTableCell("tblOps", idx, col.key + "_custom", "");
                            if (formState.fields.entity) {
                              updateTableCell("tblOps", idx, "sector", formState.fields.entity);
                            }
                          }
                        }}
                        placeholder="اختر الخدمة..."
                        allowOther={true}
                        otherValue={row[col.key + "_custom"] || ""}
                        onOtherChange={(val) => updateTableCell("tblOps", idx, col.key + "_custom", val)}
                        isDark={false}
                      />
                    ) : col.type === "dropdown" ? (
                      <SearchableSelect
                        options={col.options || []}
                        value={row[col.key] || ""}
                        onChange={(val) => {
                          if (val === "أخرى") {
                            updateTableCell("tblOps", idx, col.key, "أخرى");
                          } else {
                            updateTableCell("tblOps", idx, col.key, val);
                            updateTableCell("tblOps", idx, col.key + "_custom", "");
                          }
                        }}
                        placeholder="اختر..."
                        allowOther={true}
                        otherValue={row[col.key + "_custom"] || ""}
                        onOtherChange={(val) => updateTableCell("tblOps", idx, col.key + "_custom", val)}
                        isDark={false}
                      />
                    ) : col.type === "readonly" ? (
                      <div className={`w-full px-3 py-2.5 ${"bg-blue-50 border-blue-200 text-blue-700"} border rounded-lg text-xs font-bold text-center`}>
                        {row[col.key] || trackName}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={row[col.key] || ""}
                        onChange={(e) => updateTableCell("tblOps", idx, col.key, e.target.value)}
                        placeholder={col.hint || ""}
                        className={`w-full px-3 py-2.5 ${"bg-white border-slate-200 text-slate-800 placeholder:text-slate-300"} border rounded-lg text-xs focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all`}
                      />
                    )}
                  </td>
                  );
                })}
                <td className={`py-2 px-2 border-b ${"border-slate-100"}`}>
                  <button onClick={() => removeRow("tblOps", idx)} className="text-red-400 hover:text-red-600 hover:bg-red-400/10 rounded-lg w-7 h-7 flex items-center justify-center text-base transition-all" title="حذف">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={`p-3.5 border-t ${"border-slate-100"}`}>
          <button onClick={() => addRow("tblOps")} className={`inline-flex items-center gap-2 px-4 py-2.5 border border-dashed rounded-xl text-xs font-bold transition-all active:scale-[0.97] ${"bg-blue-50 text-blue-600 border-blue-300 hover:bg-blue-100 hover:border-blue-400"}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>
            إضافة صف
          </button>
        </div>
      </div>
    );
  };

  const renderSection4 = () => {
    // trackId=5: مسار العمل الاستراتيجي - جدول 14 عمود
    if (trackId === 5) return renderSection4Strategic();
    // trackId=1: مسار العمليات والدعم المؤسسي - جدول أفقي مثل باقي المسارات مع حقوله الخاصة
    if (trackId === 1) {
      return (
        <div className="space-y-6">
          {renderGuidance(SECTION_GUIDANCE.s4)}

          {/* Auto-calculated summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`relative overflow-hidden ${"bg-blue-50 border-blue-200/60"} border rounded-2xl p-5`}>
              <div className="absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-l from-blue-400 to-blue-600" />
              <label className={`text-[11px] font-bold block mb-3 ${"text-slate-700"}`}>العدد الإجمالي للعمليات</label>
              <p className="text-center text-4xl font-bold text-blue-500" style={{ fontVariantNumeric: "tabular-nums" }}>{totalOps}</p>
              <p className={`text-[10px] text-center mt-2 ${"text-slate-500"}`}>يُحسب تلقائياً</p>
            </div>
            <div className={`relative overflow-hidden ${"bg-slate-50 border-slate-200"} border rounded-2xl p-5`}>
              <div className="absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-l from-emerald-400 to-emerald-600" />
              <label className={`text-[11px] font-bold block mb-3 ${"text-slate-700"}`}>القابلة للتحول</label>
              <p className="text-center text-4xl font-bold text-emerald-500" style={{ fontVariantNumeric: "tabular-nums" }}>{totalEligible}</p>
              <p className={`text-[10px] text-center mt-2 ${"text-slate-500"}`}>يُحسب تلقائياً</p>
            </div>
            <div className={`relative overflow-hidden ${"bg-amber-50 border-amber-200/60"} border rounded-2xl p-5`}>
              <div className="absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-l from-amber-400 to-amber-600" />
              <label className={`text-[11px] font-bold block mb-3 ${"text-slate-700"}`}>المستهدفة للتحول</label>
              <p className="text-center text-4xl font-bold text-amber-500" style={{ fontVariantNumeric: "tabular-nums" }}>{totalTargeted}</p>
              <p className={`text-[10px] text-center mt-2 ${"text-slate-500"}`}>يُحسب تلقائياً (أولوية التحول = عالية)</p>
            </div>
          </div>

          {/* Operations table - horizontal like other tracks */}
          {renderSection4TableOps()}

          {/* Note about priority */}
          <div className={`flex items-start gap-3 ${"bg-amber-50 border-amber-200/60"} border rounded-xl p-4`}>
            <div className={`w-7 h-7 rounded-lg ${"bg-amber-100"} flex items-center justify-center flex-shrink-0`}>
              <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            </div>
            <p className={`text-[12px] leading-relaxed pt-1 ${"text-amber-700/80"}`}>عند اختيار "عالية" في حقل أولوية التحول، يجب تحديد أولوية التطوير وتعيين المهمة للدفعات المناسبة في قسم البرنامج الزمني.</p>
          </div>
        </div>
      );
    }
    // باقي المسارات (2, 4, 6): التنسيق الأصلي - جدول بسيط مع summary cards
    return (
      <div className="space-y-6">
        {renderGuidance(SECTION_GUIDANCE.s4)}
        {/* Auto-calculated summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`relative overflow-hidden ${"bg-blue-50 border-blue-200/60"} border rounded-2xl p-5`}>
            <div className="absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-l from-blue-400 to-blue-600" />
            <label className={`text-[11px] font-bold block mb-3 ${"text-slate-700"}`}>العدد الإجمالي للمهام والعمليات</label>
            <p className="text-center text-4xl font-bold text-blue-500" style={{ fontVariantNumeric: "tabular-nums" }}>{totalOps}</p>
            <p className={`text-[10px] text-center mt-2 ${"text-slate-500"}`}>يُحسب تلقائياً</p>
          </div>
          <div className={`relative overflow-hidden ${"bg-slate-50 border-slate-200"} border rounded-2xl p-5`}>
            <div className="absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-l from-emerald-400 to-emerald-600" />
            <label className={`text-[11px] font-bold block mb-3 ${"text-slate-700"}`}>القابلة للتحول للذكاء الاصطناعي المساعد</label>
            <p className="text-center text-4xl font-bold text-emerald-500" style={{ fontVariantNumeric: "tabular-nums" }}>{totalEligible}</p>
            <p className={`text-[10px] text-center mt-2 ${"text-slate-500"}`}>يُحسب تلقائياً</p>
          </div>
          <div className={`relative overflow-hidden ${"bg-amber-50 border-amber-200/60"} border rounded-2xl p-5`}>
            <div className="absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-l from-amber-400 to-amber-600" />
            <label className={`text-[11px] font-bold block mb-3 ${"text-slate-700"}`}>المستهدفة للتحول خلال عامين</label>
            <p className="text-center text-4xl font-bold text-amber-500" style={{ fontVariantNumeric: "tabular-nums" }}>{totalTargeted}</p>
            <p className={`text-[10px] text-center mt-2 ${"text-slate-500"}`}>يُحسب تلقائياً (أولوية التحول = نعم)</p>
          </div>
        </div>
        {/* Main operations table */}
        {renderSection4Table()}
        {/* Note about priority */}
        <div className={`flex items-start gap-3 ${"bg-amber-50 border-amber-200/60"} border rounded-xl p-4`}>
          <div className={`w-7 h-7 rounded-lg ${"bg-amber-100"} flex items-center justify-center flex-shrink-0`}>
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          </div>
          <p className={`text-[12px] leading-relaxed pt-1 ${"text-amber-700/80"}`}>عند اختيار "نعم" في حقل أولوية التحول، يجب تحديد أولوية التطوير وتعيين المهمة للدفعات المناسبة في قسم البرنامج الزمني.</p>
        </div>
      </div>
    );
  };


  const OUTCOME_OPTIONS = [
    "تحقيق التحول الرقمي الشامل",
    "رفع مستوى الإنتاجية المؤسسية",
    "تعزيز الابتكار في الخدمات الحكومية",
    "تحسين تجربة المتعاملين",
    "خفض الأعباء الإدارية",
    "تعزيز الشفافية والحوكمة",
    "تطوير الكوادر الوطنية في مجال الذكاء الاصطناعي",
    "تحقيق الاستدامة المالية",
    "تعزيز التنافسية العالمية",
    "أخرى",
  ];

  const renderDropdownWithOther = (label: string, fieldKey: string, options: string[], placeholder: string) => {
    const currentValue = formState.fields[fieldKey] || "";
    const customKey = fieldKey + "_custom";
    return (
      <div className={`relative overflow-hidden ${"bg-white border-slate-200 shadow-sm"} border rounded-xl p-5`}>
        <label className={`text-sm font-bold block mb-3 ${"text-slate-700"}`}>
          {label} <span className="text-red-500">*</span>
        </label>
        <SearchableSelect
          options={options}
          value={currentValue}
          onChange={(val) => {
            if (val === "أخرى") {
              updateField(fieldKey, "أخرى");
            } else {
              updateField(fieldKey, val);
              updateField(customKey, "");
            }
          }}
          placeholder={placeholder}
          allowOther={true}
          otherValue={formState.fields[customKey] || ""}
          onOtherChange={(val) => updateField(customKey, val)}
          isDark={false}
        />
      </div>
    );
  };

  const renderSection5 = () => (
    <div className="space-y-6">
      {renderGuidance(SECTION_GUIDANCE.s5)}

      {/* Outcomes - Free text input */}
      <div className={`relative overflow-hidden ${"bg-white border-slate-200 shadow-sm"} border rounded-xl p-5`}>
        <label className={`text-sm font-bold block mb-3 ${"text-slate-700"}`}>
          النتائج المتوقعة (Outcomes) <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formState.fields.outcome1 || ""}
          onChange={(e) => updateField("outcome1", e.target.value)}
          placeholder="مثال: تحقيق التحول الرقمي الشامل ورفع مستوى الإنتاجية المؤسسية وتحسين تجربة المتعاملين..."
          rows={5}
          className={`w-full px-5 py-4 ${"bg-white text-slate-800 placeholder:text-slate-400 shadow-sm"} border ${"border-slate-200"} rounded-xl focus:border-blue-400/60 focus:ring-3 focus:ring-blue-400/10 transition-all duration-200 outline-none resize-y text-[15px] leading-relaxed`}
        />
      </div>

      {/* AI models count + Transform percentage - side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* AI models count field */}
        <div className={`relative overflow-hidden ${"bg-blue-50 border-blue-200/60"} border rounded-xl p-5`}>
          <label className={`text-xs sm:text-sm font-bold block mb-3 ${"text-slate-700"}`}>عدد نماذج وأنظمة الذكاء الاصطناعي المتوقعة</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={formState.fields.aiModelsCount || ""}
              onChange={(e) => updateField("aiModelsCount", e.target.value)}
              dir="ltr"
              placeholder="5"
              className={`w-full max-w-[160px] text-center text-2xl sm:text-3xl font-bold text-blue-500 ${"bg-white border-slate-200 shadow-sm"} border rounded-xl py-4 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all`}
              style={{ fontVariantNumeric: "tabular-nums" }}
            />
            <span className={`text-sm font-medium ${"text-slate-500"}`}>نموذج</span>
          </div>
        </div>

        {/* Transform percentage */}
        <div className={`relative overflow-hidden ${"bg-blue-50 border-blue-200/60"} border rounded-xl p-5`}>
          <label className={`text-xs sm:text-sm font-bold block mb-3 ${"text-slate-700"}`}>نسبة التحول المستهدفة باستخدام الذكاء الاصطناعي</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={formState.fields.transformPct || ""}
              onChange={(e) => updateField("transformPct", e.target.value)}
              placeholder="30"
            dir="ltr"
            className={`w-full max-w-[160px] text-center text-2xl sm:text-3xl font-bold text-blue-500 ${"bg-white border-slate-200 placeholder:text-blue-300/50 shadow-sm"} border rounded-xl py-4 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none`}
              style={{ fontVariantNumeric: "tabular-nums" }}
            />
            <span className={`text-2xl font-bold ${"text-slate-700"}`}>%</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSection6 = () => (
    <div className="space-y-4">
      {renderGuidance(SECTION_GUIDANCE.s6)}
      {PHASES.map((phase, idx) => {
        const entries = formState.phaseEntries[idx] || [{ desc: "", startDate: "", endDate: "" }];
        return (
          <div key={idx} className={`group relative ${"bg-white border-slate-200 hover:border-blue-300 shadow-sm"} border rounded-2xl p-5 transition-all duration-300`}>
            <div className="flex gap-3 sm:gap-4 items-start">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm sm:text-lg shadow-lg shadow-blue-500/20 flex-shrink-0">
                {phase.num}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-3">
                  <h4 className={`font-bold text-sm sm:text-base ${"text-slate-800"}`}>{phase.title}</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold ${"bg-blue-100 text-blue-600"} w-fit`}>{phase.date}</span>
                </div>
                {/* Multiple entries per phase */}
                <div className="space-y-3">
                  {entries.map((entry, entryIdx) => (
                    <div key={entryIdx} className={`${"bg-slate-50 border-slate-200"} border rounded-lg p-3`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] font-bold ${"text-blue-600 bg-blue-100"} px-2 py-0.5 rounded-full`}>نشاط {entryIdx + 1}</span>
                        {entries.length > 1 && (
                          <button onClick={() => removePhaseEntry(idx, entryIdx)} className={`text-[10px] mr-auto ${"text-red-500 hover:text-red-600"}`}>حذف</button>
                        )}
                      </div>
                      <textarea
                        value={entry.desc}
                        onChange={(e) => updatePhaseEntry(idx, entryIdx, "desc", e.target.value)}
                        placeholder="مثال: تطوير نموذج ذكاء اصطناعي لتصنيف الطلبات الواردة تلقائياً..."
                        className={`w-full px-3.5 py-3 ${"bg-white border-slate-200 text-slate-800 placeholder:text-slate-400"} border rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none resize-y transition-all mb-2 leading-relaxed`}
                        rows={3}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className={`text-[10px] font-bold ${"text-slate-500"}`}>تاريخ البدء</label>
                          <input type="date" value={entry.startDate} onChange={(e) => updatePhaseEntry(idx, entryIdx, "startDate", e.target.value)} className={`px-3 py-2.5 ${"bg-white border-slate-200 text-slate-800"} border rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all`} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className={`text-[10px] font-bold ${"text-slate-500"}`}>تاريخ الانتهاء</label>
                          <input type="date" value={entry.endDate} onChange={(e) => updatePhaseEntry(idx, entryIdx, "endDate", e.target.value)} className={`px-3 py-2.5 ${"bg-white border-slate-200 text-slate-800"} border rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => addPhaseEntry(idx)} className={`mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold transition-colors ${"text-blue-600 hover:text-blue-700"}`}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>
                  إضافة نشاط آخر
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderSection7 = () => (
    <div className="space-y-4">
      {renderGuidance(SECTION_GUIDANCE.s7)}
      {formState.launches.map((launch, i) => (
        <div key={i} className={`${"bg-white border-slate-200 hover:border-amber-300 shadow-sm"} border rounded-2xl p-5 transition-all duration-300`}>
          <div className="flex gap-3 items-start">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 text-white flex items-center justify-center font-bold shadow-md flex-shrink-0">{i + 1}</div>
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className={`text-[11px] font-bold ${"text-slate-600"}`}>التاريخ المتوقع</label>
                  <input type="date" value={launch.date} onChange={(e) => updateLaunch(i, "date", e.target.value)} className={`px-4 py-3 ${"bg-white border-slate-200 text-slate-800"} border rounded-lg text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all`} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={`text-[11px] font-bold ${"text-slate-600"}`}>نوع الإطلاق</label>
                  <SearchableSelect
                    options={["إطلاق منتج / خدمة", "إعلان رسمي", "مؤتمر / فعالية", "تحديث نظام", "شراكة استراتيجية"]}
                    value={launch.type || ""}
                    onChange={(val) => updateLaunch(i, "type" as keyof LaunchEntry, val)}
                    placeholder="اختر نوع الإطلاق..."
                    allowOther={true}
                    isDark={false}
                    size="md"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className={`text-[11px] font-bold ${"text-slate-600"}`}>وصف الإطلاق / الإعلان</label>
                <textarea value={launch.desc} onChange={(e) => updateLaunch(i, "desc", e.target.value)} placeholder="مثال: إطلاق المرحلة الأولى من نظام الرد الآلي الذكي..." rows={3} className={`px-4 py-3.5 ${"bg-white border-slate-200 text-slate-800 placeholder:text-slate-400"} border rounded-lg text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all resize-y leading-relaxed`} />
              </div>
            </div>
            {formState.launches.length > 1 && (
              <button onClick={() => removeLaunch(i)} className="text-red-400 hover:text-red-600 hover:bg-red-400/10 rounded-lg w-8 h-8 flex items-center justify-center transition-all flex-shrink-0 mt-1" title="حذف">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </div>
      ))}
      <button onClick={addLaunch} className={`inline-flex items-center gap-2 px-4 py-2.5 border border-dashed rounded-xl text-xs font-bold transition-all active:scale-[0.97] ${"bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 hover:border-amber-400"}`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>
        إضافة إطلاق جديد
      </button>
    </div>
  );

  const renderSection8 = () => (
    <div className="space-y-6">
      {renderGuidance(SECTION_GUIDANCE.s2)}
      <div className={`relative overflow-hidden ${"bg-blue-50/50 border-blue-200/60"} border rounded-2xl p-6`}>
        <div className="absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-l from-blue-500 to-blue-600" />
        <span className={`inline-flex items-center gap-1.5 ${"bg-blue-100 text-blue-600"} text-[10px] font-bold px-3 py-1 rounded-full mb-5`}>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
          القيادة
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {renderField("اسم قائد الفريق", "leadName", "text", "مثال: فاطمة سعيد المنصوري")}
          {renderField("المسمى الوظيفي", "leadTitle", "text", "مثال: مدير إدارة التحول الرقمي")}
          {renderField("اسم نائب القائد", "deputyName", "text", "مثال: خالد عبدالله الشامسي")}
          {renderField("المسمى الوظيفي", "deputyTitle", "text", "مثال: رئيس قسم الذكاء الاصطناعي")}
        </div>
      </div>
      <div>
        <h3 className={`text-sm font-bold mb-3 flex items-center gap-3 ${"text-slate-800"}`}>
          <span className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-600 to-blue-400" />
          أعضاء الفريق
        </h3>
        {renderTable("tblTeam", [
          { key: "name", label: "الاسم", hint: "مثال: مريم علي" }, { key: "title", label: "المسمى الوظيفي", hint: "مثال: مهندس بيانات" },
          { key: "dept", label: "الإدارة", hint: "مثال: إدارة تقنية المعلومات" }, { key: "area", label: "المجال المسؤول", hint: "مثال: تطوير النماذج" },
          { key: "email", label: "البريد الإلكتروني", hint: "مثال: m.ali@gov.ae" },
        ])}
      </div>
    </div>
  );

  const renderSection9 = () => {
    const coordRows = formState.tables.tblCoord || TRACKS.map(() => ({}));
    return (
      <div>
        {renderGuidance(SECTION_GUIDANCE.s2)}
        <div className={`overflow-x-auto ${"border-slate-200 shadow-sm"} border rounded-2xl shadow-lg`}>
          <table className="w-full min-w-[500px] sm:min-w-[700px] border-collapse text-xs sm:text-sm">
            <thead>
              <tr>
                <th className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] sm:text-xs font-bold py-3 sm:py-3.5 px-2 sm:px-3 text-right">المسار</th>
                <th className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] sm:text-xs font-bold py-3 sm:py-3.5 px-2 sm:px-3 text-right">الاسم</th>
                <th className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] sm:text-xs font-bold py-3 sm:py-3.5 px-2 sm:px-3 text-right">المسمى</th>
                <th className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] sm:text-xs font-bold py-3 sm:py-3.5 px-2 sm:px-3 text-right">البريد</th>
                <th className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] sm:text-xs font-bold py-3 sm:py-3.5 px-2 sm:px-3 text-right">الهاتف</th>

              </tr>
            </thead>
            <tbody>
              {TRACKS.map((track, idx) => (
                <tr key={idx} className={`${idx % 2 === 1 ? ("bg-slate-50") : "bg-transparent"} ${"hover:bg-blue-50/50"} transition-colors`}>
                  <td className={`py-3 px-3 ${"border-slate-100"} border-b font-bold text-blue-500 text-xs`}>{track}</td>
                  {["name", "title", "email", "phone"].map((field) => (
                    <td key={field} className={`py-2 px-2 ${"border-slate-100"} border-b`}>
                      <input
                        type={field === "email" ? "email" : "text"}
                        value={coordRows[idx]?.[field] || ""}
                        onChange={(e) => updateTableCell("tblCoord", idx, field, e.target.value)}
                        className={`w-full px-3.5 py-3 ${"bg-white border-slate-200 text-slate-800"} border rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all`}
                        dir={field === "email" || field === "phone" ? "ltr" : "rtl"}
                        placeholder={field === "name" ? "مثال: سارة علي المهيري" : field === "title" ? "مثال: أخصائي ذكاء اصطناعي" : field === "email" ? "sara@entity.gov.ae" : field === "phone" ? "0501234567" : ""}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };



  // Bulk import: append uploaded operation rows into tblOps (non-destructive)
  const importBulkOps = (rows: Record<string, string>[]) => {
    const currentTrackName = TRACKS[trackId - 1] || TRACKS[0];
    setFormState((prev) => {
      const existing = (prev.tables.tblOps || []).filter((r) => Object.values(r).some((v) => v && String(v).trim()));
      const stamped = rows.map((r) => ({ ...r, relatedTrack: currentTrackName, sector: r.sector || prev.fields.entity || "" }));
      const next = { ...prev, tables: { ...prev.tables, tblOps: [...existing, ...stamped] } };
      saveState(trackId, next);
      return next;
    });
    showToast(`تم استيراد ${rows.length} عملية — جارٍ مراجعة الجاهزية`);
    // Bulk path: go straight to the readiness review (score + points to fix)
    setReadinessOpen(true);
  };

  const renderBulkUpload = () => (
    <BulkUpload
      onImport={importBulkOps}
      onReview={() => setReadinessOpen(true)}
      currentCount={(formState.tables.tblOps || []).filter((r) => r.taskName && r.taskName.trim()).length}
    />
  );

  // Entry chooser: bulk upload OR manual entry (not a forced step)
  const renderEntryChooser = () => {
    const option = (opts: { onClick: () => void; title: string; desc: string; cta: string; icon: React.ReactNode; primary?: boolean }) => (
      <button
        onClick={opts.onClick}
        className={`group flex flex-col items-center text-center p-7 sm:p-9 rounded-3xl border bg-white transition-all hover:-translate-y-1 active:scale-[0.99] ${
          opts.primary ? "border-blue-200 ring-1 ring-blue-100 shadow-[0_14px_34px_-14px_rgba(37,99,235,0.4)]" : "border-slate-200 shadow-[0_8px_26px_-14px_rgba(15,23,42,0.2)] hover:border-blue-300"
        }`}
      >
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-colors ${opts.primary ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"}`}>
          {opts.icon}
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">{opts.title}</h3>
        <p className="text-[13px] text-slate-500 leading-relaxed mb-6 max-w-xs">{opts.desc}</p>
        <span className={`mt-auto inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-bold ${opts.primary ? "bg-blue-600 text-white group-hover:bg-blue-500" : "bg-blue-50 text-blue-700 group-hover:bg-blue-100"}`}>
          {opts.cta}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M15 18l-6-6 6-6" /></svg>
        </span>
      </button>
    );
    return (
      <section className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-10">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">كيف تريد إدخال البيانات؟</h2>
          <p className="text-[13px] text-slate-500 mt-2">اختر الطريقة المناسبة — يمكنك التبديل لاحقاً.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {option({
            onClick: () => { setEntryChoice("manual"); setCurrentSection(0); },
            title: "التعبئة اليدوية",
            desc: "املأ النموذج قسماً بقسم بنفسك مع إمكانية الاستعانة بالذكاء الاصطناعي في حقول التقييم.",
            cta: "ابدأ التعبئة",
            icon: (<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>),
          })}
          {option({
            onClick: () => setEntryChoice("bulk"),
            title: "الرفع المجمّع",
            desc: "نزّل قالب Excel، عبّئ كل العمليات دفعة واحدة، ثم ارفعه — وتُراجَع الجاهزية بالذكاء الاصطناعي قبل الاعتماد.",
            cta: "رفع ملف Excel",
            primary: true,
            icon: (<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 13l3-3m0 0l3 3m-3-3v9" /></svg>),
          })}
        </div>
      </section>
    );
  };

  const renderBulkMode = () => (
    <section className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 sm:p-7">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800">الرفع المجمّع للعمليات</h2>
        <button onClick={() => setEntryChoice("choose")} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-slate-500 hover:text-slate-800">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 5l7 7-7 7" /></svg>
          تغيير الطريقة
        </button>
      </div>
      {renderBulkUpload()}
      <div className="flex flex-wrap items-center justify-end gap-2.5 mt-6 pt-5 border-t border-slate-100">
        <button onClick={() => { setEntryChoice("manual"); setCurrentSection(0); }} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
          التعديل اليدوي للبيانات
        </button>
        <button onClick={() => setReadinessOpen(true)} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors">
          مراجعة الجاهزية والإنهاء
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M15 18l-6-6 6-6" /></svg>
        </button>
      </div>
    </section>
  );

  // Map section IDs to their renderers
  const SECTION_RENDERER_MAP: Record<string, () => React.ReactNode> = {
    s2: renderSection2,
    s4: renderSection4,
    s5: renderSection5,
    s6: renderSection6,
    s7: renderSection7,
  };

  // Get sections and renderers filtered by track
  const SECTIONS = getSectionsForTrack(trackId);
  const sectionRenderers = SECTIONS.map(s => SECTION_RENDERER_MAP[s.id]);

  // If track is not selected and there are selected paths, show warning
  if (!isTrackSelected) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${"bg-slate-50"}`} dir="rtl" style={{ fontFamily: 'Tajawal, "IBM Plex Sans Arabic", sans-serif' }}>
        <div className={`max-w-md mx-auto text-center p-8 rounded-2xl border ${"bg-white border-slate-200 shadow-lg"}`}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          </div>
          <h2 className={`text-lg font-bold mb-2 ${"text-slate-800"}`}>هذا المسار غير مختار</h2>
          <p className={`text-sm mb-6 ${"text-slate-500"}`}>يرجى اختيار المسارات المطلوبة من صفحة اختيار المسارات أولاً</p>
          <Link href="/tracks-list" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            العودة لاختيار المسارات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${"bg-slate-50"}`} dir="rtl" style={{ fontFamily: 'Tajawal, "IBM Plex Sans Arabic", sans-serif' }}>
      {/* Ambient background */}
      {false && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/[0.03] rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-purple-600/[0.02] rounded-full blur-[80px]" />
        </div>
      )}

      {/* Track Navigation Bar - shows selected tracks */}
      {orderedSelectedPaths.length > 1 && (
        <div className={`sticky top-0 z-[60] border-b ${"bg-white/95 backdrop-blur-xl border-slate-200"}`}>
          <div className="max-w-[1440px] mx-auto px-3 sm:px-6 py-2 flex items-center gap-2 sm:gap-3">
            <span className={`text-[10px] font-bold flex-shrink-0 ${"text-slate-400"}`}>المسارات:</span>
            <div className="flex items-center gap-1.5 flex-1 overflow-x-auto no-scrollbar">
              {orderedSelectedPaths.map((id, idx) => (
                <button
                  key={id}
                  onClick={() => navigate(`/workplan/${id}`)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold whitespace-nowrap transition-all ${
                    id === trackId
                      ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className={`w-4 h-4 rounded flex items-center justify-center text-[9px] ${id === trackId ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-500"}`}>{idx + 1}</span>
                  {TRACKS[id - 1]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => prevTrackId && navigate(`/workplan/${prevTrackId}`)}
                disabled={!hasPrevTrack}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-20 disabled:cursor-not-allowed ${"hover:bg-slate-100 text-slate-500"}`}
                title="المسار السابق"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M9 18l6-6-6-6" /></svg>
              </button>
              <span className={`text-[9px] font-bold px-1 ${"text-slate-400"}`}>{currentTrackIndex + 1}/{orderedSelectedPaths.length}</span>
              <button
                onClick={() => nextTrackId && navigate(`/workplan/${nextTrackId}`)}
                disabled={!hasNextTrack}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-20 disabled:cursor-not-allowed ${"hover:bg-slate-100 text-slate-500"}`}
                title="المسار التالي"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M15 18l-6-6 6-6" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <header className={`sticky ${orderedSelectedPaths.length > 1 ? "top-[40px]" : "top-0"} z-50 backdrop-blur-xl border-b ${"bg-white/90 border-slate-200"}`}>
        {/* Logo bar */}
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 pt-2 pb-1 flex items-center justify-between">
          <img src={AI_LOGO} alt="مشروع الذكاء الاصطناعي المساعد" className="h-14 sm:h-20 object-contain" /><div className="h-14 sm:h-20 w-14 sm:w-20" />
        </div>
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <h1 className={`text-sm md:text-lg font-bold truncate tracking-tight ${"text-slate-800"}`}>مشروع الذكاء الاصطناعي المساعد</h1>

          </div>
          <div className="flex gap-1.5 sm:gap-2 flex-wrap items-center">
            <button onClick={handleSave} className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 sm:py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs sm:text-xs font-bold hover:bg-blue-100 transition-all active:scale-[0.97]">
              <svg className="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
              حفظ
            </button>
            {/* Auto-save indicator */}
            {autoSaveStatus !== "idle" && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all duration-300 ${autoSaveStatus === "saving" ? ("text-amber-600") : ("text-emerald-600")}`}>
                {autoSaveStatus === "saving" ? (
                  <><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg><span className="hidden sm:inline">جاري الحفظ...</span></>
                ) : (
                  <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg><span className="hidden sm:inline">تم الحفظ {lastSavedTime}</span></>
                )}
              </span>
            )}
            <button onClick={() => exportToExcel(formState, trackId)} className={`inline-flex items-center gap-1.5 px-3 sm:px-3 py-2.5 sm:py-2 rounded-lg text-xs sm:text-xs font-medium transition-all active:scale-[0.97] ${"bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900"}`}>
              <svg className="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button onClick={() => exportToPptx(formState, trackId)} className={`inline-flex items-center gap-1.5 px-3 sm:px-3 py-2.5 sm:py-2 rounded-lg text-xs sm:text-xs font-medium transition-all active:scale-[0.97] ${"bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900"}`}>
              <svg className="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              <span className="hidden sm:inline">PowerPoint</span>
            </button>
            <button onClick={handleReset} className={`inline-flex items-center gap-1.5 px-3 sm:px-3 py-2.5 sm:py-2 rounded-lg text-xs sm:text-xs font-medium transition-all active:scale-[0.97] ${"bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700"}`}>
              <svg className="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              <span className="hidden sm:inline">مسح</span>
            </button>
            <button onClick={() => window.print()} className={`inline-flex items-center gap-1.5 px-3 sm:px-3 py-2.5 sm:py-2 rounded-lg text-xs sm:text-xs font-medium transition-all active:scale-[0.97] ${"bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900"}`}>
              <svg className="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              <span className="hidden sm:inline">طباعة</span>
            </button>
          </div>
        </div>
        <div className={`h-[2px] ${"bg-slate-100"}`}>
          <div className="h-full bg-blue-600 transition-all duration-700 ease-out" style={{ width: `${((currentSection + 1) / SECTIONS.length) * 100}%` }} />
        </div>
      </header>

      {/* Layout */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-3 sm:px-6 py-5 sm:py-7 flex flex-col gap-5">
        {/* Horizontal step bar — only in manual mode */}
        {entryChoice === "manual" && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-2.5 flex items-center gap-3 overflow-x-auto">
          {/* return to tracks */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Link href="/tracks-list" className="inline-flex items-center gap-1 text-[12px] px-2.5 py-2 text-slate-500 hover:text-slate-800 whitespace-nowrap">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              المسارات
            </Link>
          </div>
          {/* section pills */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {SECTIONS.map((sec, idx) => (
              <button
                key={sec.id}
                onClick={() => { setCurrentSection(idx); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-all ${
                  currentSection === idx ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-slate-500 hover:bg-slate-50 border border-transparent"
                }`}
              >
                <span className={`flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold ${
                  currentSection === idx ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                }`}>{String(idx + 1).padStart(2, "0")}</span>
                {sec.name}
              </button>
            ))}
          </div>
          {/* progress ring */}
          <div className="relative w-11 h-11 flex-shrink-0">
            <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="4" />
              <circle cx="22" cy="22" r="18" fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${((currentSection + 1) / SECTIONS.length) * 113} 113`} className="transition-all duration-700" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-blue-600">
              {Math.round(((currentSection + 1) / SECTIONS.length) * 100)}%
            </span>
          </div>
        </div>
        )}

        {/* Main Content */}
        <main className="min-w-0">
          {entryChoice === "choose" ? renderEntryChooser()
            : entryChoice === "bulk" ? renderBulkMode()
            : (<>
          <section className={`${"bg-white border-slate-200 shadow-sm"} border rounded-2xl overflow-hidden shadow-xl`}>
            <div className={`relative px-5 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 border-b ${"bg-gradient-to-l from-blue-50/50 to-transparent border-slate-100"}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <span className="text-white font-bold text-sm">{String(currentSection + 1).padStart(2, "0")}</span>
                </div>
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${"text-blue-600 bg-blue-50 border-blue-200"}`}>القسم {currentSection + 1} من {SECTIONS.length}</span>
              </div>
              <h2 className={`text-xl sm:text-2xl font-bold mt-1 tracking-tight ${"text-slate-800"}`}>{SECTIONS[currentSection].name}</h2>
            </div>

            <div className="px-5 sm:px-8 py-6 sm:py-8 max-h-[calc(100vh-220px)] overflow-y-auto">
              {sectionRenderers[currentSection]()}
            </div>
          </section>

          {/* Step Navigation */}
          <div className={`sticky bottom-3 sm:bottom-5 mt-5 sm:mt-6 backdrop-blur-xl border rounded-2xl shadow-2xl p-3 sm:p-4 flex items-center gap-3 z-30 ${"bg-white/95 border-slate-200 shadow-slate-200/50"}`}>
            <button
              onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
              disabled={currentSection === 0}
              className={`inline-flex items-center gap-2 px-5 py-3 border rounded-xl text-sm font-bold disabled:opacity-25 disabled:cursor-not-allowed transition-all active:scale-[0.97] ${"bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M9 18l6-6-6-6" /></svg>
              السابق
            </button>
            <div className="flex-1 text-center min-w-0 hidden sm:block">
              <p className={`text-xs sm:text-sm font-bold truncate ${"text-slate-800"}`}>{SECTIONS[currentSection].name}</p>
              <p className={`text-[9px] sm:text-[10px] mt-0.5 ${"text-slate-500"}`}>القسم {currentSection + 1} من {SECTIONS.length}</p>
            </div>
            {/* Readiness review — lives in the step bar, not the top toolbar */}
            <button
              onClick={() => setReadinessOpen(true)}
              title="فحص جاهزية البيانات للأتمتة بالذكاء الاصطناعي"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all active:scale-[0.97] flex-1 sm:flex-none justify-center"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              <span className="whitespace-nowrap">تحقق من الجاهزية</span>
            </button>
            <button
              onClick={() => {
                if (!validateCurrentSection()) { showToast("يرجى تصحيح الأخطاء قبل المتابعة"); return; }
                if (currentSection >= SECTIONS.length - 1) {
                  // Last section: run the AI readiness review over ALL inputs first.
                  setReadinessOpen(true);
                }
                else { setCurrentSection(currentSection + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-500 hover:shadow-blue-500/30 active:scale-[0.97] transition-all"
            >
              {currentSection >= SECTIONS.length - 1 ? "مراجعة الجاهزية والإنهاء" : "التالي"}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          </div>
          </>)}
        </main>
      </div>

      {/* Print Header */}
      <div className="print-header">
        <div className="print-title">
          <div>مشروع الذكاء الاصطناعي المساعد</div>
          <div className="print-track">{trackName}</div>
        </div>
        <img src={AI_LOGO} alt="مشروع الذكاء الاصطناعي المساعد" />
      </div>

      {/* Print Footer */}
      <div className="print-footer">
        مشروع الذكاء الاصطناعي المساعد لحكومة دولة الإمارات &bull; وزارة شؤون مجلس الوزراء &bull; استراتيجية الإمارات للذكاء الاصطناعي 2031
      </div>

      {/* Footer */}
      <footer className={`no-print relative z-10 border-t mt-10 ${"border-slate-200"}`}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-5 sm:py-6 flex items-center justify-between flex-wrap gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <img src={AI_LOGO} alt="مشروع الذكاء الاصطناعي المساعد" className="h-9 sm:h-11 w-auto opacity-60" />
          </div>
          <div className={`text-[10px] sm:text-[11px] text-center leading-relaxed ${"text-slate-500"}`}>
            <p>مشروع الذكاء الاصطناعي المساعد لحكومة دولة الإمارات</p>
            <p className="mt-1">© 2026 وزارة شؤون مجلس الوزراء، جميع الحقوق محفوظة</p>
          </div>
          <div className={`text-[10px] sm:text-[11px] ${"text-slate-500"}`}>
            <p>للتواصل: info@mofa.gov.ae</p>
          </div>
        </div>
      </footer>

      {/* Toast */}
      {toastMsg && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 backdrop-blur-xl px-6 py-3.5 rounded-2xl shadow-2xl border text-sm font-bold z-[200] animate-in fade-in slide-in-from-bottom-4 duration-300 flex items-center gap-2.5 ${"bg-white/95 text-slate-800 border-slate-200 shadow-slate-200/50"}`}>
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          {toastMsg}
        </div>
      )}

      {/* Agentification readiness review */}
      <ReadinessReview
        plan={formState}
        trackName={trackName}
        open={readinessOpen}
        onClose={() => setReadinessOpen(false)}
        onEditManually={entryChoice === "bulk" ? () => { setReadinessOpen(false); setEntryChoice("manual"); setCurrentSection(0); } : undefined}
        onProceed={() => {
          if (hasNextTrack && nextTrackId) {
            navigate(`/workplan/${nextTrackId}`);
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            navigate(`/review/${trackId}`);
          }
        }}
      />
    </div>
  );
}

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Brand colors
const BRAND_BLUE = "0A3D7A";
const BRAND_DARK = "060D1B";
const BRAND_LIGHT_BLUE = "1E6FD9";
const BRAND_GOLD = "C8A951";
const HEADER_BG = "0A3D7A";
const HEADER_TEXT = "FFFFFF";
const SUBHEADER_BG = "E8F0FE";
const ROW_ALT_BG = "F5F8FC";
const BORDER_COLOR = "B8D4F0";

interface TableRow { [key: string]: string; }
interface PhaseEntry { desc: string; startDate: string; endDate: string; }
interface LaunchEntry { date: string; desc: string; }
interface FormState {
  fields: { [key: string]: string };
  tables: { [key: string]: TableRow[] };
  phaseEntries: { [phaseIdx: number]: PhaseEntry[] };
  launches: LaunchEntry[];
}

const TRACKS = [
  "العمليات والدعم المؤسسي",
  "الخدمات",
  "بناء القدرات والتدريب",
  "تقنيات الذكاء الاصطناعي والبيانات",
  "العمل الحكومي الاستراتيجي",
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

const SECTION4_COLUMNS = [
  "المهمة والعملية والخدمة",
  "التصنيف",
  "الأنشطة والخدمات الفرعية",
  "هل تعتبر مشتركة؟",
  "القطاع المعني",
  "الإدارة المعنية",
  "القسم المعني",
  "مستوى الأتمتة",
  "نسبة الأتمتة",
  "نظام الأتمتة",
  "كثافة الاستخدام",
  "مستوى التكرار",
  "القابلية للتحول",
  "الجاهزية للتحول",
  "أولوية التحول",
  "مستوى الأثر المتوقع",
  "مستوى التعقيد",
  "المسار المعني",
  "الملاحظات",
];

const SECTION4_KEYS = [
  "taskName", "classification", "subActivities", "isShared", "sector",
  "department", "section", "automationLevel", "automationPct", "automationSystem",
  "usageIntensity", "repetitionLevel", "eligibility", "readiness", "transformPriority",
  "impactLevel", "complexityLevel", "relatedTrack", "notes",
];

function applyHeaderStyle(ws: XLSX.WorkSheet, cellRef: string) {
  if (!ws[cellRef]) ws[cellRef] = { v: "" };
  ws[cellRef].s = {
    fill: { fgColor: { rgb: HEADER_BG } },
    font: { bold: true, color: { rgb: HEADER_TEXT }, sz: 11, name: "Sakkal Majalla" },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: BORDER_COLOR } },
      bottom: { style: "thin", color: { rgb: BORDER_COLOR } },
      left: { style: "thin", color: { rgb: BORDER_COLOR } },
      right: { style: "thin", color: { rgb: BORDER_COLOR } },
    },
  };
}

function applyDataStyle(ws: XLSX.WorkSheet, cellRef: string, isAlt: boolean) {
  if (!ws[cellRef]) ws[cellRef] = { v: "" };
  ws[cellRef].s = {
    fill: isAlt ? { fgColor: { rgb: ROW_ALT_BG } } : undefined,
    font: { sz: 10, name: "Sakkal Majalla", color: { rgb: "333333" } },
    alignment: { horizontal: "right", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: BORDER_COLOR } },
      bottom: { style: "thin", color: { rgb: BORDER_COLOR } },
      left: { style: "thin", color: { rgb: BORDER_COLOR } },
      right: { style: "thin", color: { rgb: BORDER_COLOR } },
    },
  };
}

function applyTitleStyle(ws: XLSX.WorkSheet, cellRef: string) {
  if (!ws[cellRef]) ws[cellRef] = { v: "" };
  ws[cellRef].s = {
    font: { bold: true, sz: 14, color: { rgb: BRAND_BLUE }, name: "Sakkal Majalla" },
    alignment: { horizontal: "center", vertical: "center" },
  };
}

function applySectionTitleStyle(ws: XLSX.WorkSheet, cellRef: string) {
  if (!ws[cellRef]) ws[cellRef] = { v: "" };
  ws[cellRef].s = {
    fill: { fgColor: { rgb: SUBHEADER_BG } },
    font: { bold: true, sz: 12, color: { rgb: BRAND_BLUE }, name: "Sakkal Majalla" },
    alignment: { horizontal: "right", vertical: "center" },
    border: {
      bottom: { style: "medium", color: { rgb: BRAND_LIGHT_BLUE } },
    },
  };
}

export function exportToExcel(formState: FormState, trackId: number) {
  const wb = XLSX.utils.book_new();
  const entity = formState.fields.entity || "الجهة الاتحادية";
  const trackName = TRACKS[trackId - 1] || `مسار ${trackId}`;

  // ===== Sheet 1: المعلومات العامة =====
  const infoData = [
    ["نموذج خطة عمل الجهات الاتحادية"],
    ["مشروع الذكاء الاصطناعي المساعد لحكومة دولة الإمارات"],
    [""],
    ["المسار", trackName],
    [""],
    ["القسم 1: المعلومات العامة"],
    ["اسم الجهة الاتحادية", formState.fields.entity || ""],
    ["تاريخ البدء", formState.fields.startDate || ""],
    ["تاريخ الانتهاء", formState.fields.endDate || ""],
    ["اسم معد الخطة", formState.fields.preparer || ""],
    ["رقم الهاتف", formState.fields.phone || ""],
    ["البريد الإلكتروني", formState.fields.email || ""],
  ];
  const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
  wsInfo["!cols"] = [{ wch: 30 }, { wch: 50 }];
  wsInfo["!rtl"] = true;
  // Apply styles
  applyTitleStyle(wsInfo, "A1");
  wsInfo["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: 1 } },
  ];
  XLSX.utils.book_append_sheet(wb, wsInfo, "المعلومات العامة");

  // ===== Sheet 2: المشاريع القائمة =====
  const existingHeaders = ["#", "اسم المشروع", "الوصف", "المخرجات", "تاريخ الانتهاء", "الحالة", "المسار"];
  const existingKeys = ["name", "desc", "output", "end", "status", "track"];
  const existingRows = (formState.tables.tblExisting || [{}]).map((row, idx) => [
    idx + 1,
    ...existingKeys.map(k => row[k] || ""),
  ]);
  const wsExisting = XLSX.utils.aoa_to_sheet([
    ["القسم 2: المشاريع القائمة وقيد التنفيذ"],
    [""],
    existingHeaders,
    ...existingRows,
  ]);
  wsExisting["!cols"] = [{ wch: 5 }, { wch: 25 }, { wch: 35 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
  wsExisting["!rtl"] = true;
  wsExisting["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
  XLSX.utils.book_append_sheet(wb, wsExisting, "المشاريع القائمة");

  // ===== Sheet 3: المشاريع الجديدة =====
  const newHeaders = ["#", "اسم المشروع", "الوصف", "المخرجات", "الأثر المتوقع", "المسار"];
  const newKeys = ["name", "desc", "output", "impact", "track"];
  const newRows = (formState.tables.tblNew || [{}]).map((row, idx) => [
    idx + 1,
    ...newKeys.map(k => row[k] || ""),
  ]);
  const wsNew = XLSX.utils.aoa_to_sheet([
    ["القسم 3: المشاريع الجديدة"],
    [""],
    newHeaders,
    ...newRows,
  ]);
  wsNew["!cols"] = [{ wch: 5 }, { wch: 25 }, { wch: 35 }, { wch: 30 }, { wch: 30 }, { wch: 20 }];
  wsNew["!rtl"] = true;
  wsNew["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];
  XLSX.utils.book_append_sheet(wb, wsNew, "المشاريع الجديدة");

  // ===== Sheet 4: العمليات والدعم المؤسسي =====
  const opsHeaders = ["#", ...SECTION4_COLUMNS];
  const opsRows = (formState.tables.tblOps || [{}]).map((row, idx) => [
    idx + 1,
    ...SECTION4_KEYS.map(k => row[k] || ""),
  ]);
  const wsOps = XLSX.utils.aoa_to_sheet([
    ["القسم 4: العمليات والدعم المؤسسي"],
    [""],
    opsHeaders,
    ...opsRows,
  ]);
  wsOps["!cols"] = [{ wch: 5 }, ...SECTION4_COLUMNS.map(() => ({ wch: 18 }))];
  wsOps["!rtl"] = true;
  wsOps["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 19 } }];

  // Auto-calculated summaries
  const totalTasks = opsRows.length;
  const eligibleTasks = opsRows.filter(r => r[13] === "قابل كلياً" || r[13] === "قابل جزئياً").length;
  const targetedTasks = opsRows.filter(r => r[15] === "نعم").length;

  const summaryStartRow = opsRows.length + 5;
  XLSX.utils.sheet_add_aoa(wsOps, [
    [""],
    ["الإحصائيات المحسوبة تلقائياً"],
    ["العدد الإجمالي للمهام والعمليات", totalTasks],
    ["العدد الإجمالي للمهام القابلة للتحول للذكاء الاصطناعي المساعد", eligibleTasks],
    ["العدد الإجمالي للمهام المستهدفة للتحول خلال عامين", targetedTasks],
  ], { origin: `A${summaryStartRow}` });

  XLSX.utils.book_append_sheet(wb, wsOps, "العمليات والدعم المؤسسي");

  // ===== Sheet 5: المستهدفات والنتائج =====
  const targetsData = [
    ["القسم 5: المستهدفات والنتائج المتوقعة"],
    [""],
    ["المخرجات الرئيسية (Outputs)"],
    [formState.fields.output1 || ""],
    [""],
    ["النتائج المتوقعة (Outcomes)"],
    [formState.fields.outcome1 || ""],
    [""],
    ["عدد نماذج وأنظمة الذكاء الاصطناعي المساعد المتوقعة", formState.fields.aiModelsCount || "0"],
    ["نسبة التحول المستهدفة", `${formState.fields.transformPct || "0"}%`],
  ];
  const wsTargets = XLSX.utils.aoa_to_sheet(targetsData);
  wsTargets["!cols"] = [{ wch: 50 }, { wch: 20 }];
  wsTargets["!rtl"] = true;
  XLSX.utils.book_append_sheet(wb, wsTargets, "المستهدفات والنتائج");

  // ===== Sheet 6: البرنامج الزمني =====
  const timelineData: (string | number)[][] = [
    ["القسم 6: البرنامج الزمني للتنفيذ"],
    [""],
    ["المرحلة", "الفترة", "النشاط/المهمة", "تاريخ البدء", "تاريخ الانتهاء"],
  ];
  PHASES.forEach((phase, idx) => {
    const entries = formState.phaseEntries[idx] || [{ desc: "", startDate: "", endDate: "" }];
    entries.forEach((entry, eIdx) => {
      timelineData.push([
        eIdx === 0 ? `${phase.title} (${phase.date})` : "",
        eIdx === 0 ? phase.date : "",
        entry.desc || "",
        entry.startDate || "",
        entry.endDate || "",
      ]);
    });
  });
  const wsTimeline = XLSX.utils.aoa_to_sheet(timelineData);
  wsTimeline["!cols"] = [{ wch: 35 }, { wch: 25 }, { wch: 40 }, { wch: 15 }, { wch: 15 }];
  wsTimeline["!rtl"] = true;
  wsTimeline["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
  XLSX.utils.book_append_sheet(wb, wsTimeline, "البرنامج الزمني");

  // ===== Sheet 7: الإطلاقات =====
  const launchesData: (string | number)[][] = [
    ["القسم 7: خطة الإطلاقات والإعلانات"],
    [""],
    ["#", "التاريخ", "الوصف"],
    ...(formState.launches || []).map((l, i) => [i + 1, l.date || "", l.desc || ""]),
  ];
  const wsLaunches = XLSX.utils.aoa_to_sheet(launchesData);
  wsLaunches["!cols"] = [{ wch: 5 }, { wch: 15 }, { wch: 60 }];
  wsLaunches["!rtl"] = true;
  wsLaunches["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
  XLSX.utils.book_append_sheet(wb, wsLaunches, "الإطلاقات");

  // ===== Sheet 8: فريق العمل =====
  const teamHeaders = ["#", "الاسم", "المسمى الوظيفي", "الإدارة", "المجال المسؤول", "البريد الإلكتروني", "الهاتف"];
  const teamKeys = ["name", "role", "dept", "area", "email", "phone"];
  const teamRows = (formState.tables.tblTeam || [{}]).map((row, idx) => [
    idx + 1,
    ...teamKeys.map(k => row[k] || ""),
  ]);
  const wsTeam = XLSX.utils.aoa_to_sheet([
    ["القسم 8: فريق عمل الجهة الاتحادية"],
    [""],
    teamHeaders,
    ...teamRows,
  ]);
  wsTeam["!cols"] = [{ wch: 5 }, { wch: 25 }, { wch: 25 }, { wch: 20 }, { wch: 25 }, { wch: 30 }, { wch: 15 }];
  wsTeam["!rtl"] = true;
  wsTeam["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
  XLSX.utils.book_append_sheet(wb, wsTeam, "فريق العمل");

  // ===== Sheet 9: منسقو المسارات =====
  const coordHeaders = ["#", "المسار", "اسم المنسق", "البريد الإلكتروني", "الهاتف"];
  const coordRows = (formState.tables.tblCoord || TRACKS.map(() => ({}))).map((row, idx) => [
    idx + 1,
    TRACKS[idx] || "",
    row.name || "",
    row.email || "",
    row.phone || "",
  ]);
  const wsCoord = XLSX.utils.aoa_to_sheet([
    ["القسم 9: منسقو المسارات"],
    [""],
    coordHeaders,
    ...coordRows,
  ]);
  wsCoord["!cols"] = [{ wch: 5 }, { wch: 30 }, { wch: 25 }, { wch: 30 }, { wch: 15 }];
  wsCoord["!rtl"] = true;
  wsCoord["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
  XLSX.utils.book_append_sheet(wb, wsCoord, "منسقو المسارات");

  // Generate and download
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array", bookSST: true });
  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `خطة-عمل-${entity}-مسار-${trackId}.xlsx`);
}

// Export all tracks in one Excel file
export function exportAllTracksToExcel() {
  const wb = XLSX.utils.book_new();
  wb.Workbook = { Views: [{ RTL: true }] };

  // Cover sheet
  const coverData = [
    [""],
    ["وزارة شؤون مجلس الوزراء"],
    ["مشروع الذكاء الاصطناعي المساعد"],
    [""],
    ["خطة العمل الشاملة - جميع المسارات"],
    [""],
    [`تاريخ التصدير: ${new Date().toLocaleDateString("ar-AE")}`],
    [""],
    [""],
    ["المسارات:"],
  ];
  TRACKS.forEach((t, i) => coverData.push([`${i + 1}. ${t}`]));
  const wsCover = XLSX.utils.aoa_to_sheet(coverData);
  wsCover["!rtl"] = true;
  wsCover["!cols"] = [{ wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsCover, "الغلاف");

  // Summary sheet - overview of all tracks
  const summaryHeaders = ["#", "المسار", "الجهة الاتحادية", "إجمالي المهام", "القابلة للتحول", "المستهدفة خلال عامين", "الحالة"];
  const summaryRows: string[][] = [];

  TRACKS.forEach((trackName, idx) => {
    const trackId = idx + 1;
    const key = `workplan_track_${trackId}_v2`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      summaryRows.push([String(trackId), trackName, "-", "0", "0", "0", "فارغ"]);
      return;
    }
    try {
      const data = JSON.parse(raw);
      const entity = data.fields?.entityName || "-";
      const tblOps = data.tables?.tblOps || [];
      const total = tblOps.filter((r: TableRow) => r.taskName?.trim()).length;
      const eligible = tblOps.filter((r: TableRow) => r.eligibility === "قابل كلياً" || r.eligibility === "قابل جزئياً").length;
      const targeted = tblOps.filter((r: TableRow) => r.transformPriority === "نعم").length;
      summaryRows.push([String(trackId), trackName, entity, String(total), String(eligible), String(targeted), "مكتمل"]);
    } catch {
      summaryRows.push([String(trackId), trackName, "-", "0", "0", "0", "خطأ"]);
    }
  });

  const wsSummary = XLSX.utils.aoa_to_sheet([
    ["ملخص جميع المسارات"],
    [""],
    summaryHeaders,
    ...summaryRows,
  ]);
  wsSummary["!rtl"] = true;
  wsSummary["!cols"] = [{ wch: 5 }, { wch: 35 }, { wch: 30 }, { wch: 15 }, { wch: 18 }, { wch: 22 }, { wch: 10 }];
  wsSummary["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "ملخص المسارات");

  // Per-track sheets
  TRACKS.forEach((trackName, idx) => {
    const trackId = idx + 1;
    const key = `workplan_track_${trackId}_v2`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as FormState;
      const fields = data.fields || {};
      const tables = data.tables || {};

      // Section 1 - General info
      const sheetName = `مسار ${trackId}`;
      const sheetData: (string | number)[][] = [
        [`مسار ${trackId}: ${trackName}`],
        [""],
        ["القسم 1: المعلومات العامة"],
        ["الجهة الاتحادية", fields.entityName || ""],
        ["اسم معد الخطة", fields.planAuthor || ""],
        ["البريد الإلكتروني", fields.email || ""],
        ["تاريخ البدء", fields.startDate || ""],
        ["تاريخ الانتهاء", fields.endDate || ""],
        [""],
        ["القسم 2: الرؤية والأهداف"],
        ["الرؤية", fields.vision || ""],
        ["الأهداف الاستراتيجية", fields.objectives || ""],
        [""],
        ["القسم 3: النطاق"],
        ["النطاق", fields.scope || ""],
        [""],
      ];

      // Section 4
      sheetData.push(["القسم 4: جدول العمليات والدعم المؤسسي"]);
      sheetData.push(SECTION4_COLUMNS as unknown as string[]);
      const tblOps = tables.tblOps || [];
      tblOps.forEach((row: TableRow) => {
        sheetData.push(SECTION4_KEYS.map((k) => row[k] || ""));
      });

      // Summary
      const total = tblOps.filter((r: TableRow) => r.taskName?.trim()).length;
      const eligible = tblOps.filter((r: TableRow) => r.eligibility === "قابل كلياً" || r.eligibility === "قابل جزئياً").length;
      const targeted = tblOps.filter((r: TableRow) => r.transformPriority === "نعم").length;
      sheetData.push([""], [`الإجمالي: ${total} | القابلة للتحول: ${eligible} | المستهدفة: ${targeted}`]);

      // Section 5
      sheetData.push([""], ["القسم 5: المخرجات والنتائج"]);
      sheetData.push(["المخرجات المتوقعة", fields.outputs || ""]);
      sheetData.push(["عدد نماذج وأنظمة الذكاء الاصطناعي المتوقعة", fields.aiModelsCount || ""]);
      sheetData.push(["النتائج المتوقعة", fields.outcomes || ""]);

      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      ws["!rtl"] = true;
      ws["!cols"] = Array(19).fill({ wch: 18 });
      ws["!cols"][0] = { wch: 30 };
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    } catch {
      // Skip track with parse error
    }
  });

  // Generate and download
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array", bookSST: true });
  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `خطة-عمل-شاملة-جميع-المسارات-${new Date().toLocaleDateString("ar-AE")}.xlsx`);
}

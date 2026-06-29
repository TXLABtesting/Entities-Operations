import PptxGenJS from "pptxgenjs";

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

// Brand colors
const BRAND_BLUE = "0A3D7A";
const BRAND_DARK = "060D1B";
const BRAND_LIGHT_BLUE = "1E6FD9";
const BRAND_GOLD = "C8A951";
const WHITE = "FFFFFF";
const LIGHT_GRAY = "F5F8FC";
const DARK_TEXT = "1A1A2E";

// Logo URL
const AI_LOGO = "/manus-storage/ai_project_logo_3e51967f.png";

function addBrandedSlide(pptx: PptxGenJS, title: string): PptxGenJS.Slide {
  const slide = pptx.addSlide();

  // Dark gradient background
  slide.background = { color: BRAND_DARK };

  // Top accent bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: "100%", h: 0.08,
    fill: { color: BRAND_LIGHT_BLUE },
  });

  // Bottom accent bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 7.42, w: "100%", h: 0.08,
    fill: { color: BRAND_GOLD },
  });

  // Title
  slide.addText(title, {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 22, bold: true, color: WHITE,
    fontFace: "Sakkal Majalla",
    align: "right",
    rtlMode: true,
  });

  // Separator line under title
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5, y: 0.9, w: 9, h: 0.02,
    fill: { color: BRAND_LIGHT_BLUE },
  });

  return slide;
}

function addCoverSlide(pptx: PptxGenJS, entity: string, trackName: string, trackId: number) {
  const slide = pptx.addSlide();
  slide.background = { color: BRAND_DARK };

  // Top accent
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: "100%", h: 0.12,
    fill: { color: BRAND_LIGHT_BLUE },
  });

  // AI Logo on right (RTL)
  slide.addImage({ path: AI_LOGO, x: 6.5, y: 0.3, w: 3, h: 1.05 });

  // Main title
  slide.addText("نموذج خطة عمل الجهات الاتحادية", {
    x: 0.5, y: 1.5, w: 9, h: 0.8,
    fontSize: 28, bold: true, color: WHITE,
    fontFace: "Sakkal Majalla",
    align: "center",
    rtlMode: true,
  });

  // Subtitle
  slide.addText("مشروع الذكاء الاصطناعي المساعد لحكومة دولة الإمارات", {
    x: 0.5, y: 2.3, w: 9, h: 0.6,
    fontSize: 16, color: BRAND_LIGHT_BLUE,
    fontFace: "Sakkal Majalla",
    align: "center",
    rtlMode: true,
  });

  // Divider
  slide.addShape(pptx.ShapeType.rect, {
    x: 3.5, y: 3.1, w: 3, h: 0.03,
    fill: { color: BRAND_GOLD },
  });

  // Entity name
  slide.addText(entity, {
    x: 0.5, y: 3.5, w: 9, h: 0.6,
    fontSize: 20, bold: true, color: BRAND_GOLD,
    fontFace: "Sakkal Majalla",
    align: "center",
    rtlMode: true,
  });

  // Track info
  slide.addText(`المسار: ${trackName}`, {
    x: 0.5, y: 4.2, w: 9, h: 0.5,
    fontSize: 14, color: WHITE,
    fontFace: "Sakkal Majalla",
    align: "center",
    rtlMode: true,
  });

  // Footer
  slide.addText("وزارة شؤون مجلس الوزراء — حكومة دولة الإمارات العربية المتحدة", {
    x: 0.5, y: 6.8, w: 9, h: 0.4,
    fontSize: 10, color: "888888",
    fontFace: "Sakkal Majalla",
    align: "center",
    rtlMode: true,
  });

  // Bottom accent
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 7.38, w: "100%", h: 0.12,
    fill: { color: BRAND_GOLD },
  });
}

export function exportToPptx(formState: FormState, trackId: number) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "وزارة شؤون مجلس الوزراء";
  pptx.subject = "نموذج خطة عمل الجهات الاتحادية";

  const entity = formState.fields.entity || "الجهة الاتحادية";
  const trackName = TRACKS[trackId - 1] || `مسار ${trackId}`;

  // ===== Slide 1: Cover =====
  addCoverSlide(pptx, entity, trackName, trackId);

  // ===== Slide 2: المعلومات العامة =====
  const slide2 = addBrandedSlide(pptx, "القسم 1: المعلومات العامة");
  const infoRows: PptxGenJS.TableRow[] = [
    [
      { text: "البيان", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, align: "center" } },
      { text: "التفاصيل", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, align: "center" } },
    ],
    [
      { text: "اسم الجهة الاتحادية", options: { color: WHITE, fill: { color: "1A2744" } } },
      { text: formState.fields.entity || "", options: { color: WHITE, fill: { color: "1A2744" } } },
    ],
    [
      { text: "تاريخ البدء", options: { color: WHITE, fill: { color: "0F1B30" } } },
      { text: formState.fields.startDate || "", options: { color: WHITE, fill: { color: "0F1B30" } } },
    ],
    [
      { text: "تاريخ الانتهاء", options: { color: WHITE, fill: { color: "1A2744" } } },
      { text: formState.fields.endDate || "", options: { color: WHITE, fill: { color: "1A2744" } } },
    ],
    [
      { text: "اسم معد الخطة", options: { color: WHITE, fill: { color: "0F1B30" } } },
      { text: formState.fields.preparer || "", options: { color: WHITE, fill: { color: "0F1B30" } } },
    ],
    [
      { text: "رقم الهاتف", options: { color: WHITE, fill: { color: "1A2744" } } },
      { text: formState.fields.phone || "", options: { color: WHITE, fill: { color: "1A2744" } } },
    ],
    [
      { text: "البريد الإلكتروني", options: { color: WHITE, fill: { color: "0F1B30" } } },
      { text: formState.fields.email || "", options: { color: WHITE, fill: { color: "0F1B30" } } },
    ],
  ];
  slide2.addTable(infoRows, {
    x: 0.5, y: 1.2, w: 9, h: 4,
    fontSize: 12, fontFace: "Sakkal Majalla",
    border: { type: "solid", pt: 0.5, color: "2A4060" },
    colW: [3, 6],
        align: "right",
  } as any);

  // ===== Slide 3: المشاريع القائمة =====
  const slide3 = addBrandedSlide(pptx, "القسم 2: المشاريع القائمة وقيد التنفيذ");
  const existingHeaders: PptxGenJS.TableRow = [
    { text: "#", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, align: "center" } },
    { text: "اسم المشروع", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, align: "center" } },
    { text: "الوصف", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, align: "center" } },
    { text: "الحالة", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, align: "center" } },
    { text: "المسار", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, align: "center" } },
  ];
  const existingData: PptxGenJS.TableRow[] = [existingHeaders];
  (formState.tables.tblExisting || [{}]).forEach((row, idx) => {
    const bgColor = idx % 2 === 0 ? "1A2744" : "0F1B30";
    existingData.push([
      { text: String(idx + 1), options: { color: WHITE, fill: { color: bgColor }, align: "center" } },
      { text: row.name || "", options: { color: WHITE, fill: { color: bgColor } } },
      { text: row.desc || "", options: { color: WHITE, fill: { color: bgColor } } },
      { text: row.status || "", options: { color: WHITE, fill: { color: bgColor }, align: "center" } },
      { text: row.track || "", options: { color: WHITE, fill: { color: bgColor }, align: "center" } },
    ]);
  });
  slide3.addTable(existingData, {
    x: 0.3, y: 1.2, w: 9.4, fontSize: 10, fontFace: "Sakkal Majalla",
    border: { type: "solid", pt: 0.5, color: "2A4060" },
    colW: [0.5, 2.5, 3.5, 1.5, 1.4],
    align: "right",
  } as any);

  // ===== Slide 4: المشاريع الجديدة =====
  const slide4 = addBrandedSlide(pptx, "القسم 3: المشاريع الجديدة");
  const newHeaders: PptxGenJS.TableRow = [
    { text: "#", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, align: "center" } },
    { text: "اسم المشروع", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, align: "center" } },
    { text: "الوصف", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, align: "center" } },
    { text: "الأثر المتوقع", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, align: "center" } },
    { text: "المسار", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, align: "center" } },
  ];
  const newData: PptxGenJS.TableRow[] = [newHeaders];
  (formState.tables.tblNew || [{}]).forEach((row, idx) => {
    const bgColor = idx % 2 === 0 ? "1A2744" : "0F1B30";
    newData.push([
      { text: String(idx + 1), options: { color: WHITE, fill: { color: bgColor }, align: "center" } },
      { text: row.name || "", options: { color: WHITE, fill: { color: bgColor } } },
      { text: row.desc || "", options: { color: WHITE, fill: { color: bgColor } } },
      { text: row.impact || "", options: { color: WHITE, fill: { color: bgColor } } },
      { text: row.track || "", options: { color: WHITE, fill: { color: bgColor }, align: "center" } },
    ]);
  });
  slide4.addTable(newData, {
    x: 0.3, y: 1.2, w: 9.4, fontSize: 10, fontFace: "Sakkal Majalla",
    border: { type: "solid", pt: 0.5, color: "2A4060" },
    colW: [0.5, 2.5, 3.5, 1.5, 1.4],
    align: "right",
  } as any);

  // ===== Slide 5: الإحصائيات (القسم 4 ملخص) =====
  const slide5 = addBrandedSlide(pptx, "القسم 4: ملخص العمليات والدعم المؤسسي");
  const opsRows = formState.tables.tblOps || [{}];
  const totalTasks = opsRows.filter(r => r.taskName).length;
  const eligibleTasks = opsRows.filter(r => r.eligibility === "قابل كلياً" || r.eligibility === "قابل جزئياً").length;
  const targetedTasks = opsRows.filter(r => r.transformPriority === "نعم").length;

  // Stats cards
  const statsData = [
    { label: "إجمالي المهام والعمليات", value: String(totalTasks), color: BRAND_LIGHT_BLUE },
    { label: "القابلة للتحول للذكاء الاصطناعي", value: String(eligibleTasks), color: "10B981" },
    { label: "المستهدفة للتحول خلال عامين", value: String(targetedTasks), color: BRAND_GOLD },
  ];

  statsData.forEach((stat, idx) => {
    const y = 1.5 + idx * 1.8;
    // Card background
    slide5.addShape(pptx.ShapeType.roundRect, {
      x: 1, y, w: 8, h: 1.4,
      fill: { color: "0F1B30" },
      line: { color: stat.color, width: 1.5 },
      rectRadius: 0.1,
    });
    // Value
    slide5.addText(stat.value, {
      x: 1.5, y: y + 0.15, w: 2, h: 1,
      fontSize: 36, bold: true, color: stat.color,
      fontFace: "Sakkal Majalla", align: "center",
    });
    // Label
    slide5.addText(stat.label, {
      x: 3.5, y: y + 0.3, w: 5, h: 0.8,
      fontSize: 14, color: WHITE,
      fontFace: "Sakkal Majalla", align: "right", rtlMode: true,
    });
  });

  // ===== Slide 6: المستهدفات والنتائج =====
  const slide6 = addBrandedSlide(pptx, "القسم 5: المستهدفات والنتائج المتوقعة");
  slide6.addText("المخرجات الرئيسية (Outputs)", {
    x: 0.5, y: 1.2, w: 9, h: 0.4,
    fontSize: 14, bold: true, color: BRAND_LIGHT_BLUE,
    fontFace: "Sakkal Majalla", align: "right", rtlMode: true,
  });
  slide6.addText(formState.fields.output1 || "لم يتم الإدخال", {
    x: 0.5, y: 1.6, w: 9, h: 1.5,
    fontSize: 11, color: WHITE,
    fontFace: "Sakkal Majalla", align: "right", rtlMode: true,
    valign: "top",
  });
  slide6.addText("النتائج المتوقعة (Outcomes)", {
    x: 0.5, y: 3.3, w: 9, h: 0.4,
    fontSize: 14, bold: true, color: BRAND_LIGHT_BLUE,
    fontFace: "Sakkal Majalla", align: "right", rtlMode: true,
  });
  slide6.addText(formState.fields.outcome1 || "لم يتم الإدخال", {
    x: 0.5, y: 3.7, w: 9, h: 1.5,
    fontSize: 11, color: WHITE,
    fontFace: "Sakkal Majalla", align: "right", rtlMode: true,
    valign: "top",
  });
  // AI Models count + Transform %
  slide6.addShape(pptx.ShapeType.roundRect, {
    x: 0.5, y: 5.5, w: 4, h: 1.2,
    fill: { color: "0F1B30" }, line: { color: BRAND_LIGHT_BLUE, width: 1 }, rectRadius: 0.08,
  });
  slide6.addText(formState.fields.aiModelsCount || "0", {
    x: 0.5, y: 5.55, w: 4, h: 0.7,
    fontSize: 28, bold: true, color: BRAND_LIGHT_BLUE,
    fontFace: "Sakkal Majalla", align: "center",
  });
  slide6.addText("عدد نماذج الذكاء الاصطناعي المتوقعة", {
    x: 0.5, y: 6.2, w: 4, h: 0.4,
    fontSize: 9, color: "AAAAAA",
    fontFace: "Sakkal Majalla", align: "center", rtlMode: true,
  });

  slide6.addShape(pptx.ShapeType.roundRect, {
    x: 5.5, y: 5.5, w: 4, h: 1.2,
    fill: { color: "0F1B30" }, line: { color: BRAND_GOLD, width: 1 }, rectRadius: 0.08,
  });
  slide6.addText(`${formState.fields.transformPct || "0"}%`, {
    x: 5.5, y: 5.55, w: 4, h: 0.7,
    fontSize: 28, bold: true, color: BRAND_GOLD,
    fontFace: "Sakkal Majalla", align: "center",
  });
  slide6.addText("نسبة التحول المستهدفة", {
    x: 5.5, y: 6.2, w: 4, h: 0.4,
    fontSize: 9, color: "AAAAAA",
    fontFace: "Sakkal Majalla", align: "center", rtlMode: true,
  });

  // ===== Slide 7: البرنامج الزمني =====
  const slide7 = addBrandedSlide(pptx, "القسم 6: البرنامج الزمني للتنفيذ");
  const timelineHeaders: PptxGenJS.TableRow = [
    { text: "المرحلة", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, align: "center" } },
    { text: "الفترة", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, align: "center" } },
    { text: "الأنشطة", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, align: "center" } },
  ];
  const timelineData: PptxGenJS.TableRow[] = [timelineHeaders];
  PHASES.forEach((phase, idx) => {
    const entries = formState.phaseEntries[idx] || [{ desc: "", startDate: "", endDate: "" }];
    const bgColor = idx % 2 === 0 ? "1A2744" : "0F1B30";
    const activities = entries.map(e => e.desc).filter(Boolean).join(" | ") || "—";
    timelineData.push([
      { text: phase.title, options: { color: WHITE, fill: { color: bgColor }, fontSize: 9 } },
      { text: phase.date, options: { color: "AAAAAA", fill: { color: bgColor }, fontSize: 9, align: "center" } },
      { text: activities, options: { color: WHITE, fill: { color: bgColor }, fontSize: 9 } },
    ]);
  });
  slide7.addTable(timelineData, {
    x: 0.3, y: 1.2, w: 9.4, fontSize: 10, fontFace: "Sakkal Majalla",
    border: { type: "solid", pt: 0.5, color: "2A4060" },
    colW: [2.5, 2.5, 4.4],
    align: "right",
  } as any);

  // ===== Slide 8: الإطلاقات =====
  const slide8 = addBrandedSlide(pptx, "القسم 7: خطة الإطلاقات والإعلانات");
  const launchHeaders: PptxGenJS.TableRow = [
    { text: "#", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, align: "center" } },
    { text: "التاريخ", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, align: "center" } },
    { text: "الوصف", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, align: "center" } },
  ];
  const launchData: PptxGenJS.TableRow[] = [launchHeaders];
  (formState.launches || []).forEach((launch, idx) => {
    const bgColor = idx % 2 === 0 ? "1A2744" : "0F1B30";
    launchData.push([
      { text: String(idx + 1), options: { color: WHITE, fill: { color: bgColor }, align: "center" } },
      { text: launch.date || "", options: { color: WHITE, fill: { color: bgColor }, align: "center" } },
      { text: launch.desc || "", options: { color: WHITE, fill: { color: bgColor } } },
    ]);
  });
  slide8.addTable(launchData, {
    x: 0.5, y: 1.2, w: 9, fontSize: 11, fontFace: "Sakkal Majalla",
    border: { type: "solid", pt: 0.5, color: "2A4060" },
    colW: [0.6, 2, 6.4],
    align: "right",
  } as any);

  // ===== Slide 9: فريق العمل =====
  const slide9 = addBrandedSlide(pptx, "القسم 8: فريق عمل الجهة الاتحادية");
  const teamHeaders2: PptxGenJS.TableRow = [
    { text: "#", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, align: "center" } },
    { text: "الاسم", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, align: "center" } },
    { text: "المسمى الوظيفي", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, align: "center" } },
    { text: "الإدارة", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, align: "center" } },
    { text: "المجال المسؤول", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, align: "center" } },
  ];
  const teamData: PptxGenJS.TableRow[] = [teamHeaders2];
  (formState.tables.tblTeam || [{}]).forEach((row, idx) => {
    const bgColor = idx % 2 === 0 ? "1A2744" : "0F1B30";
    teamData.push([
      { text: String(idx + 1), options: { color: WHITE, fill: { color: bgColor }, align: "center" } },
      { text: row.name || "", options: { color: WHITE, fill: { color: bgColor } } },
      { text: row.role || "", options: { color: WHITE, fill: { color: bgColor } } },
      { text: row.dept || "", options: { color: WHITE, fill: { color: bgColor } } },
      { text: row.area || "", options: { color: WHITE, fill: { color: bgColor } } },
    ]);
  });
  slide9.addTable(teamData, {
    x: 0.3, y: 1.2, w: 9.4, fontSize: 10, fontFace: "Sakkal Majalla",
    border: { type: "solid", pt: 0.5, color: "2A4060" },
    colW: [0.5, 2.2, 2.2, 2.2, 2.3],
    align: "right",
  } as any);

  // ===== Slide 10: منسقو المسارات =====
  const slide10 = addBrandedSlide(pptx, "القسم 9: منسقو المسارات");
  const coordHeaders2: PptxGenJS.TableRow = [
    { text: "المسار", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, align: "center" } },
    { text: "اسم المنسق", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, align: "center" } },
    { text: "البريد الإلكتروني", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, align: "center" } },
    { text: "الهاتف", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, align: "center" } },
  ];
  const coordData: PptxGenJS.TableRow[] = [coordHeaders2];
  (formState.tables.tblCoord || TRACKS.map(() => ({}))).forEach((row, idx) => {
    const bgColor = idx % 2 === 0 ? "1A2744" : "0F1B30";
    coordData.push([
      { text: TRACKS[idx] || "", options: { color: WHITE, fill: { color: bgColor }, bold: true } },
      { text: row.name || "", options: { color: WHITE, fill: { color: bgColor } } },
      { text: row.email || "", options: { color: WHITE, fill: { color: bgColor } } },
      { text: row.phone || "", options: { color: WHITE, fill: { color: bgColor } } },
    ]);
  });
  slide10.addTable(coordData, {
    x: 0.3, y: 1.2, w: 9.4, fontSize: 10, fontFace: "Sakkal Majalla",
    border: { type: "solid", pt: 0.5, color: "2A4060" },
    colW: [3, 2.5, 2.5, 1.4],
    align: "right",
  } as any);

  // ===== End slide =====
  const endSlide = pptx.addSlide();
  endSlide.background = { color: BRAND_DARK };
  endSlide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: "100%", h: 0.12,
    fill: { color: BRAND_LIGHT_BLUE },
  });
  endSlide.addText("شكراً لكم", {
    x: 0, y: 2.5, w: "100%", h: 1,
    fontSize: 36, bold: true, color: WHITE,
    fontFace: "Sakkal Majalla", align: "center", rtlMode: true,
  });
  endSlide.addText("وزارة شؤون مجلس الوزراء\nحكومة دولة الإمارات العربية المتحدة", {
    x: 0, y: 3.8, w: "100%", h: 1,
    fontSize: 14, color: "888888",
    fontFace: "Sakkal Majalla", align: "center", rtlMode: true,
  });
  endSlide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 7.38, w: "100%", h: 0.12,
    fill: { color: BRAND_GOLD },
  });

  // Export
  pptx.writeFile({ fileName: `خطة-عمل-${entity}-مسار-${trackId}.pptx` });
}

// Export all tracks in one PowerPoint file
export function exportAllTracksToPptx() {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "وزارة شؤون مجلس الوزراء";
  pptx.subject = "خطة العمل الشاملة - جميع المسارات";

  // Cover slide
  const coverSlide = pptx.addSlide();
  coverSlide.background = { color: BRAND_DARK };
  coverSlide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: "100%", h: 0.12, fill: { color: BRAND_GOLD },
  });
  // AI Logo
  coverSlide.addImage({ path: AI_LOGO, x: 6.5, y: 0.3, w: 3.5, h: 1.2 });
  coverSlide.addText("وزارة شؤون مجلس الوزراء", {
    x: 0.5, y: 1.5, w: "90%", h: 0.6,
    fontSize: 16, color: BRAND_GOLD, fontFace: "Sakkal Majalla", align: "center", rtlMode: true,
  } as PptxGenJS.TextPropsOptions);
  coverSlide.addText("مشروع الذكاء الاصطناعي المساعد", {
    x: 0.5, y: 2.2, w: "90%", h: 0.8,
    fontSize: 28, bold: true, color: WHITE, fontFace: "Sakkal Majalla", align: "center", rtlMode: true,
  } as PptxGenJS.TextPropsOptions);
  coverSlide.addText("خطة العمل الشاملة - جميع المسارات", {
    x: 0.5, y: 3.2, w: "90%", h: 0.6,
    fontSize: 20, color: BRAND_LIGHT_BLUE, fontFace: "Sakkal Majalla", align: "center", rtlMode: true,
  } as PptxGenJS.TextPropsOptions);
  coverSlide.addText(`تاريخ التصدير: ${new Date().toLocaleDateString("ar-AE")}`, {
    x: 0.5, y: 4.2, w: "90%", h: 0.5,
    fontSize: 12, color: "888888", fontFace: "Sakkal Majalla", align: "center", rtlMode: true,
  } as PptxGenJS.TextPropsOptions);
  coverSlide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 7.38, w: "100%", h: 0.12, fill: { color: BRAND_GOLD },
  });

  // Summary slide
  const summarySlide = addBrandedSlide(pptx, "ملخص جميع المسارات");
  const summaryTableRows: PptxGenJS.TableRow[] = [
    [
      { text: "#", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, fontSize: 10, align: "center" } },
      { text: "المسار", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, fontSize: 10, align: "center" } },
      { text: "الجهة", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, fontSize: 10, align: "center" } },
      { text: "إجمالي المهام", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, fontSize: 10, align: "center" } },
      { text: "القابلة للتحول", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, fontSize: 10, align: "center" } },
      { text: "المستهدفة", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, fontSize: 10, align: "center" } },
    ],
  ];

  TRACKS.forEach((trackName, idx) => {
    const trackId = idx + 1;
    const key = `workplan_track_${trackId}_v2`;
    const raw = localStorage.getItem(key);
    let entity = "-", total = "0", eligible = "0", targeted = "0";
    if (raw) {
      try {
        const data = JSON.parse(raw);
        entity = data.fields?.entityName || "-";
        const tblOps = data.tables?.tblOps || [];
        total = String(tblOps.filter((r: TableRow) => r.taskName?.trim()).length);
        eligible = String(tblOps.filter((r: TableRow) => r.eligibility === "قابل كلياً" || r.eligibility === "قابل جزئياً").length);
        targeted = String(tblOps.filter((r: TableRow) => r.transformPriority === "نعم").length);
      } catch { /* skip */ }
    }
    const bgColor = idx % 2 === 0 ? LIGHT_GRAY : WHITE;
    summaryTableRows.push([
      { text: String(trackId), options: { fontSize: 9, align: "center", fill: { color: bgColor } } },
      { text: trackName, options: { fontSize: 9, align: "center", fill: { color: bgColor } } },
      { text: entity, options: { fontSize: 9, align: "center", fill: { color: bgColor } } },
      { text: total, options: { fontSize: 9, align: "center", fill: { color: bgColor } } },
      { text: eligible, options: { fontSize: 9, align: "center", fill: { color: bgColor } } },
      { text: targeted, options: { fontSize: 9, align: "center", fill: { color: bgColor } } },
    ]);
  });

  summarySlide.addTable(summaryTableRows, {
    x: 0.5, y: 1.5, w: 12.3, h: 3,
    border: { type: "solid", pt: 0.5, color: "CCCCCC" },
    colW: [0.5, 3.5, 3, 1.8, 1.8, 1.7],
    fontSize: 9, fontFace: "Sakkal Majalla",
  } as unknown as PptxGenJS.TableProps);

  // Per-track detail slides
  TRACKS.forEach((trackName, idx) => {
    const trackId = idx + 1;
    const key = `workplan_track_${trackId}_v2`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as FormState;
      const fields = data.fields || {};
      const tables = data.tables || {};

      // Track title slide
      const titleSlide = addBrandedSlide(pptx, `مسار ${trackId}: ${trackName}`);
      titleSlide.addText(fields.entityName || "الجهة الاتحادية", {
        x: 0.5, y: 2, w: 12.3, h: 0.5,
        fontSize: 14, color: BRAND_GOLD, fontFace: "Sakkal Majalla", align: "center", rtlMode: true,
      } as PptxGenJS.TextPropsOptions);

      // General info slide
      const infoSlide = addBrandedSlide(pptx, `مسار ${trackId} - المعلومات العامة`);
      const infoRows: PptxGenJS.TableRow[] = [
        [{ text: "الحقل", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, fontSize: 10 } }, { text: "القيمة", options: { bold: true, color: WHITE, fill: { color: BRAND_BLUE }, fontSize: 10 } }],
        [{ text: "الجهة الاتحادية", options: { fontSize: 10, fill: { color: LIGHT_GRAY } } }, { text: fields.entityName || "", options: { fontSize: 10, fill: { color: LIGHT_GRAY } } }],
        [{ text: "اسم معد الخطة", options: { fontSize: 10 } }, { text: fields.planAuthor || "", options: { fontSize: 10 } }],
        [{ text: "البريد الإلكتروني", options: { fontSize: 10, fill: { color: LIGHT_GRAY } } }, { text: fields.email || "", options: { fontSize: 10, fill: { color: LIGHT_GRAY } } }],
        [{ text: "تاريخ البدء", options: { fontSize: 10 } }, { text: fields.startDate || "", options: { fontSize: 10 } }],
        [{ text: "تاريخ الانتهاء", options: { fontSize: 10, fill: { color: LIGHT_GRAY } } }, { text: fields.endDate || "", options: { fontSize: 10, fill: { color: LIGHT_GRAY } } }],
      ];
      infoSlide.addTable(infoRows, {
        x: 1, y: 1.5, w: 11, h: 3,
        border: { type: "solid", pt: 0.5, color: "CCCCCC" },
        colW: [3, 8], fontSize: 10, fontFace: "Sakkal Majalla",
      } as unknown as PptxGenJS.TableProps);

      // Section 4 summary
      const tblOps = tables.tblOps || [];
      const total = tblOps.filter((r: TableRow) => r.taskName?.trim()).length;
      const eligible = tblOps.filter((r: TableRow) => r.eligibility === "قابل كلياً" || r.eligibility === "قابل جزئياً").length;
      const targeted = tblOps.filter((r: TableRow) => r.transformPriority === "نعم").length;

      const s4Slide = addBrandedSlide(pptx, `مسار ${trackId} - ملخص المهام`);
      s4Slide.addText(`إجمالي المهام: ${total}`, {
        x: 1, y: 2, w: 3.5, h: 0.8,
        fontSize: 16, bold: true, color: WHITE, fontFace: "Sakkal Majalla", align: "center", rtlMode: true,
        fill: { color: BRAND_BLUE },
      } as PptxGenJS.TextPropsOptions);
      s4Slide.addText(`القابلة للتحول: ${eligible}`, {
        x: 5, y: 2, w: 3.5, h: 0.8,
        fontSize: 16, bold: true, color: WHITE, fontFace: "Sakkal Majalla", align: "center", rtlMode: true,
        fill: { color: BRAND_LIGHT_BLUE },
      } as PptxGenJS.TextPropsOptions);
      s4Slide.addText(`المستهدفة خلال عامين: ${targeted}`, {
        x: 9, y: 2, w: 3.5, h: 0.8,
        fontSize: 16, bold: true, color: WHITE, fontFace: "Sakkal Majalla", align: "center", rtlMode: true,
        fill: { color: BRAND_GOLD },
      } as PptxGenJS.TextPropsOptions);

      // Outputs & Outcomes
      if (fields.outputs || fields.outcomes) {
        const outSlide = addBrandedSlide(pptx, `مسار ${trackId} - المخرجات والنتائج`);
        let yPos = 1.8;
        if (fields.outputs) {
          outSlide.addText("المخرجات المتوقعة:", { x: 0.5, y: yPos, w: 12, h: 0.4, fontSize: 12, bold: true, color: BRAND_GOLD, fontFace: "Sakkal Majalla", rtlMode: true } as PptxGenJS.TextPropsOptions);
          outSlide.addText(fields.outputs, { x: 0.5, y: yPos + 0.5, w: 12, h: 1.2, fontSize: 10, color: WHITE, fontFace: "Sakkal Majalla", rtlMode: true } as PptxGenJS.TextPropsOptions);
          yPos += 2;
        }
        if (fields.aiModelsCount) {
          outSlide.addText(`عدد نماذج الذكاء الاصطناعي المتوقعة: ${fields.aiModelsCount}`, { x: 0.5, y: yPos, w: 12, h: 0.4, fontSize: 11, color: BRAND_LIGHT_BLUE, fontFace: "Sakkal Majalla", rtlMode: true } as PptxGenJS.TextPropsOptions);
          yPos += 0.6;
        }
        if (fields.outcomes) {
          outSlide.addText("النتائج المتوقعة:", { x: 0.5, y: yPos, w: 12, h: 0.4, fontSize: 12, bold: true, color: BRAND_GOLD, fontFace: "Sakkal Majalla", rtlMode: true } as PptxGenJS.TextPropsOptions);
          outSlide.addText(fields.outcomes, { x: 0.5, y: yPos + 0.5, w: 12, h: 1.2, fontSize: 10, color: WHITE, fontFace: "Sakkal Majalla", rtlMode: true } as PptxGenJS.TextPropsOptions);
        }
      }
    } catch { /* skip track */ }
  });

  // Closing slide
  const endSlide = pptx.addSlide();
  endSlide.background = { color: BRAND_DARK };
  endSlide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: "100%", h: 0.12, fill: { color: BRAND_GOLD },
  });
  endSlide.addText("شكراً لكم", {
    x: 0.5, y: 2.5, w: "90%", h: 1,
    fontSize: 32, bold: true, color: WHITE, fontFace: "Sakkal Majalla", align: "center", rtlMode: true,
  } as PptxGenJS.TextPropsOptions);
  endSlide.addText("وزارة شؤون مجلس الوزراء — حكومة دولة الإمارات العربية المتحدة", {
    x: 0.5, y: 4, w: "90%", h: 0.5,
    fontSize: 14, color: "888888", fontFace: "Sakkal Majalla", align: "center", rtlMode: true,
  } as PptxGenJS.TextPropsOptions);
  endSlide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 7.38, w: "100%", h: 0.12, fill: { color: BRAND_GOLD },
  });

  // Export
  pptx.writeFile({ fileName: `خطة-عمل-شاملة-جميع-المسارات-${new Date().toLocaleDateString("ar-AE")}.pptx` });
}

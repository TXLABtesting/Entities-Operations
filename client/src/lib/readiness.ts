/**
 * Agentification Readiness Engine
 * ================================
 * Pure, deterministic analysis of a captured work-plan. It answers the question
 * the team keeps asking manually: "is this information complete and clear enough
 * to actually agentify these operations/services/projects — or do we need to go
 * back to the entity and ask for more?"
 *
 * It is aligned with the platform's existing prioritization algorithm, whose
 * factors are: volume, effort, impact, data, api(system), risk -> total -> level.
 * Those factors map onto the form fields as follows:
 *   volume   <- usageIntensity        effort <- complexityLevel
 *   impact   <- impactLevel           data   <- readiness + eligibility
 *   api      <- automationLevel/System risk   <- (NOT captured by the form today)
 *
 * The engine therefore checks that every field the algorithm needs is present
 * and internally consistent, and additionally flags the things a human reviewer
 * would otherwise have to chase: vague wording, missing process steps, inputs/
 * outputs, data sources, templates, archiving and risk/exception handling.
 *
 * This module is React-free so it can be unit-tested and reused by the AI
 * adapter (aiReview.ts), which sends these structured findings to the internal
 * AI API for natural-language enrichment.
 */

export type Severity = "blocker" | "warning" | "suggestion";

export type FindingCategory =
  | "completeness" // a required field is missing
  | "agentReadiness" // present but not enough to build an agent
  | "clarity" // ambiguous wording that needs a concrete rule/criteria
  | "consistency" // values contradict each other / the algorithm
  | "artifacts"; // missing supporting pieces (templates, archiving, data source...)

export interface Finding {
  id: string;
  category: FindingCategory;
  severity: Severity;
  title: string; // short Arabic headline
  detail: string; // actionable Arabic guidance
  location?: string; // e.g. "العملية 3: إصدار التصاريح"
}

export interface SectionReadiness {
  id: string;
  name: string;
  score: number; // 0-100
  findings: Finding[];
}

export interface ReadinessReport {
  overallScore: number; // 0-100
  ready: boolean; // >= READY_THRESHOLD and no blockers
  counts: { blocker: number; warning: number; suggestion: number };
  sections: SectionReadiness[];
  findings: Finding[]; // flattened, blocker-first
  summary: string; // deterministic Arabic summary (AI may replace this)
}

// ---- Minimal shape of the form state the engine reads ------------------------
export interface PlanState {
  fields: Record<string, string>;
  tables: Record<string, Array<Record<string, string>>>;
}

export const READY_THRESHOLD = 85;

const SEVERITY_PENALTY: Record<Severity, number> = {
  blocker: 34,
  warning: 12,
  suggestion: 4,
};

// Vague verbs/nouns that cannot be agentified until the concrete rule is given.
// Mix of Arabic government wording and common English terms.
const AMBIGUOUS_TERMS: { term: RegExp; label: string }[] = [
  { term: /\b(validate|validation)\b/i, label: "validate" },
  { term: /\b(verify|verification)\b/i, label: "verify" },
  { term: /\b(review|approve|approval)\b/i, label: "review/approve" },
  { term: /\b(process|handle|manage)\b/i, label: "process/handle" },
  { term: /(التحقق|يتحقق|التحقّق)/, label: "التحقق" },
  { term: /(التدقيق|يدقق|تدقيق)/, label: "التدقيق" },
  { term: /(المراجعة|يراجع|مراجعة)/, label: "المراجعة" },
  { term: /(الاعتماد|يعتمد|اعتماد)/, label: "الاعتماد" },
  { term: /(المعالجة|يعالج|معالجة)/, label: "المعالجة" },
  { term: /(المتابعة|يتابع|متابعة)/, label: "المتابعة" },
  { term: /(التنسيق|ينسق|تنسيق)/, label: "التنسيق" },
  { term: /(عند الحاجة|حسب الأصول|الإجراءات المتبعة)/, label: "عبارة عامة" },
];

// Supporting artifacts the team should not have to ask about after the fact.
const ARTIFACT_CHECKS: { id: string; re: RegExp; title: string; detail: string }[] = [
  {
    id: "inputs",
    re: /(مدخل|input|بيانات الدخل|المتطلبات)/i,
    title: "أضِف مدخلات العملية",
    detail: "حدّد المستندات أو البيانات اللازمة لبدء العملية.",
  },
  {
    id: "outputs",
    re: /(مخرج|output|نتيجة|الناتج)/i,
    title: "أضِف مخرجات العملية",
    detail: "حدّد الناتج النهائي: قرار، مستند، أو إشعار.",
  },
  {
    id: "dataSource",
    re: /(مصدر البيانات|قاعدة بيانات|نظام|database|system|api|تكامل)/i,
    title: "حدّد مصدر البيانات أو النظام",
    detail: "اذكر النظام أو واجهة التكامل (API) المرتبطة بالعملية.",
  },
  {
    id: "templates",
    re: /(نموذج|قالب|template|استمارة)/i,
    title: "أرفِق النماذج أو القوالب",
    detail: "إن استخدمت العملية قوالب موحّدة، أشِر إليها.",
  },
  {
    id: "archiving",
    re: /(أرشف|الأرشفة|حفظ السجل|توثيق|سجل)/i,
    title: "وضّح آلية الأرشفة",
    detail: "كيف تُحفظ نتائج العملية وسجلّاتها؟",
  },
  {
    id: "risk",
    re: /(مخاطر|استثناء|حالة خاصة|تصعيد|risk|exception)/i,
    title: "حدّد المخاطر والاستثناءات",
    detail: "اذكر الحالات الاستثنائية ومتى يتم التصعيد لموظف.",
  },
];

const num = (v?: string) => {
  if (!v) return NaN;
  const n = parseFloat(String(v).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : NaN;
};
const filled = (v?: string) => !!v && v.trim() !== "";
const isOther = (v?: string) => (v || "").trim() === "أخرى";

function scoreFromFindings(findings: Finding[]): number {
  const penalty = findings.reduce((sum, f) => sum + SEVERITY_PENALTY[f.severity], 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

/** Analyze a single operation/service row against the algorithm's needs. */
function analyzeOperation(row: Record<string, string>, idx: number): Finding[] {
  const out: Finding[] = [];
  const name = (row.taskName || "").trim();
  const loc = `العملية ${idx + 1}${name ? `: ${name}` : ""}`;
  const add = (
    category: FindingCategory,
    severity: Severity,
    title: string,
    detail: string,
    suffix = ""
  ) => out.push({ id: `op${idx}-${category}-${suffix || title}`, category, severity, title, detail, location: loc });

  // Identity & steps -----------------------------------------------------------
  if (!filled(name)) {
    add("completeness", "blocker", "أدخل اسم العملية", "حدّد اسم العملية/الخدمة بدقة — لا أتمتة بدون تعريف.", "name");
    return out; // nothing else is meaningful without a name
  }
  if (!filled(row.subActivities)) {
    add("agentReadiness", "warning", "أضِف خطوات العملية", "اذكر الأنشطة الفرعية خطوة بخطوة — هذه ما سينفّذه الوكيل.", "steps");
  } else if (row.subActivities.trim().length < 25) {
    add("agentReadiness", "suggestion", "وسّع وصف الخطوات", "أضِف تفاصيل أوضح حتى تكون قابلة للأتمتة دون تخمين.", "stepsShort");
  }

  // Algorithm factors ----------------------------------------------------------
  const factorChecks: { key: string; label: string; factor: string }[] = [
    { key: "usageIntensity", label: "كثافة الاستخدام", factor: "volume" },
    { key: "complexityLevel", label: "مستوى التعقيد", factor: "effort" },
    { key: "impactLevel", label: "مستوى الأثر", factor: "impact" },
    { key: "readiness", label: "جاهزية التحول", factor: "data" },
    { key: "eligibility", label: "قابلية التحول", factor: "data" },
    { key: "automationLevel", label: "مستوى الأتمتة", factor: "api" },
    { key: "transformPriority", label: "أولوية التحول", factor: "priority" },
  ];
  for (const fc of factorChecks) {
    if (!filled(row[fc.key])) {
      add(
        "agentReadiness",
        "warning",
        `حدِّد «${fc.label}»`,
        `مطلوب لاحتساب جاهزية العملية للأتمتة (عامل ${fc.factor}).`,
        fc.key
      );
    } else if (isOther(row[fc.key])) {
      add("clarity", "warning", `وضّح قيمة «${fc.label}»`, `اخترت «أخرى» — اكتب القيمة الصحيحة بوضوح.`, fc.key);
    }
  }

  // System / api detail --------------------------------------------------------
  const autoLevel = (row.automationLevel || "").trim();
  if ((autoLevel === "نعم" || autoLevel === "جزئياً") && !filled(row.automationSystem)) {
    add("artifacts", "warning", "نظام الأتمتة غير مذكور", "بما أن العملية مؤتمتة (كلياً/جزئياً)، اذكر اسم النظام المستخدم وإمكانية الربط معه (API).", "system");
  }
  const autoPct = num(row.automationPct);
  if (autoLevel === "لا" && Number.isFinite(autoPct) && autoPct > 0) {
    add("consistency", "warning", "تناقض في بيانات الأتمتة", "حُدّد مستوى الأتمتة بـ«لا» بينما نسبة الأتمتة أكبر من صفر؛ صحّح أحد الحقلين.", "pct");
  }

  // Algorithm consistency ------------------------------------------------------
  const elig = (row.eligibility || "").trim();
  const ready = (row.readiness || "").trim();
  if (elig === "قابل كلياً" && ready.includes("30% فأقل")) {
    add("consistency", "warning", "تعارض بين القابلية والجاهزية", "العملية «قابلة كلياً» للتحول لكن جاهزيتها «30% فأقل»؛ وضّح سبب انخفاض الجاهزية أو صحّح التقييم.", "eligReady");
  }
  const prio = (row.transformPriority || "").trim();
  const impact = (row.impactLevel || "").trim();
  if ((prio === "عالية" || prio === "عالٍ" || prio === "عالي") && (impact === "منخفض" || impact === "منخفضة")) {
    add("consistency", "suggestion", "أولوية عالية مع أثر منخفض", "حُدّدت الأولوية «عالية» رغم أن الأثر «منخفض»؛ راجع المنطق وراء ذلك أو وضّحه.", "prioImpact");
  }
  if (elig === "غير قابل للتحول") {
    add("agentReadiness", "suggestion", "عملية غير قابلة للتحول", "صُنّفت كـ«غير قابلة للتحول»؛ اذكر السبب باختصار حتى لا يُعاد السؤال عنها لاحقاً.", "notEligible");
  }

  // Ambiguous wording in the free-text steps -----------------------------------
  const text = row.subActivities || "";
  const hits = AMBIGUOUS_TERMS.filter((t) => t.term.test(text)).map((t) => t.label);
  if (hits.length) {
    const uniq = Array.from(new Set(hits));
    add(
      "clarity",
      "warning",
      `كلمات تحتاج توضيحاً: ${uniq.join("، ")}`,
      `وردت عبارات عامة (${uniq.join("، ")}) دون معيار واضح. حدّد القاعدة الدقيقة (ما الذي يُتحقق منه؟ وفق أي شرط؟) ليتمكن الوكيل من تنفيذها آلياً.`,
      "ambiguous"
    );
  }

  // Missing supporting artifacts (only when steps exist to judge against) -------
  if (filled(row.subActivities)) {
    for (const a of ARTIFACT_CHECKS) {
      if (!a.re.test(text)) {
        out.push({ id: `op${idx}-art-${a.id}`, category: "artifacts", severity: "suggestion", title: a.title, detail: a.detail, location: loc });
      }
    }
  }

  return out;
}

/** Build the full readiness report for a plan. */
export function analyzeReadiness(plan: PlanState, opts?: { trackName?: string }): ReadinessReport {
  const sections: SectionReadiness[] = [];

  // --- Contacts / identity ----------------------------------------------------
  const contact: Finding[] = [];
  const reqContacts: { key: string; label: string }[] = [
    { key: "entity", label: "الجهة" },
    { key: "preparer", label: "مُعد النموذج" },
    { key: "email", label: "البريد الإلكتروني" },
    { key: "phone", label: "رقم الهاتف" },
  ];
  for (const c of reqContacts) {
    if (!filled(plan.fields[c.key])) {
      contact.push({ id: `contact-${c.key}`, category: "completeness", severity: "blocker", title: `«${c.label}» مطلوب`, detail: `أدخل «${c.label}» لإتمام بيانات التواصل.` });
    }
  }
  sections.push({ id: "contacts", name: "بيانات الجهة والتواصل", score: scoreFromFindings(contact), findings: contact });

  // --- Operations / services --------------------------------------------------
  const ops = (plan.tables.tblOps || []).filter((r) => filled(r.taskName) || filled(r.subActivities));
  const opFindings: Finding[] = [];
  if (ops.length === 0) {
    opFindings.push({ id: "ops-empty", category: "completeness", severity: "blocker", title: "لم تُدخل أي عملية/خدمة", detail: "أضف عملية واحدة على الأقل مع بياناتها لتقييم جاهزيتها للأتمتة." });
  } else {
    ops.forEach((row, i) => opFindings.push(...analyzeOperation(row, i)));
  }
  sections.push({ id: "operations", name: "العمليات والخدمات", score: scoreFromFindings(opFindings), findings: opFindings });

  // --- Projects & initiatives -------------------------------------------------
  const projects = (plan.tables.tblExisting || []).filter((r) => Object.values(r).some((v) => filled(v) && v !== (opts?.trackName || "")));
  const projFindings: Finding[] = [];
  if (projects.length === 0) {
    projFindings.push({ id: "proj-empty", category: "completeness", severity: "suggestion", title: "لا توجد مشاريع أو مبادرات", detail: "إن وُجدت مشاريع/مبادرات ذكاء اصطناعي قائمة أو مخطط لها، أدخلها مع حالتها والمسار المرتبط." });
  }
  sections.push({ id: "projects", name: "المشاريع والمبادرات", score: scoreFromFindings(projFindings), findings: projFindings });

  // --- Targets & expected results --------------------------------------------
  const tgt: Finding[] = [];
  if (!filled(plan.fields.outcome1) && !filled(plan.fields.output1)) {
    tgt.push({ id: "tgt-out", category: "agentReadiness", severity: "warning", title: "لم تُحدد المخرجات/النتائج", detail: "حدّد المخرجات الملموسة والنتائج المتوقعة من التحول؛ هي معيار قياس نجاح الأتمتة." });
  }
  const models = num(plan.fields.aiModelsCount);
  if (!Number.isFinite(models) || models <= 0) {
    tgt.push({ id: "tgt-models", category: "completeness", severity: "suggestion", title: "عدد نماذج الذكاء الاصطناعي = 0", detail: "أدخل العدد المتوقع لنماذج/أنظمة الذكاء الاصطناعي المساعدة الناتجة عن الخطة." });
  }
  sections.push({ id: "targets", name: "المستهدفات والنتائج", score: scoreFromFindings(tgt), findings: tgt });

  // --- Aggregate --------------------------------------------------------------
  const allFindings = sections.flatMap((s) => s.findings);
  const counts = {
    blocker: allFindings.filter((f) => f.severity === "blocker").length,
    warning: allFindings.filter((f) => f.severity === "warning").length,
    suggestion: allFindings.filter((f) => f.severity === "suggestion").length,
  };
  // Weighted overall over the substantive sections. Contacts are shared across
  // all tracks (team registration) so they must NOT inflate a track's readiness.
  const weights: Record<string, number> = { contacts: 0, operations: 3, projects: 1, targets: 1.5 };
  const wSum = sections.reduce((s, sec) => s + (weights[sec.id] ?? 1), 0) || 1;
  let overallScore = Math.round(sections.reduce((s, sec) => s + sec.score * (weights[sec.id] ?? 1), 0) / wSum);
  // A blocker means the plan is fundamentally incomplete (e.g. no operations) —
  // it can never read as "mostly ready". Hard-cap accordingly.
  if (counts.blocker > 0) overallScore = Math.min(overallScore, 15);
  else if (counts.warning > 0) overallScore = Math.min(overallScore, 78);
  const ready = overallScore >= READY_THRESHOLD && counts.blocker === 0;

  const order: Record<Severity, number> = { blocker: 0, warning: 1, suggestion: 2 };
  const flattened = [...allFindings].sort((a, b) => order[a.severity] - order[b.severity]);

  const summary = ready
    ? `النموذج جاهز للأتمتة بنسبة ${overallScore}%. لا توجد نواقص حرجة — يمكن اعتماد البيانات.`
    : `جاهزية الأتمتة ${overallScore}%. ${counts.blocker ? `${counts.blocker} نقطة حرجة و` : ""}${counts.warning} ملاحظة و${counts.suggestion} اقتراح بحاجة للمعالجة قبل الاعتماد.`;

  return { overallScore, ready, counts, sections, findings: flattened, summary };
}

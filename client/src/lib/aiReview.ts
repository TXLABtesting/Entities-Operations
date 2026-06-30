/**
 * AI enrichment for the readiness review.
 * =======================================
 * The deterministic engine (readiness.ts) guarantees algorithm-aligned coverage.
 * This adapter optionally sends that structured result + the raw plan to the
 * organization's INTERNAL AI API to:
 *   1. catch gaps the rules could not (domain nuance),
 *   2. turn vague wording into specific clarification questions, and
 *   3. produce a concise, human Arabic summary.
 *
 * Configuration (all optional — if unset, the app silently uses the
 * deterministic report so the static demo keeps working):
 *   VITE_AI_API_URL     base URL of the internal AI gateway
 *                       (e.g. https://ai.internal.gov/v1  — OpenAI-compatible)
 *   VITE_AI_API_KEY     bearer token, if the gateway requires one
 *   VITE_AI_MODEL       model id (default: "gpt-4o-mini"-style placeholder)
 *   VITE_AI_API_FORMAT  "openai" (default) | "anthropic"
 *
 * SECURITY NOTE: putting a key in VITE_* exposes it in the browser bundle. For
 * production prefer pointing VITE_AI_API_URL at a same-origin backend route that
 * holds the credential server-side. The contract below is intentionally simple
 * so it can be re-pointed at the real internal gateway by changing env only.
 */

import type { Finding, PlanState, ReadinessReport } from "./readiness";
import { analyzeReadiness } from "./readiness";

const API_URL = import.meta.env.VITE_AI_API_URL as string | undefined;
const API_KEY = import.meta.env.VITE_AI_API_KEY as string | undefined;
const MODEL = (import.meta.env.VITE_AI_MODEL as string | undefined) || "internal-default";
const FORMAT = ((import.meta.env.VITE_AI_API_FORMAT as string | undefined) || "openai").toLowerCase();

export const aiReviewEnabled = !!API_URL;

const SYSTEM_PROMPT = `أنت مدقّق جاهزية لأتمتة العمليات الحكومية ("agentification") في حكومة دولة الإمارات.
تتلقى بيانات نموذج خطة عمل لجهة اتحادية ونتائج فحص آلي مبدئي.
هدفك: الحكم على مدى كفاية ووضوح البيانات لبناء وكلاء ذكاء اصطناعي ينفّذون هذه العمليات،
بحيث لا تحتاج الجهة لأي رجوع لاحق بأسئلة إضافية. أنت من يقرّر درجة الجاهزية، لا أحد غيرك.

التزم بمنطق خوارزمية الأولوية وقيّم كل عملية على عواملها الستة:
 • الحجم (volume): كثافة الاستخدام/التكرار (usageIntensity).
 • الجهد (effort): مستوى التعقيد والخطوات اليدوية (complexityLevel, subActivities).
 • الأثر (impact): الأثر على المتعاملين/الجهة (impactLevel).
 • البيانات (data): الجاهزية وأهلية البيانات (readiness, eligibility) ومصادرها.
 • الأنظمة/الربط (api): مستوى الأتمتة الحالي والنظام المستخدم (automationLevel, automationSystem) وإمكانية الربط البرمجي.
 • المخاطر (risk): الاستثناءات والحالات الحرجة وأثر الخطأ.

افحص لكل عملية اكتمال: الخطوات التفصيلية، المدخلات، المخرجات/النتائج، مصادر البيانات، الأنظمة،
النماذج/القوالب المستخدمة، آلية الأرشفة، القواعد والاستثناءات والمخاطر.

اكتشف الصياغات العامة أو المبهمة (مثل: "التحقق"، "المراجعة"، "حسب الحاجة"، "عند الاقتضاء"، "متابعة")
وحوّلها إلى سؤال توضيحي محدّد قابل للتنفيذ (مَن؟ وفق أي قاعدة؟ ما الحد/المعيار؟).
أبلِغ صراحةً عن أي نقص في: المدخلات، المخرجات، القوالب/النماذج، الأرشفة، أو ربط الأنظمة.

أعد درجة جاهزية إجمالية من 0 إلى 100 تعكس مدى إمكانية الانطلاق بالأتمتة دون رجوع للجهة،
مع قائمة نقاط محدّدة مرتّبة بالأولوية وملخّص عربي موجز.
أعِد ردك بصيغة JSON فقط، دون أي نص خارج الـ JSON، بالشكل:
{"overallScore": 0-100, "ready": true|false, "summary": "ملخص عربي موجز",
 "findings": [{"category":"clarity","severity":"warning","title":"عنوان موجز","detail":"الإجراء المطلوب بدقة","location":"موقع الحقل/العملية"}]}
حيث category ∈ [completeness, agentReadiness, clarity, consistency, artifacts]
و severity ∈ [blocker (يمنع الاعتماد), warning (نقص مؤثر), suggestion (تحسين)].
اجعل "ready" = true فقط إذا لم يتبقَّ أي blocker وكانت الدرجة ≥ 85.`;

function buildUserPayload(plan: PlanState, base: ReadinessReport): string {
  const ops = (plan.tables.tblOps || []).filter((r) => r.taskName || r.subActivities);
  const compact = {
    contacts: { entity: plan.fields.entity, preparer: plan.fields.preparer },
    operations: ops.map((r) => ({
      name: r.taskName,
      steps: r.subActivities,
      automationLevel: r.automationLevel,
      automationSystem: r.automationSystem,
      usageIntensity: r.usageIntensity,
      complexityLevel: r.complexityLevel,
      eligibility: r.eligibility,
      readiness: r.readiness,
      transformPriority: r.transformPriority,
      impactLevel: r.impactLevel,
    })),
    targets: { output1: plan.fields.output1, outcome1: plan.fields.outcome1, aiModelsCount: plan.fields.aiModelsCount },
    automatedFindings: base.findings.map((f) => ({ severity: f.severity, title: f.title, location: f.location })),
  };
  return `بيانات النموذج ونتائج الفحص الآلي:\n${JSON.stringify(compact, null, 2)}`;
}

async function callGateway(system: string, user: string, signal?: AbortSignal): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (API_KEY) headers.Authorization = `Bearer ${API_KEY}`;

  if (FORMAT === "anthropic") {
    const res = await fetch(`${API_URL!.replace(/\/$/, "")}/messages`, {
      method: "POST",
      headers: { ...headers, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 1500, system, messages: [{ role: "user", content: user }] }),
      signal,
    });
    if (!res.ok) throw new Error(`AI gateway ${res.status}`);
    const data = await res.json();
    return data?.content?.[0]?.text ?? "";
  }

  // OpenAI-compatible (default)
  const res = await fetch(`${API_URL!.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    signal,
  });
  if (!res.ok) throw new Error(`AI gateway ${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

function parseAi(raw: string): { summary?: string; findings: Finding[]; overallScore?: number; ready?: boolean } {
  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    const json = start >= 0 ? raw.slice(start, end + 1) : raw;
    const parsed = JSON.parse(json);
    const findings: Finding[] = Array.isArray(parsed.findings)
      ? parsed.findings
          .filter((f: any) => f && f.title)
          .map((f: any, i: number) => ({
            id: `ai-${i}`,
            category: f.category || "clarity",
            severity: ["blocker", "warning", "suggestion"].includes(f.severity) ? f.severity : "suggestion",
            title: String(f.title),
            detail: String(f.detail || ""),
            location: f.location ? String(f.location) : undefined,
          }))
      : [];
    const rawScore = Number(parsed.overallScore);
    const overallScore = Number.isFinite(rawScore) ? Math.max(0, Math.min(100, Math.round(rawScore))) : undefined;
    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : undefined,
      findings,
      overallScore,
      ready: typeof parsed.ready === "boolean" ? parsed.ready : undefined,
    };
  } catch {
    return { findings: [] };
  }
}

export interface EnrichedReport extends ReadinessReport {
  aiUsed: boolean;
  aiFindings: Finding[];
}

/**
 * Run the deterministic engine, then (if configured) enrich with the internal
 * AI API. Always resolves — AI failures degrade gracefully to the rules result.
 */
export async function reviewReadiness(plan: PlanState, opts?: { trackName?: string; signal?: AbortSignal }): Promise<EnrichedReport> {
  const base = analyzeReadiness(plan, { trackName: opts?.trackName });

  if (!aiReviewEnabled) {
    return { ...base, aiUsed: false, aiFindings: [] };
  }

  try {
    const raw = await callGateway(SYSTEM_PROMPT, buildUserPayload(plan, base), opts?.signal);
    const { summary, findings, overallScore, ready } = parseAi(raw);

    // Merge AI findings, de-duplicating against rule findings by title+location.
    const seen = new Set(base.findings.map((f) => `${f.title}|${f.location || ""}`));
    const fresh = findings.filter((f) => !seen.has(`${f.title}|${f.location || ""}`));

    const order: Record<string, number> = { blocker: 0, warning: 1, suggestion: 2 };
    const merged = [...base.findings, ...fresh].sort((a, b) => order[a.severity] - order[b.severity]);
    const counts = merged.reduce(
      (c, f) => ((c[f.severity] = (c[f.severity] || 0) + 1), c),
      { blocker: 0, warning: 0, suggestion: 0 } as Record<string, number>,
    );

    // The AI is the evaluator: trust its score/verdict when present, otherwise
    // keep the deterministic engine's result as a safe fallback.
    const finalScore = overallScore ?? base.overallScore;
    const finalReady = (ready ?? base.ready) && counts.blocker === 0;

    return {
      ...base,
      findings: merged,
      counts: { blocker: counts.blocker, warning: counts.warning, suggestion: counts.suggestion },
      overallScore: finalScore,
      ready: finalReady,
      summary: summary || base.summary,
      aiUsed: true,
      aiFindings: fresh,
    };
  } catch {
    return { ...base, aiUsed: false, aiFindings: [] };
  }
}

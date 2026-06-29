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

const SYSTEM_PROMPT = `أنت مدقّق جاهزية لأتمتة العمليات الحكومية ("agentification").
تتلقى بيانات نموذج خطة عمل لجهة اتحادية ونتائج فحص آلي مبدئي.
مهمتك: التأكد من أن البيانات كافية وواضحة لبناء وكلاء ذكاء اصطناعي ينفّذون هذه العمليات،
بحيث لا نحتاج للرجوع إلى الجهة بأسئلة إضافية.
ركّز على: اكتمال خطوات العملية، وضوح القواعد (استبدل العبارات العامة مثل "التحقق/المراجعة" بسؤال محدد)،
المدخلات والمخرجات ومصادر البيانات والأنظمة، النماذج/القوالب، الأرشفة، والمخاطر/الاستثناءات.
التزم بمنطق خوارزمية الأولوية (volume, effort, impact, data, api, risk).
أعد ردك بصيغة JSON فقط بالشكل:
{"summary": "ملخص عربي موجز", "findings": [{"category":"clarity","severity":"warning","title":"...","detail":"...","location":"..."}]}
حيث category ∈ [completeness, agentReadiness, clarity, consistency, artifacts] و severity ∈ [blocker, warning, suggestion].`;

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

function parseAi(raw: string): { summary?: string; findings: Finding[] } {
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
    return { summary: typeof parsed.summary === "string" ? parsed.summary : undefined, findings };
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
    const { summary, findings } = parseAi(raw);

    // Merge AI findings, de-duplicating against rule findings by title+location.
    const seen = new Set(base.findings.map((f) => `${f.title}|${f.location || ""}`));
    const fresh = findings.filter((f) => !seen.has(`${f.title}|${f.location || ""}`));

    const order: Record<string, number> = { blocker: 0, warning: 1, suggestion: 2 };
    const merged = [...base.findings, ...fresh].sort((a, b) => order[a.severity] - order[b.severity]);

    return {
      ...base,
      findings: merged,
      summary: summary || base.summary,
      aiUsed: true,
      aiFindings: fresh,
    };
  } catch {
    return { ...base, aiUsed: false, aiFindings: [] };
  }
}

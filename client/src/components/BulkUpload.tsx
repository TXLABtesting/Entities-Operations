import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/**
 * Bulk upload of operations/services via an Excel template.
 * Download the template -> fill it -> upload -> rows are mapped back into the
 * form's tblOps and validated by the readiness reviewer before submit.
 */

// Column (Arabic header -> form field key). Order defines the template layout.
const COLUMNS: { key: string; label: string }[] = [
  { key: "taskName_type", label: "نوع العملية" },
  { key: "taskName", label: "العملية/الخدمة" },
  { key: "subActivities", label: "الأنشطة الفرعية" },
  { key: "sector", label: "الجهة الاتحادية المعنية" },
  { key: "department", label: "القطاع المعني" },
  { key: "section", label: "الإدارة المعنية" },
  { key: "relatedSection", label: "القسم المعني" },
  { key: "automationLevel", label: "مستوى الأتمتة" },
  { key: "automationPct", label: "نسبة الأتمتة %" },
  { key: "automationSystem", label: "نظام الأتمتة" },
  { key: "usageIntensity", label: "كثافة الاستخدام" },
  { key: "complexityLevel", label: "مستوى التعقيد" },
  { key: "eligibility", label: "قابلية التحول" },
  { key: "readiness", label: "جاهزية التحول" },
  { key: "transformPriority", label: "أولوية التحول" },
  { key: "impactLevel", label: "مستوى الأثر المتوقع" },
];

// Allowed values for the legend sheet (mirror of the form dropdowns).
const ALLOWED: Record<string, string[]> = {
  "نوع العملية": ["العمليات التخصصية", "عمليات الدعم المؤسسي"],
  "مستوى الأتمتة": ["نعم", "جزئياً", "لا"],
  "كثافة الاستخدام": ["منخفضة", "متوسطة", "عالية"],
  "مستوى التعقيد": ["منخفض", "متوسط", "عالٍ"],
  "قابلية التحول": ["قابل كلياً", "قابل جزئياً", "غير قابل للتحول"],
  "جاهزية التحول": [
    "الجاهزية للتحول بنسبة 80% فأكثر",
    "الجاهزية للتحول بنسبة بين 50% إلى 80%",
    "الجاهزية للتحول بنسبة بين 30% إلى 50%",
    "الجاهزية للتحول بنسبة 30% فأقل",
  ],
  "أولوية التحول": ["منخفضة", "متوسطة", "عالية"],
  "مستوى الأثر المتوقع": ["منخفض", "متوسط", "عالٍ"],
};

const EXAMPLE_ROW: Record<string, string> = {
  "نوع العملية": "العمليات التخصصية",
  "العملية/الخدمة": "إصدار التصاريح",
  "الأنشطة الفرعية": "استقبال الطلب، التحقق من المستندات وفق اللائحة رقم X، إصدار التصريح، أرشفة السجل",
  "الجهة الاتحادية المعنية": "—",
  "مستوى الأتمتة": "جزئياً",
  "نسبة الأتمتة %": "40",
  "كثافة الاستخدام": "عالية",
  "مستوى التعقيد": "متوسط",
  "قابلية التحول": "قابل كلياً",
  "جاهزية التحول": "الجاهزية للتحول بنسبة بين 50% إلى 80%",
  "أولوية التحول": "عالية",
  "مستوى الأثر المتوقع": "عالٍ",
};

const norm = (s: unknown) => String(s ?? "").replace(/\s+/g, " ").trim();

function downloadTemplate() {
  const wb = XLSX.utils.book_new();

  const headers = COLUMNS.map((c) => c.label);
  const example = COLUMNS.map((c) => EXAMPLE_ROW[c.label] ?? "");
  const ws = XLSX.utils.aoa_to_sheet([headers, example, COLUMNS.map(() => "")]);
  ws["!cols"] = COLUMNS.map((c) => ({ wch: Math.max(14, c.label.length + 4) }));
  XLSX.utils.book_append_sheet(wb, ws, "العمليات");

  // Legend sheet
  const legendRows: string[][] = [["الحقل", "القيم المسموحة"]];
  for (const [field, vals] of Object.entries(ALLOWED)) legendRows.push([field, vals.join(" | ")]);
  const wsLegend = XLSX.utils.aoa_to_sheet(legendRows);
  wsLegend["!cols"] = [{ wch: 24 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsLegend, "القيم المسموحة");

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([out], { type: "application/octet-stream" }), "قالب_العمليات.xlsx");
}

function parseWorkbook(buf: ArrayBuffer): Record<string, string>[] {
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames.find((n) => n.includes("العمليات")) || wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

  // Map Arabic headers back to field keys.
  const labelToKey = new Map(COLUMNS.map((c) => [norm(c.label), c.key]));
  const out: Record<string, string>[] = [];
  for (const r of rows) {
    const mapped: Record<string, string> = {};
    let hasValue = false;
    for (const [header, value] of Object.entries(r)) {
      const key = labelToKey.get(norm(header));
      if (!key) continue;
      const v = norm(value);
      if (v && v !== "—") {
        mapped[key] = v;
        if (key !== "sector") hasValue = true; // sector auto-fills; ignore for emptiness
      }
    }
    if (hasValue) out.push(mapped);
  }
  return out;
}

type Status = { kind: "idle" } | { kind: "error"; msg: string } | { kind: "done"; count: number };

export default function BulkUpload({ onImport, onReview, currentCount }: { onImport: (rows: Record<string, string>[]) => void; onReview: () => void; currentCount: number }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const rows = parseWorkbook(buf);
      if (rows.length === 0) {
        setPreview([]);
        setStatus({ kind: "error", msg: "لم يتم العثور على صفوف صالحة. تأكد من استخدام القالب وتعبئة عمود «العملية/الخدمة»." });
        return;
      }
      onImport(rows);
      setPreview(rows.slice(0, 6));
      setStatus({ kind: "done", count: rows.length });
    } catch {
      setStatus({ kind: "error", msg: "تعذّر قراءة الملف. يرجى رفع ملف Excel بصيغة .xlsx مطابق للقالب." });
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-5 sm:p-6 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-slate-800">الرفع المجمّع للعمليات</h3>
          <p className="text-[12px] text-slate-500 mt-0.5">أدخل عدداً كبيراً من العمليات دفعة واحدة عبر ملف Excel</p>
        </div>
      </div>

      {/* Note */}
      <div className="mx-5 sm:mx-6 mt-5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 text-[12.5px] leading-relaxed text-amber-800">
        <span className="font-bold">ملاحظة:</span> استخدم القالب المرفق فقط، وراجع ورقة «القيم المسموحة» داخله لاختيار القيم الصحيحة. بعد الرفع سيتم التحقق من جاهزية البيانات للأتمتة قبل الاعتماد.
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Step 1 — template */}
        <div>
          <p className="text-[13px] text-slate-500 mb-2"><span className="text-slate-400">الخطوة 1.</span> <span className="font-bold text-slate-700">تنزيل القالب</span></p>
          <button onClick={downloadTemplate} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-dashed border-slate-300 text-sm font-bold text-slate-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/40 transition-colors active:scale-[0.99]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 4v12m0 0l-4-4m4 4l4-4" /></svg>
            قالب Excel
          </button>
        </div>

        {/* Step 2 — dropzone */}
        <div>
          <p className="text-[13px] text-slate-500 mb-2"><span className="text-slate-400">الخطوة 2.</span> <span className="font-bold text-slate-700">رفع الملف</span></p>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileRef.current?.click(); }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
            className={`rounded-xl border-2 border-dashed px-6 py-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
              dragging ? "border-blue-400 bg-blue-50/60" : "border-slate-300 hover:border-blue-300 hover:bg-slate-50"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 13l3-3m0 0l3 3m-3-3v9" /></svg>
            </div>
            <p className="text-[14px] font-bold text-slate-700">اسحب الملف هنا أو <span className="text-blue-600">اضغط للرفع</span></p>
            <p className="text-[11.5px] text-slate-400 mt-1">ملف Excel بصيغة .xlsx حتى 10 ميجابايت</p>
            {fileName && <p className="text-[11.5px] text-slate-500 mt-2">الملف: {fileName}</p>}
          </div>

          {status.kind === "error" && (
            <p className="mt-3 text-[12.5px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{status.msg}</p>
          )}
        </div>

        {/* Result recap */}
        {status.kind === "done" && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-emerald-700">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                تم استيراد {status.count} عملية — أُضيفت إلى الجدول
              </span>
              <button onClick={onReview} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors">
                التحقق من الجاهزية
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-[12.5px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-right">
                    <th className="font-semibold py-2.5 px-3 border-b border-slate-200 w-8">#</th>
                    <th className="font-semibold py-2.5 px-3 border-b border-slate-200">العملية</th>
                    <th className="font-semibold py-2.5 px-3 border-b border-slate-200 hidden sm:table-cell">قابلية التحول</th>
                    <th className="font-semibold py-2.5 px-3 border-b border-slate-200 hidden sm:table-cell">الأولوية</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r, i) => (
                    <tr key={i} className="text-slate-700">
                      <td className="py-2.5 px-3 border-b border-slate-100 text-slate-400">{i + 1}</td>
                      <td className="py-2.5 px-3 border-b border-slate-100 font-medium">{r.taskName || "—"}</td>
                      <td className="py-2.5 px-3 border-b border-slate-100 hidden sm:table-cell">{r.eligibility || "—"}</td>
                      <td className="py-2.5 px-3 border-b border-slate-100 hidden sm:table-cell">{r.transformPriority || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {status.count > preview.length && (
                <p className="text-[11px] text-slate-400 text-center py-2 bg-slate-50/60">و{status.count - preview.length} عملية أخرى… تظهر جميعها في قسم «العمليات»</p>
              )}
            </div>
          </div>
        )}

        <p className="text-[11px] text-slate-400 text-center">
          العمليات المدخلة حالياً: <span className="font-bold text-slate-500">{currentCount}</span> — الرفع يضيف الجديد دون حذف الموجود.
        </p>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface AuditLog {
  id: string;
  actor_user_id: string;
  actor_name: string;
  actor_email: string;
  action: string;
  resource_type: string;
  resource_id: string;
  ip_address: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  "user.created": "إنشاء مستخدم",
  "user.updated": "تحديث مستخدم",
  "user.enabled": "تفعيل مستخدم",
  "user.disabled": "تعطيل مستخدم",
  "role.assigned": "تعيين دور",
  "role.removed": "إزالة دور",
  "entity.created": "إنشاء جهة",
  "entity.updated": "تحديث جهة",
  "workplan.created": "إنشاء خطة عمل",
  "workplan.updated": "تحديث خطة عمل",
  "workplan.submitted": "تقديم خطة عمل",
  "workplan.approved": "اعتماد خطة عمل",
  "workplan.rejected": "رفض خطة عمل",
  "workplan.deleted": "حذف خطة عمل",
  "initiative.created": "إنشاء مبادرة",
  "initiative.updated": "تحديث مبادرة",
  "initiative.deleted": "حذف مبادرة",
  "prioritization.created": "إنشاء أولوية",
  "prioritization.updated": "تحديث أولوية",
  "prioritization.deleted": "حذف أولوية",
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { page: String(page), limit: "30" };
      if (actionFilter && actionFilter !== "all") params.action = actionFilter;
      if (resourceFilter && resourceFilter !== "all") params.resource_type = resourceFilter;
      const res = await api.getAuditLogs(params);
      setLogs(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, resourceFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / 30);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold">سجل المراجعة (Audit Log)</h1>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="جميع الإجراءات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الإجراءات</SelectItem>
                {Object.entries(ACTION_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="جميع الموارد" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الموارد</SelectItem>
                <SelectItem value="user">مستخدم</SelectItem>
                <SelectItem value="entity">جهة</SelectItem>
                <SelectItem value="work_plan">خطة عمل</SelectItem>
                <SelectItem value="initiative">مبادرة</SelectItem>
                <SelectItem value="prioritization">أولوية</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>السجلات ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">المستخدم</TableHead>
                    <TableHead className="text-right">الإجراء</TableHead>
                    <TableHead className="text-right">نوع المورد</TableHead>
                    <TableHead className="text-right">معرف المورد</TableHead>
                    <TableHead className="text-right">IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm" dir="ltr">
                        {new Date(log.created_at).toLocaleString("ar-AE")}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{log.actor_name || "-"}</div>
                        <div className="text-xs text-muted-foreground" dir="ltr">{log.actor_email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{ACTION_LABELS[log.action] || log.action}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{log.resource_type || "-"}</TableCell>
                      <TableCell className="text-xs font-mono" dir="ltr">
                        {log.resource_id ? log.resource_id.slice(0, 8) + "..." : "-"}
                      </TableCell>
                      <TableCell className="text-xs" dir="ltr">{log.ip_address || "-"}</TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        لا توجد سجلات
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <span className="text-sm">صفحة {page} من {totalPages}</span>
                  <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

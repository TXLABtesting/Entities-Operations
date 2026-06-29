import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";

interface Entity {
  id: string;
  code: string;
  name_en: string;
  name_ar: string;
  is_active: boolean;
  created_at: string;
}

export default function EntitiesManagement() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [formCode, setFormCode] = useState("");
  const [formNameEn, setFormNameEn] = useState("");
  const [formNameAr, setFormNameAr] = useState("");

  const fetchEntities = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getEntities();
      setEntities(res.data || []);
    } catch {
      toast.error("فشل في تحميل الجهات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const handleOpenAdd = () => {
    setEditingEntity(null);
    setFormCode("");
    setFormNameEn("");
    setFormNameAr("");
    setShowDialog(true);
  };

  const handleOpenEdit = (entity: Entity) => {
    setEditingEntity(entity);
    setFormCode(entity.code);
    setFormNameEn(entity.name_en);
    setFormNameAr(entity.name_ar || "");
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formCode || !formNameEn) {
      toast.error("الرمز والاسم بالإنجليزية مطلوبان");
      return;
    }
    try {
      if (editingEntity) {
        await api.updateEntity(editingEntity.id, {
          name_en: formNameEn,
          name_ar: formNameAr || undefined,
        });
        toast.success("تم تحديث الجهة بنجاح");
      } else {
        await api.createEntity({
          code: formCode,
          name_en: formNameEn,
          name_ar: formNameAr || undefined,
        });
        toast.success("تم إنشاء الجهة بنجاح");
      }
      setShowDialog(false);
      fetchEntities();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "فشل في حفظ الجهة");
    }
  };

  const handleToggleActive = async (entity: Entity) => {
    try {
      await api.updateEntity(entity.id, { is_active: !entity.is_active });
      toast.success(entity.is_active ? "تم تعطيل الجهة" : "تم تفعيل الجهة");
      fetchEntities();
    } catch {
      toast.error("فشل في تحديث حالة الجهة");
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">إدارة الجهات الاتحادية</h1>
        <Button onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة جهة
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الجهات ({entities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الرمز</TableHead>
                  <TableHead className="text-right">الاسم بالعربية</TableHead>
                  <TableHead className="text-right">الاسم بالإنجليزية</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entities.map((entity) => (
                  <TableRow key={entity.id}>
                    <TableCell className="font-mono text-sm">{entity.code}</TableCell>
                    <TableCell className="font-medium">{entity.name_ar || "-"}</TableCell>
                    <TableCell>{entity.name_en}</TableCell>
                    <TableCell>
                      <Badge
                        className={entity.is_active ? "bg-green-600" : ""}
                        variant={entity.is_active ? "default" : "destructive"}
                        onClick={() => handleToggleActive(entity)}
                        style={{ cursor: "pointer" }}
                      >
                        {entity.is_active ? "نشطة" : "معطلة"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(entity)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {entities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      لا توجد جهات
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingEntity ? "تعديل الجهة" : "إضافة جهة جديدة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">الرمز *</label>
              <Input
                dir="ltr"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="MOF"
                disabled={!!editingEntity}
              />
            </div>
            <div>
              <label className="text-sm font-medium">الاسم بالإنجليزية *</label>
              <Input
                dir="ltr"
                value={formNameEn}
                onChange={(e) => setFormNameEn(e.target.value)}
                placeholder="Ministry of Finance"
              />
            </div>
            <div>
              <label className="text-sm font-medium">الاسم بالعربية</label>
              <Input
                value={formNameAr}
                onChange={(e) => setFormNameAr(e.target.value)}
                placeholder="وزارة المالية"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button onClick={handleSave}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

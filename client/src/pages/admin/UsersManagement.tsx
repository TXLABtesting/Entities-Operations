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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Search, UserPlus, Shield, ShieldOff, UserCog } from "lucide-react";

interface User {
  id: string;
  email: string;
  display_name: string;
  username: string;
  status: string;
  access_enabled: boolean;
  entity_id: string;
  entity_name: string;
  last_login_at: string;
  created_at: string;
  roles: { code: string; name: string }[];
}

interface Role {
  id: string;
  code: string;
  name: string;
  description: string;
}

interface Entity {
  id: string;
  name_ar: string;
  name_en: string;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAssignRole, setShowAssignRole] = useState<User | null>(null);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEntity, setNewUserEntity] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedEntity, setSelectedEntity] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.getUsers(params);
      setUsers(res.data.data || []);
    } catch (err) {
      toast.error("فشل في تحميل المستخدمين");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchUsers();
    api.getRoles().then((res) => setRoles(res.data)).catch(() => {});
    api.getEntities().then((res) => setEntities(res.data)).catch(() => {});
  }, [fetchUsers]);

  const handleEnableUser = async (userId: string) => {
    try {
      await api.enableUser(userId);
      toast.success("تم تفعيل الوصول بنجاح");
      fetchUsers();
    } catch {
      toast.error("فشل في تفعيل الوصول");
    }
  };

  const handleDisableUser = async (userId: string) => {
    try {
      await api.disableUser(userId);
      toast.success("تم تعطيل الوصول بنجاح");
      fetchUsers();
    } catch {
      toast.error("فشل في تعطيل الوصول");
    }
  };

  const handleCreateUser = async () => {
    if (!newUserEmail) {
      toast.error("البريد الإلكتروني مطلوب");
      return;
    }
    try {
      await api.createUser({
        email: newUserEmail,
        display_name: newUserName || undefined,
        entity_id: newUserEntity || undefined,
        access_enabled: true,
      });
      toast.success("تم إنشاء المستخدم بنجاح");
      setShowAddUser(false);
      setNewUserEmail("");
      setNewUserName("");
      setNewUserEntity("");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "فشل في إنشاء المستخدم");
    }
  };

  const handleAssignRole = async () => {
    if (!showAssignRole || !selectedRole) return;
    try {
      await api.assignRole(showAssignRole.id, selectedRole, selectedEntity || undefined);
      toast.success("تم تعيين الدور بنجاح");
      setShowAssignRole(null);
      setSelectedRole("");
      setSelectedEntity("");
      fetchUsers();
    } catch {
      toast.error("فشل في تعيين الدور");
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    try {
      await api.removeRole(userId, roleId);
      toast.success("تم إزالة الدور بنجاح");
      fetchUsers();
    } catch {
      toast.error("فشل في إزالة الدور");
    }
  };

  const getStatusBadge = (status: string, enabled: boolean) => {
    if (!enabled) return <Badge variant="destructive">معطل</Badge>;
    switch (status) {
      case "active": return <Badge className="bg-green-600">نشط</Badge>;
      case "pending": return <Badge variant="secondary">قيد الانتظار</Badge>;
      case "disabled": return <Badge variant="destructive">معطل</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">إدارة المستخدمين والصلاحيات</h1>
        <Button onClick={() => setShowAddUser(true)}>
          <UserPlus className="w-4 h-4 ml-2" />
          إضافة مستخدم
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالبريد الإلكتروني أو الاسم..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="جميع الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="disabled">معطل</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>المستخدمون ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">البريد الإلكتروني</TableHead>
                  <TableHead className="text-right">الجهة</TableHead>
                  <TableHead className="text-right">الأدوار</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">آخر دخول</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.display_name || "-"}</TableCell>
                    <TableCell dir="ltr" className="text-left">{user.email}</TableCell>
                    <TableCell>{user.entity_name || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {user.roles?.map((r) => (
                          <Badge key={r.code} variant="outline" className="text-xs">
                            {r.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(user.status, user.access_enabled)}</TableCell>
                    <TableCell dir="ltr" className="text-left text-sm text-muted-foreground">
                      {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString("ar-AE") : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {user.access_enabled ? (
                          <Button size="sm" variant="ghost" onClick={() => handleDisableUser(user.id)} title="تعطيل الوصول">
                            <ShieldOff className="w-4 h-4 text-red-500" />
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => handleEnableUser(user.id)} title="تفعيل الوصول">
                            <Shield className="w-4 h-4 text-green-500" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setShowAssignRole(user)} title="تعيين دور">
                          <UserCog className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا يوجد مستخدمون
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة مستخدم جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">البريد الإلكتروني *</label>
              <Input
                dir="ltr"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">الاسم</label>
              <Input
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="الاسم الكامل"
              />
            </div>
            <div>
              <label className="text-sm font-medium">الجهة</label>
              <Select value={newUserEntity} onValueChange={setNewUserEntity}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الجهة" />
                </SelectTrigger>
                <SelectContent>
                  {entities.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name_ar || e.name_en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUser(false)}>إلغاء</Button>
            <Button onClick={handleCreateUser}>إنشاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Role Dialog */}
      <Dialog open={!!showAssignRole} onOpenChange={() => setShowAssignRole(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعيين دور - {showAssignRole?.display_name || showAssignRole?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">الدور *</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name} ({r.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">الجهة (اختياري)</label>
              <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الجهات" />
                </SelectTrigger>
                <SelectContent>
                  {entities.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name_ar || e.name_en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {showAssignRole?.roles && showAssignRole.roles.length > 0 && (
              <div>
                <label className="text-sm font-medium">الأدوار الحالية:</label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {showAssignRole.roles.map((r) => (
                    <Badge key={r.code} variant="secondary" className="cursor-pointer hover:bg-red-100"
                      onClick={() => handleRemoveRole(showAssignRole.id, r.code)}>
                      {r.name} ✕
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignRole(null)}>إلغاء</Button>
            <Button onClick={handleAssignRole} disabled={!selectedRole}>تعيين</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

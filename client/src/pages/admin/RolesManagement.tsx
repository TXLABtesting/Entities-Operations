import { useState, useEffect } from "react";
import { api } from "@/lib/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Shield, Lock } from "lucide-react";

interface Permission {
  id: string;
  code: string;
  description: string;
}

interface Role {
  id: string;
  code: string;
  name: string;
  description: string;
  is_system: boolean;
  permissions: Permission[];
}

export default function RolesManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRoles()
      .then((res) => setRoles(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الأدوار والصلاحيات</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            الأدوار المتاحة ({roles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : (
            <Accordion type="multiple" className="space-y-2">
              {roles.map((role) => (
                <AccordionItem key={role.id} value={role.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="font-medium">{role.name}</span>
                      <Badge variant="outline" className="text-xs font-mono">{role.code}</Badge>
                      {role.is_system && <Badge variant="secondary" className="text-xs">نظام</Badge>}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {role.description && (
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      )}
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          الصلاحيات ({role.permissions.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {role.permissions.map((perm) => (
                            <Badge key={perm.id || perm.code} variant="outline" className="text-xs" title={perm.description}>
                              {perm.code}
                            </Badge>
                          ))}
                          {role.permissions.length === 0 && (
                            <span className="text-xs text-muted-foreground">لا توجد صلاحيات</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

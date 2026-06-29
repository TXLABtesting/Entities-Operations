import { Link, useLocation } from "wouter";
import { Users, Building2, ScrollText, Shield, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { path: "/admin/users", label: "المستخدمون", icon: Users },
  { path: "/admin/entities", label: "الجهات", icon: Building2 },
  { path: "/admin/roles", label: "الأدوار والصلاحيات", icon: Shield },
  { path: "/admin/audit", label: "سجل المراجعة", icon: ScrollText },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen bg-background" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 border-l bg-card flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">لوحة الإدارة</h2>
          <p className="text-xs text-muted-foreground mt-1">إدارة النظام والمستخدمين</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link key={item.path} href={item.path}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer",
                  location === item.path
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t">
          <Link href="/">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer">
              <ArrowRight className="w-4 h-4" />
              <span>العودة للرئيسية</span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

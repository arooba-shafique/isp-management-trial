import { Link, useRoute, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Package, CreditCard, MessageSquare,
  Megaphone, LogOut, Wifi, MapPin, Menu, X
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/packages", label: "Packages", icon: Package },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: Wifi },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/complaints", label: "Complaints", icon: MessageSquare },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/zones", label: "Zones", icon: MapPin },
];

function NavLink({ href, label, Icon, onClick }: { href: string; label: string; Icon: typeof LayoutDashboard; onClick?: () => void }) {
  const [isActive] = useRoute(href);
  return (
    <Link href={href} onClick={onClick}>
      <div className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}>
        <Icon size={16} />
        <span>{label}</span>
      </div>
    </Link>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
  if (window.confirm("Are you sure you want to sign out?")) {
    logout();
    navigate("/login");
  }
}

  const Sidebar = ({ onNav }: { onNav?: () => void }) => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Wifi size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-sidebar-foreground">NetLink ISP</div>
            <div className="text-xs text-sidebar-foreground/60">Admin Panel</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <NavLink key={href} href={href} label={label} Icon={Icon} onClick={onNav} />
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="px-3 py-2 mb-2">
          <div className="text-xs font-medium text-sidebar-foreground">{user?.name}</div>
          <div className="text-xs text-sidebar-foreground/60">{user?.phone}</div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full transition-colors">
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-60 flex-col bg-sidebar border-r border-sidebar-border flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative w-60 h-full bg-sidebar flex flex-col">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-sidebar-foreground">
              <X size={20} />
            </button>
            <Sidebar onNav={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b bg-white">
          <button onClick={() => setMobileOpen(true)} className="text-foreground">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Wifi size={16} className="text-primary" />
            <span className="text-sm font-bold">NetLink ISP</span>
          </div>
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

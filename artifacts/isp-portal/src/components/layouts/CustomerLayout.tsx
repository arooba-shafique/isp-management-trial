import { Link, useRoute, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Package, MessageSquare, LogOut, Wifi, Menu, X, User } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/packages", label: "Packages", icon: Package },
  { href: "/complaints", label: "Support", icon: MessageSquare },
];

function NavLink({ href, label, Icon, onClick }: { href: string; label: string; Icon: typeof LayoutDashboard; onClick?: () => void }) {
  const [isActive] = useRoute(href);
  return (
    <Link href={href} onClick={onClick}>
      <div className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}>
        <Icon size={16} />
        <span>{label}</span>
      </div>
    </Link>
  );
}

export function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
  if (window.confirm("Are you sure you want to sign out?")) {
    logout();
    navigate("/login");
  }
}

  const SidebarContent = ({ onNav }: { onNav?: () => void }) => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Wifi size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold">NetLink ISP</div>
            <div className="text-xs text-muted-foreground">Customer Portal</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <NavLink key={href} href={href} label={label} Icon={Icon} onClick={onNav} />
        ))}
      </nav>
      <div className="px-3 py-4 border-t">
        <div className="flex items-center gap-2 px-3 py-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
            <User size={14} className="text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium truncate">{user?.name}</div>
            <div className="text-xs text-muted-foreground">{user?.phone}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground w-full transition-colors">
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="hidden md:flex w-56 flex-col border-r bg-card flex-shrink-0">
        <SidebarContent />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative w-56 h-full bg-card flex flex-col border-r">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-foreground">
              <X size={20} />
            </button>
            <SidebarContent onNav={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b bg-card">
          <button onClick={() => setMobileOpen(true)}>
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

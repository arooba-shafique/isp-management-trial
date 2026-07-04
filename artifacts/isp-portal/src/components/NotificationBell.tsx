import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, Wifi, CreditCard, MessageSquare, UserPlus, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

const typeIcons: Record<string, typeof Bell> = {
  new_customer: UserPlus,
  new_payment: CreditCard,
  payment_verified: CheckCheck,
  payment_rejected: X,
  new_complaint: MessageSquare,
  complaint_updated: MessageSquare,
};

const typeColors: Record<string, string> = {
  new_customer: "text-blue-500",
  new_payment: "text-amber-500",
  payment_verified: "text-emerald-500",
  payment_rejected: "text-red-500",
  new_complaint: "text-purple-500",
  complaint_updated: "text-purple-500",
};

interface NotificationItem {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  relatedId: number | null;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE}/api/notifications`).then(r => r.json()).then(d => {
      setNotifications(d.notifications);
      setUnreadCount(d.unreadCount);
    });
  }, [user]);

  useEffect(() => {
    if (!user || !open) return;
    const interval = setInterval(() => {
      fetch(`${API_BASE}/api/notifications`).then(r => r.json()).then(d => {
        setNotifications(d.notifications);
        setUnreadCount(d.unreadCount);
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [user, open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function markAllRead() {
    await fetch(`${API_BASE}/api/notifications/read-all`, { method: "POST" });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  function getRelativeTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4.5 h-4.5 text-[10px] font-bold text-white bg-red-500 rounded-full min-w-[18px] min-h-[18px] leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border rounded-xl shadow-lg z-50 max-h-[480px] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              notifications.map(n => {
                const Icon = typeIcons[n.type] || Bell;
                return (
                  <div key={n.id} className={cn("flex gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-accent/50 transition-colors cursor-pointer", !n.read && "bg-primary/5")}>
                    <div className={cn("mt-0.5", typeColors[n.type] || "text-muted-foreground")}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm", !n.read && "font-semibold")}>{n.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">{getRelativeTime(n.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

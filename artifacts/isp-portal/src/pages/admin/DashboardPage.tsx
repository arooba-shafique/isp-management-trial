import { useGetDashboardStats, useGetExpiringSoon, useGetOverdueCustomers, useGetPackageDistribution, getGetDashboardStatsQueryKey, getGetExpiringSoonQueryKey, getGetOverdueCustomersQueryKey, getGetPackageDistributionQueryKey } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Users, DollarSign, AlertTriangle, Clock, MessageSquare, CreditCard, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Link } from "wouter";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

function StatCard({ title, value, subtitle, icon: Icon, color }: { title: string; value: string | number; subtitle?: string; icon: typeof Users; color: string }) {
  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground font-medium">{title}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });
  const { data: expiring = [] } = useGetExpiringSoon({ query: { queryKey: getGetExpiringSoonQueryKey() } });
  const { data: overdue = [] } = useGetOverdueCustomers({ query: { queryKey: getGetOverdueCustomersQueryKey() } });
  const { data: distribution = [] } = useGetPackageDistribution({ query: { queryKey: getGetPackageDistributionQueryKey() } });

  if (statsLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const s = stats as { totalActiveCustomers: number; totalCustomers: number; monthlyRevenue: number; totalOutstandingDues: number; pendingPayments: number; openComplaints: number } | null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">NetLink ISP — Overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Active Customers" value={s?.totalActiveCustomers ?? 0} subtitle={`of ${s?.totalCustomers ?? 0} total`} icon={Users} color="bg-primary" />
        <StatCard title="Monthly Revenue" value={`Rs. ${(s?.monthlyRevenue ?? 0).toLocaleString()}`} subtitle="This month (verified)" icon={DollarSign} color="bg-emerald-500" />
        <StatCard title="Pending Payments" value={s?.pendingPayments ?? 0} subtitle="Awaiting verification" icon={CreditCard} color="bg-amber-500" />
        <StatCard title="Open Complaints" value={s?.openComplaints ?? 0} subtitle="Needs attention" icon={MessageSquare} color="bg-red-500" />
        <StatCard title="Expiring Soon" value={(expiring as unknown[]).length} subtitle="Next 7 days" icon={Clock} color="bg-orange-500" />
        <StatCard title="Overdue" value={(overdue as unknown[]).length} subtitle="Past due date" icon={AlertTriangle} color="bg-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Package Distribution */}
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-primary" />
            <h2 className="font-semibold">Package Distribution</h2>
          </div>
          {(distribution as unknown[]).length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No active subscriptions</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={distribution as Array<{ packageName: string; customerCount: number }>} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="customerCount">
                    {(distribution as Array<{ packageName: string }>).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => [`${val} customers`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 flex-1">
                {(distribution as Array<{ packageName: string; customerCount: number; speedMbps: number }>).map((d, i) => (
                  <div key={d.packageName} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="truncate max-w-[120px]">{d.packageName}</span>
                    </div>
                    <span className="font-medium ml-2">{d.customerCount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Expiring Soon */}
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-orange-500" />
              <h2 className="font-semibold">Expiring in 7 Days</h2>
            </div>
            <Link href="/admin/customers" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {(expiring as unknown[]).length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">No customers expiring soon</div>
          ) : (
            <div className="divide-y max-h-56 overflow-y-auto">
              {(expiring as Array<{ customerId: number; customerName: string; customerPhone: string; zone?: string | null; packageName: string; endDate: string; daysLeft?: number | null }>).map(c => (
                <div key={c.customerId} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{c.customerName}</div>
                    <div className="text-xs text-muted-foreground">{c.customerPhone} &middot; {c.packageName}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-medium text-orange-600">{c.daysLeft !== null && c.daysLeft !== undefined ? `${c.daysLeft}d left` : c.endDate}</div>
                    <div className="text-xs text-muted-foreground">{c.endDate}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overdue */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b">
          <AlertTriangle size={16} className="text-red-500" />
          <h2 className="font-semibold">Overdue Customers</h2>
          <span className="ml-auto text-xs text-muted-foreground">{(overdue as unknown[]).length} customers</span>
        </div>
        {(overdue as unknown[]).length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">No overdue customers</div>
        ) : (
          <div className="divide-y max-h-64 overflow-y-auto">
            {(overdue as Array<{ customerId: number; customerName: string; customerPhone: string; zone?: string | null; packageName: string; endDate: string; daysLeft?: number | null }>).map(c => (
              <div key={c.customerId} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{c.customerName}</div>
                  <div className="text-xs text-muted-foreground">{c.customerPhone} &middot; {c.zone ?? "No zone"}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-red-600">{c.packageName}</div>
                  <div className="text-xs text-muted-foreground">Due: {c.endDate}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

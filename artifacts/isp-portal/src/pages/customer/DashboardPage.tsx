import { useAuth } from "@/contexts/AuthContext";
import { useListSubscriptions, useListPayments, useListComplaints, useCreateSubscription, useRenewSubscription, useSwitchPackage } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Wifi, CreditCard, MessageSquare, Calendar, Package, RefreshCw, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function CustomerDashboard() {
  const { user } = useAuth();

  const { data: subscriptions = [], isLoading: subsLoading } = useListSubscriptions(
    undefined,
    { query: { queryKey: ["subscriptions", "customer"] } }
  );
  const { data: payments = [] } = useListPayments(undefined, { query: { queryKey: ["payments", "customer"] } });
  const { data: complaints = [] } = useListComplaints(undefined, { query: { queryKey: ["complaints", "customer"] } });

  const activeSub = subscriptions.find((s: { status: string }) => s.status === "active") ?? 
  subscriptions.find((s: { status: string }) => s.status === "pending-payment");
  const recentPayments = [...payments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  if (subsLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold">Welcome, {user?.name}</h1>
        <p className="text-sm text-muted-foreground">{user?.phone} &mdash; {user?.zone ?? "No zone set"}</p>
      </div>

      {/* Current Subscription */}
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Wifi size={18} className="text-primary" />
          <h2 className="font-semibold">Current Subscription</h2>
        </div>
        {activeSub ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">{(activeSub as { package?: { name?: string } }).package?.name ?? "—"}</div>
                <div className="text-sm text-muted-foreground">{(activeSub as { package?: { speedMbps?: number } }).package?.speedMbps ?? "—"} Mbps</div>
              </div>
              <StatusBadge status={activeSub.status} />
            </div>
            {activeSub.endDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar size={14} />
                <span>Expires: <strong className="text-foreground">{new Date(activeSub.endDate).toLocaleDateString()}</strong></span>
              </div>
            )}
           {activeSub.status === "pending-payment" && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2 mt-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />
                Payment pending verification for <strong>{(activeSub as { package?: { name?: string } }).package?.name ?? "this package"}</strong>. Please wait for admin approval.
              </div>
            )}
        
          </div>
        ) : (
          <div className="text-center py-6">
            <Package size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No active subscription</p>
            <Link href="/packages">
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                Browse Packages
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-primary">{payments.length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Payments</div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-amber-500">{payments.filter((p: { status: string }) => p.status === "pending").length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Pending</div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-emerald-500">{complaints.filter((c: { status: string }) => c.status !== "resolved").length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Open Issues</div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white border rounded-xl shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-primary" />
            <h2 className="font-semibold">Recent Payments</h2>
          </div>
          <Link href="/payments" className="text-xs text-primary hover:underline">View all</Link>
        </div>
        {recentPayments.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">No payments yet</div>
        ) : (
          <div className="divide-y">
            {recentPayments.map((p: { id: number; amount: number; status: string; createdAt: string; packageName?: string | null }) => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Rs. {Number(p.amount).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</div>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/complaints">
          <button className="w-full flex items-center gap-3 bg-white border rounded-xl p-4 shadow-sm hover:bg-accent transition-colors text-left">
            <MessageSquare size={20} className="text-primary" />
            <div>
              <div className="text-sm font-medium">Report Issue</div>
              <div className="text-xs text-muted-foreground">Submit a complaint</div>
            </div>
          </button>
        </Link>
        <Link href="/packages">
          <button className="w-full flex items-center gap-3 bg-white border rounded-xl p-4 shadow-sm hover:bg-accent transition-colors text-left">
            <Package size={20} className="text-primary" />
            <div>
              <div className="text-sm font-medium">View Packages</div>
              <div className="text-xs text-muted-foreground">Browse & subscribe</div>
            </div>
          </button>
        </Link>
      </div>
    </div>
  );
}

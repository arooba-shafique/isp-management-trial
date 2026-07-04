import { useQueryClient } from "@tanstack/react-query";
import { useListCustomers, useListPackages, getListCustomersQueryKey, getListPackagesQueryKey } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Search, Plus, Upload, Filter } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

type Customer = {
  id: number; phone: string; name: string; status: string;
  zone?: string | null; address?: string | null; createdAt: string;
  currentPackageName?: string | null; subscriptionStatus?: string | null;
  subscriptionEndDate?: string | null; hasPendingPayment: boolean;
};

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [zone, setZone] = useState("");
  const [status, setStatus] = useState("");

  const { data: customers = [], isLoading } = useListCustomers(
    { search: search || undefined, zone: zone || undefined, status: status || undefined },
    { query: { queryKey: getListCustomersQueryKey({ search, zone, status }) } }
  );

  const zones = [...new Set((customers as Customer[]).map(c => c.zone).filter(Boolean))];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold">Customers</h1>
          <p className="text-sm text-muted-foreground">{(customers as Customer[]).length} total</p>
        </div>
        <div className="sm:ml-auto flex gap-2">
          <Link href="/admin/customers/import">
            <button className="flex items-center gap-2 border px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors">
              <Upload size={14} /> Import
            </button>
          </Link>
          <Link href="/admin/customers/new">
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus size={14} /> Add Customer
            </button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or phone..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending-claim">Pending Claim</option>
        </select>
        <select value={zone} onChange={e => setZone(e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">All Zones</option>
          {zones.map(z => <option key={z} value={z!}>{z}</option>)}
        </select>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : (customers as Customer[]).length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">No customers found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Zone</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Package</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Expiry</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(customers as Customer[]).map(c => (
                  <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{c.zone ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{c.currentPackageName ?? "—"}</div>
                      {c.hasPendingPayment && <div className="text-xs text-amber-600 font-medium">Pending payment</div>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.subscriptionStatus ?? c.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                      {c.subscriptionEndDate ? new Date(c.subscriptionEndDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/customers/${c.id}`}>
                        <button className="text-xs text-primary hover:underline">View</button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import { useQueryClient } from "@tanstack/react-query";
import { useCreateCustomer, useListPackages, getListCustomersQueryKey, getListPackagesQueryKey } from "@workspace/api-client-react";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function AddCustomerPage() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { data: packages = [] } = useListPackages({ query: { queryKey: getListPackagesQueryKey() } });
  const create = useCreateCustomer();

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [zone, setZone] = useState("");
  const [packageId, setPackageId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!phone || !name) { setError("Phone and name are required"); return; }
    try {
      await create.mutateAsync({ data: { phone, name, address: address || undefined, zone: zone || undefined, packageId: packageId ? Number(packageId) : undefined, dueDate: dueDate || undefined } });
      await qc.invalidateQueries({ queryKey: getListCustomersQueryKey() });
      navigate("/admin/customers");
    } catch (e: unknown) {
      const err = e as { data?: { error?: string }; message?: string };
      setError(err?.data?.error ?? err?.message ?? "Failed to add customer");
    }
  }

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/customers")} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Add Customer</h1>
          <p className="text-sm text-muted-foreground">Manually add a new customer</p>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone Number *</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="03XX-XXXXXXX" className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Full Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Customer name" className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Address</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Street / Mohalla" className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Zone</label>
              <input type="text" value={zone} onChange={e => setZone(e.target.value)} placeholder="e.g. Zone A" className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Assign Package</label>
              <select value={packageId} onChange={e => setPackageId(e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">No package</option>
                {(packages as Array<{ id: number; name: string; speedMbps: number }>).map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.speedMbps} Mbps</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Customer will be created with "Pending Claim" status. They can activate their account by entering OTP and setting a password.</p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={create.isPending} className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              {create.isPending ? "Adding..." : "Add Customer"}
            </button>
            <button type="button" onClick={() => navigate("/admin/customers")} className="px-4 border rounded-lg text-sm hover:bg-accent transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

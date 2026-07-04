import { useQueryClient } from "@tanstack/react-query";
import { useListPackages, useCreatePackage, useUpdatePackage, useDeletePackage, getListPackagesQueryKey } from "@workspace/api-client-react";
import { Plus, Edit, Trash2, X, Wifi, Zap } from "lucide-react";
import { useState } from "react";

type Pkg = { id: number; name: string; speedMbps: number; price: number; validity: string; description?: string | null; isActive: boolean; createdAt: string };

const validityOpts = ["monthly", "quarterly", "yearly"] as const;

function PackageForm({ initial, onSave, onCancel, loading }: {
  initial?: Partial<Pkg>; onSave: (data: Omit<Pkg, "id" | "createdAt">) => void; onCancel: () => void; loading: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [speed, setSpeed] = useState(String(initial?.speedMbps ?? ""));
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [validity, setValidity] = useState<string>(initial?.validity ?? "monthly");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !speed || !price) { setError("Name, speed, and price are required"); return; }
    onSave({ name, speedMbps: Number(speed), price: Number(price), validity, description: desc || null, isActive });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Package Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Basic 5Mbps" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Speed (Mbps)</label>
          <input type="number" value={speed} onChange={e => setSpeed(e.target.value)} placeholder="5" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Price (Rs.)</label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="1500" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Validity</label>
          <select value={validity} onChange={e => setValidity(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            {validityOpts.map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1.5">Description (optional)</label>
          <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Any extra details" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded" />
          <label htmlFor="isActive" className="text-sm">Active (visible to customers)</label>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {loading ? "Saving..." : "Save Package"}
        </button>
        <button type="button" onClick={onCancel} className="px-4 border rounded-lg text-sm hover:bg-accent transition-colors">Cancel</button>
      </div>
    </form>
  );
}

export default function AdminPackages() {
  const qc = useQueryClient();
  const { data: packages = [], isLoading } = useListPackages({ query: { queryKey: getListPackagesQueryKey() } });
  const create = useCreatePackage();
  const update = useUpdatePackage();
  const deletePkg = useDeletePackage();
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  async function handleCreate(data: Omit<Pkg, "id" | "createdAt">) {
    await create.mutateAsync({ data: { ...data, validity: data.validity as "monthly" | "quarterly" | "yearly", description: data.description ?? undefined } });
    await qc.invalidateQueries({ queryKey: getListPackagesQueryKey() });
    setShowCreate(false);
  }

  async function handleUpdate(id: number, data: Partial<Pkg>) {
    await update.mutateAsync({ id, data: { ...data, validity: data.validity as "monthly" | "quarterly" | "yearly" | undefined, description: data.description ?? undefined } });
    await qc.invalidateQueries({ queryKey: getListPackagesQueryKey() });
    setEditId(null);
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this package?")) return;
    await deletePkg.mutateAsync({ id });
    await qc.invalidateQueries({ queryKey: getListPackagesQueryKey() });
  }

  const validityLabel = (v: string) => ({ monthly: "Monthly", quarterly: "Quarterly", yearly: "Yearly" }[v] ?? v);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Internet Packages</h1>
          <p className="text-sm text-muted-foreground">{(packages as Pkg[]).length} packages</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus size={14} /> New Package
        </button>
      </div>

      {showCreate && (
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">New Package</h2>
            <button onClick={() => setShowCreate(false)}><X size={18} className="text-muted-foreground" /></button>
          </div>
          <PackageForm onSave={handleCreate} onCancel={() => setShowCreate(false)} loading={create.isPending} />
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid gap-4">
          {(packages as Pkg[]).map(pkg => (
            <div key={pkg.id} className={`bg-white border rounded-xl shadow-sm overflow-hidden ${!pkg.isActive ? "opacity-60" : ""}`}>
              {editId === pkg.id ? (
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold">Edit Package</h2>
                    <button onClick={() => setEditId(null)}><X size={18} className="text-muted-foreground" /></button>
                  </div>
                  <PackageForm initial={pkg} onSave={data => handleUpdate(pkg.id, data)} onCancel={() => setEditId(null)} loading={update.isPending} />
                </div>
              ) : (
                <div className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Wifi size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{pkg.name}</span>
                      {!pkg.isActive && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>}
                    </div>
                    {pkg.description && <p className="text-sm text-muted-foreground">{pkg.description}</p>}
                    <div className="flex gap-4 mt-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Zap size={12} className="text-amber-500" />
                        <span>{pkg.speedMbps} Mbps</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{validityLabel(pkg.validity)}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xl font-bold">Rs. {Number(pkg.price).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditId(pkg.id)} className="p-2 rounded-lg hover:bg-accent transition-colors">
                      <Edit size={14} className="text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(pkg.id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {(packages as Pkg[]).length === 0 && <div className="text-center py-12 text-sm text-muted-foreground">No packages yet</div>}
        </div>
      )}
    </div>
  );
}

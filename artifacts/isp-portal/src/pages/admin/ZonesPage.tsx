import { useQueryClient } from "@tanstack/react-query";
import { useListZones, useCreateZone, useUpdateZone, useDeleteZone, getListZonesQueryKey } from "@workspace/api-client-react";
import { MapPin, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { useState } from "react";

type Zone = { id: number; name: string; description?: string | null; createdAt: string };

export default function AdminZonesPage() {
  const qc = useQueryClient();
  const { data: zones = [], isLoading } = useListZones({ query: { queryKey: getListZonesQueryKey() } });
  const createZone = useCreateZone();
  const updateZone = useUpdateZone();
  const deleteZone = useDeleteZone();

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Zone name is required"); return; }
    try {
      await createZone.mutateAsync({ data: { name: name.trim(), description: description.trim() || undefined } });
      await qc.invalidateQueries({ queryKey: getListZonesQueryKey() });
      setName(""); setDescription(""); setShowAdd(false);
    } catch (err: unknown) {
      const e = err as { data?: { error?: string }; message?: string };
      setError(e?.data?.error ?? e?.message ?? "Failed to create zone");
    }
  }

  function startEdit(zone: Zone) {
    setEditId(zone.id);
    setEditName(zone.name);
    setEditDesc(zone.description ?? "");
  }

  async function handleUpdate(id: number) {
    if (!editName.trim()) return;
    try {
      await updateZone.mutateAsync({ id, data: { name: editName.trim(), description: editDesc.trim() || undefined } });
      await qc.invalidateQueries({ queryKey: getListZonesQueryKey() });
      setEditId(null);
    } catch (err: unknown) {
      const e = err as { data?: { error?: string }; message?: string };
      setError(e?.data?.error ?? e?.message ?? "Failed to update zone");
    }
  }

  async function handleDelete(id: number) {
    setDeleting(id);
    try {
      await deleteZone.mutateAsync({ id });
      await qc.invalidateQueries({ queryKey: getListZonesQueryKey() });
    } finally {
      setDeleting(null);
    }
  }

  const zoneList = zones as Zone[];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Zones</h1>
          <p className="text-sm text-muted-foreground">Define coverage zones — customers select their zone on registration</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setError(""); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} />
          Add Zone
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
          <h2 className="font-semibold text-sm">New Zone</h2>
          <div>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">Zone Name *</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Zone A — Sahiwal City"
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">Description (optional)</label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Coverage area, landmarks, streets…"
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={createZone.isPending} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {createZone.isPending ? "Saving…" : "Save Zone"}
            </button>
            <button type="button" onClick={() => { setShowAdd(false); setName(""); setDescription(""); setError(""); }} className="px-4 border rounded-lg text-sm hover:bg-accent">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : zoneList.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <MapPin size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No zones yet — add your first zone above</p>
          </div>
        ) : (
          <div className="divide-y">
            {zoneList.map(zone => (
              <div key={zone.id} className="px-5 py-4">
                {editId === zone.id ? (
                  <div className="space-y-2">
                    <input
                      value={editName} onChange={e => setEditName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                    <textarea
                      value={editDesc} onChange={e => setEditDesc(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdate(zone.id)} disabled={updateZone.isPending} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-50">
                        <Check size={12} /> Save
                      </button>
                      <button onClick={() => setEditId(null)} className="flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs hover:bg-accent">
                        <X size={12} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5 flex-shrink-0">
                        <MapPin size={14} className="text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{zone.name}</div>
                        {zone.description && <div className="text-xs text-muted-foreground mt-0.5">{zone.description}</div>}
                        <div className="text-xs text-muted-foreground mt-0.5">Added {new Date(zone.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => startEdit(zone)} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(zone.id)}
                        disabled={deleting === zone.id}
                        className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

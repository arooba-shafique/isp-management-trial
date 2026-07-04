import { cn } from "@/lib/utils";

const configs: Record<string, { label: string; className: string }> = {
  // subscription / user status
  active:           { label: "Active",          className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  suspended:        { label: "Suspended",        className: "bg-red-100 text-red-800 border-red-200" },
  "pending-claim":  { label: "Pending Claim",    className: "bg-amber-100 text-amber-800 border-amber-200" },
  "pending-payment":{ label: "Pending Payment",  className: "bg-amber-100 text-amber-800 border-amber-200" },
  expired:          { label: "Expired",          className: "bg-gray-100 text-gray-600 border-gray-200" },
  // payment
  pending:          { label: "Pending",          className: "bg-amber-100 text-amber-800 border-amber-200" },
  verified:         { label: "Verified",         className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  rejected:         { label: "Rejected",         className: "bg-red-100 text-red-800 border-red-200" },
  // complaints
  open:             { label: "Open",             className: "bg-red-100 text-red-800 border-red-200" },
  "in-progress":    { label: "In Progress",      className: "bg-amber-100 text-amber-800 border-amber-200" },
  resolved:         { label: "Resolved",         className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = configs[status] ?? { label: status, className: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border", cfg.className)}>
      {cfg.label}
    </span>
  );
}

import { Router, type IRouter } from "express";
import { eq, and, lte, gte } from "drizzle-orm";
import { db, usersTable, subscriptionsTable, paymentsTable, packagesTable, complaintsTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dashboard/stats", requireAdmin, async (req, res): Promise<void> => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

  const allCustomers = await db.select().from(usersTable).where(eq(usersTable.role, "customer"));
  const totalCustomers = allCustomers.length;
  const activeCustomers = allCustomers.filter(c => c.status === "active").length;

  const allSubscriptions = await db.select().from(subscriptionsTable);
  const allPayments = await db.select().from(paymentsTable);

  const verifiedPaymentsThisMonth = allPayments.filter(p =>
    p.status === "verified" && p.verifiedAt && p.verifiedAt.toISOString().split("T")[0] >= monthStart
  );
  const monthlyRevenue = verifiedPaymentsThisMonth.reduce((sum, p) => sum + Number(p.amount), 0);

  const pendingPayments = allPayments.filter(p => p.status === "pending").length;

  const activeSubscriptions = allSubscriptions.filter(s => s.status === "active");
  const overdueSubscriptions = activeSubscriptions.filter(s => {
    if (!s.endDate) return false;
    return new Date(s.endDate) < now;
  });
  const overdueCustomerIds = new Set(overdueSubscriptions.map(s => s.customerId));
  const totalOutstandingDues = overdueCustomerIds.size * 0;

  const openComplaints = (await db.select().from(complaintsTable).where(eq(complaintsTable.status, "open"))).length;

  res.json({
    totalActiveCustomers: activeCustomers,
    totalCustomers,
    monthlyRevenue,
    totalOutstandingDues,
    pendingPayments,
    openComplaints,
  });
});

router.get("/dashboard/expiring-soon", requireAdmin, async (req, res): Promise<void> => {
  const now = new Date();
  const sevenDaysLater = new Date(now);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  const nowStr = now.toISOString().split("T")[0];
  const futureStr = sevenDaysLater.toISOString().split("T")[0];

  const subs = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.status, "active"));
  const expiring = subs.filter(s => s.endDate && s.endDate >= nowStr && s.endDate <= futureStr);

  const result = await Promise.all(expiring.map(async sub => {
    const [cust] = await db.select().from(usersTable).where(eq(usersTable.id, sub.customerId));
    const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, sub.packageId));
    const daysLeft = sub.endDate ? Math.ceil((new Date(sub.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
    return {
      customerId: sub.customerId,
      customerName: cust?.name ?? "Unknown",
      customerPhone: cust?.phone ?? "",
      zone: cust?.zone ?? null,
      packageName: pkg?.name ?? "Unknown",
      endDate: sub.endDate ?? "",
      daysLeft,
    };
  }));

  res.json(result.sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999)));
});

router.get("/dashboard/overdue", requireAdmin, async (req, res): Promise<void> => {
  const now = new Date();
  const nowStr = now.toISOString().split("T")[0];

  const subs = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.status, "active"));
  const overdue = subs.filter(s => s.endDate && s.endDate < nowStr);

  const result = await Promise.all(overdue.map(async sub => {
    const [cust] = await db.select().from(usersTable).where(eq(usersTable.id, sub.customerId));
    const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, sub.packageId));
    const daysLeft = sub.endDate ? Math.ceil((new Date(sub.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
    return {
      customerId: sub.customerId,
      customerName: cust?.name ?? "Unknown",
      customerPhone: cust?.phone ?? "",
      zone: cust?.zone ?? null,
      packageName: pkg?.name ?? "Unknown",
      endDate: sub.endDate ?? "",
      daysLeft,
    };
  }));

  res.json(result);
});

router.get("/dashboard/package-distribution", requireAdmin, async (req, res): Promise<void> => {
  const packages = await db.select().from(packagesTable);
  const subscriptions = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.status, "active"));

  const result = packages.map(pkg => ({
    packageName: pkg.name,
    customerCount: subscriptions.filter(s => s.packageId === pkg.id).length,
    speedMbps: pkg.speedMbps,
  }));

  res.json(result.filter(r => r.customerCount > 0));
});

export default router;

import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, subscriptionsTable, packagesTable, usersTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function validityToMonths(validity: string): number {
  if (validity === "quarterly") return 3;
  if (validity === "yearly") return 12;
  return 1;
}

function formatSub(sub: typeof subscriptionsTable.$inferSelect & { package?: typeof packagesTable.$inferSelect | null, customerName?: string | null, customerPhone?: string | null }) {
  return {
    ...sub,
    createdAt: sub.createdAt.toISOString(),
    package: sub.package ? { ...sub.package, price: Number(sub.package.price), createdAt: sub.package.createdAt.toISOString() } : undefined,
  };
}

router.get("/subscriptions", requireAuth, async (req, res): Promise<void> => {
  const { customerId, status } = req.query as Record<string, string>;
  const isAdmin = req.user!.role === "admin";
  const targetCustomerId = isAdmin ? (customerId ? parseInt(customerId, 10) : undefined) : req.user!.userId;

  let query = db.select().from(subscriptionsTable).$dynamic();
  const conditions = [];
  if (targetCustomerId) conditions.push(eq(subscriptionsTable.customerId, targetCustomerId));
  if (status) conditions.push(eq(subscriptionsTable.status, status));
  if (conditions.length) query = query.where(and(...conditions));

  const subs = await query.orderBy(subscriptionsTable.createdAt);

  const result = await Promise.all(subs.map(async sub => {
    const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, sub.packageId));
    const [cust] = await db.select({ name: usersTable.name, phone: usersTable.phone }).from(usersTable).where(eq(usersTable.id, sub.customerId));
    return formatSub({ ...sub, package: pkg ?? null, customerName: cust?.name ?? null, customerPhone: cust?.phone ?? null });
  }));
  res.json(result);
});

router.post("/subscriptions", requireAuth, async (req, res): Promise<void> => {
  const { packageId } = req.body;
  if (!packageId) { res.status(400).json({ error: "packageId required" }); return; }
  const customerId = req.user!.userId;

  const [existingActive] = await db.select().from(subscriptionsTable)
    .where(and(eq(subscriptionsTable.customerId, customerId), eq(subscriptionsTable.status, "active")));
  if (existingActive) { res.status(409).json({ error: "Already have an active subscription. Please request renewal or switch." }); return; }

  const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, Number(packageId)));
  if (!pkg) { res.status(404).json({ error: "Package not found" }); return; }

  const [sub] = await db.insert(subscriptionsTable).values({
    customerId, packageId: Number(packageId), status: "pending-payment"
  }).returning();

  res.status(201).json(formatSub({ ...sub, package: { ...pkg, price: pkg.price } }));
});

router.get("/subscriptions/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.id, id));
  if (!sub) { res.status(404).json({ error: "Subscription not found" }); return; }
  if (req.user!.role !== "admin" && sub.customerId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, sub.packageId));
  const [cust] = await db.select({ name: usersTable.name, phone: usersTable.phone }).from(usersTable).where(eq(usersTable.id, sub.customerId));
  res.json(formatSub({ ...sub, package: pkg ?? null, customerName: cust?.name ?? null, customerPhone: cust?.phone ?? null }));
});

router.patch("/subscriptions/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { status, startDate, endDate } = req.body;
  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (startDate) updates.startDate = startDate;
  if (endDate) updates.endDate = endDate;

  const [sub] = await db.update(subscriptionsTable).set(updates).where(eq(subscriptionsTable.id, id)).returning();
  if (!sub) { res.status(404).json({ error: "Subscription not found" }); return; }
  const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, sub.packageId));
  res.json(formatSub({ ...sub, package: pkg ?? null }));
});

router.post("/subscriptions/:id/renew", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [existing] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Subscription not found" }); return; }
  if (req.user!.role !== "admin" && existing.customerId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const [newSub] = await db.insert(subscriptionsTable).values({
    customerId: existing.customerId, packageId: existing.packageId, status: "pending-payment"
  }).returning();
  const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, newSub.packageId));
  res.status(201).json(formatSub({ ...newSub, package: pkg ?? null }));
});

router.post("/subscriptions/:id/switch", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { newPackageId } = req.body;
  if (!newPackageId) { res.status(400).json({ error: "newPackageId required" }); return; }

  const [existing] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Subscription not found" }); return; }
  if (req.user!.role !== "admin" && existing.customerId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.update(subscriptionsTable).set({ status: "expired" }).where(eq(subscriptionsTable.id, id));

  const [newSub] = await db.insert(subscriptionsTable).values({
    customerId: existing.customerId, packageId: Number(newPackageId), status: "pending-payment"
  }).returning();
  const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, newSub.packageId));
  res.status(201).json(formatSub({ ...newSub, package: pkg ?? null }));
});

export default router;

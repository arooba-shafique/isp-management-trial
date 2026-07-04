import { Router, type IRouter } from "express";
import { eq, ilike, and, or } from "drizzle-orm";
import { db, usersTable, packagesTable, subscriptionsTable, paymentsTable, complaintsTable, notificationsTable } from "@workspace/db";
import { requireAdmin, requireAuth } from "../middlewares/auth";
import { hashPassword } from "../lib/auth";
import { notifyAdmins } from "../lib/notify";

const router: IRouter = Router();

router.get("/customers", requireAdmin, async (req, res): Promise<void> => {
  const { zone, status, search } = req.query as Record<string, string>;

  let customers = await db.select().from(usersTable).where(eq(usersTable.role, "customer"));

  if (zone) customers = customers.filter(c => c.zone === zone);
  if (status) customers = customers.filter(c => c.status === status);
  if (search) {
    const q = search.toLowerCase();
    customers = customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }

  const result = await Promise.all(customers.map(async (c) => {
    const [activeSub] = await db.select({ id: subscriptionsTable.id, status: subscriptionsTable.status, endDate: subscriptionsTable.endDate, packageId: subscriptionsTable.packageId })
      .from(subscriptionsTable).where(and(eq(subscriptionsTable.customerId, c.id), eq(subscriptionsTable.status, "active"))).limit(1);

    let currentPackageName: string | null = null;
    if (activeSub) {
      const [pkg] = await db.select({ name: packagesTable.name }).from(packagesTable).where(eq(packagesTable.id, activeSub.packageId));
      currentPackageName = pkg?.name ?? null;
    }

    const [pendingPayment] = await db.select({ id: paymentsTable.id }).from(paymentsTable)
      .where(and(eq(paymentsTable.customerId, c.id), eq(paymentsTable.status, "pending"))).limit(1);

    return {
      id: c.id, phone: c.phone, name: c.name, status: c.status, address: c.address, zone: c.zone,
      createdAt: c.createdAt.toISOString(),
      currentPackageName,
      subscriptionStatus: activeSub?.status ?? null,
      subscriptionEndDate: activeSub?.endDate ?? null,
      hasPendingPayment: !!pendingPayment,
    };
  }));

  res.json(result);
});

router.post("/customers/import", requireAdmin, async (req, res): Promise<void> => {
  const { customers } = req.body;
  if (!Array.isArray(customers)) { res.status(400).json({ error: "customers array required" }); return; }

  let imported = 0, skipped = 0;
  const errors: string[] = [];

  for (const row of customers) {
    if (!row.phone || !row.name) { errors.push(`Row missing phone or name: ${JSON.stringify(row)}`); skipped++; continue; }
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.phone, row.phone));
    if (existing) { skipped++; continue; }

    try {
      const [newUser] = await db.insert(usersTable).values({
        phone: row.phone, name: row.name, address: row.address ?? null,
        zone: row.zone ?? null, role: "customer", status: "pending-claim",
      }).returning();

      if (row.packageName && row.dueDate) {
        const [pkg] = await db.select().from(packagesTable).where(ilike(packagesTable.name, row.packageName));
        if (pkg) {
          await db.insert(subscriptionsTable).values({
            customerId: newUser.id, packageId: pkg.id, status: "active",
            startDate: new Date().toISOString().split("T")[0], endDate: row.dueDate
          });
        }
      }
      imported++;
    } catch (e) {
      errors.push(`Failed for ${row.phone}: ${String(e)}`);
      skipped++;
    }
  }

  res.json({ imported, skipped, errors });
});

router.get("/customers/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [c] = await db.select().from(usersTable).where(and(eq(usersTable.id, id), eq(usersTable.role, "customer")));
  if (!c) { res.status(404).json({ error: "Customer not found" }); return; }

  const [activeSub] = await db.select().from(subscriptionsTable).where(and(eq(subscriptionsTable.customerId, id), eq(subscriptionsTable.status, "active"))).limit(1);
  let activeSubWithPackage = null;
  if (activeSub) {
    const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, activeSub.packageId));
    activeSubWithPackage = {
      ...activeSub, package: pkg ? { ...pkg, price: Number(pkg.price), createdAt: pkg.createdAt.toISOString() } : null,
      createdAt: activeSub.createdAt.toISOString(),
    };
  }

  res.json({
    id: c.id, phone: c.phone, name: c.name, role: c.role, status: c.status,
    address: c.address, zone: c.zone, createdAt: c.createdAt.toISOString(),
    activeSubscription: activeSubWithPackage
  });
});

router.post("/customers", requireAdmin, async (req, res): Promise<void> => {
  const { phone, name, address, zone, packageId, dueDate } = req.body;
  if (!phone || !name) { res.status(400).json({ error: "phone and name required" }); return; }
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));
  if (existing) { res.status(409).json({ error: "Phone already registered" }); return; }

  const [user] = await db.insert(usersTable).values({
    phone, name, address, zone, role: "customer", status: "pending-claim"
  }).returning();

  if (packageId && dueDate) {
    await db.insert(subscriptionsTable).values({
      customerId: user.id, packageId: Number(packageId), status: "active",
      startDate: new Date().toISOString().split("T")[0], endDate: dueDate
    });
  }

  notifyAdmins("new_customer", "New Customer Added", `${name} (${phone}) was added as a customer`, user.id);

  const [activeSub] = await db.select().from(subscriptionsTable).where(and(eq(subscriptionsTable.customerId, user.id), eq(subscriptionsTable.status, "active"))).limit(1);
  let activeSubWithPackage = null;
  if (activeSub) {
    const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, activeSub.packageId));
    activeSubWithPackage = { ...activeSub, package: pkg ? { ...pkg, price: Number(pkg.price), createdAt: pkg.createdAt.toISOString() } : null, createdAt: activeSub.createdAt.toISOString() };
  }

  res.status(201).json({
    id: user.id, phone: user.phone, name: user.name, role: user.role, status: user.status,
    address: user.address, zone: user.zone, createdAt: user.createdAt.toISOString(),
    activeSubscription: activeSubWithPackage
  });
});

router.patch("/customers/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, address, zone, phone } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (address !== undefined) updates.address = address;
  if (zone !== undefined) updates.zone = zone;
  if (phone !== undefined) updates.phone = phone;

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Customer not found" }); return; }
  res.json({ id: updated.id, phone: updated.phone, name: updated.name, role: updated.role, status: updated.status, address: updated.address, zone: updated.zone, createdAt: updated.createdAt.toISOString() });
});

router.delete("/customers/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(notificationsTable).where(eq(notificationsTable.userId, id));
  await db.delete(complaintsTable).where(eq(complaintsTable.customerId, id));
  await db.delete(paymentsTable).where(eq(paymentsTable.customerId, id));
  await db.delete(subscriptionsTable).where(eq(subscriptionsTable.customerId, id));
  const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Customer not found" }); return; }
  res.json({ message: "Customer deleted", id: deleted.id, phone: deleted.phone });
});

router.post("/customers/:id/suspend", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { suspended } = req.body;
  const newStatus = suspended ? "suspended" : "active";
  const [updated] = await db.update(usersTable).set({ status: newStatus }).where(eq(usersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Customer not found" }); return; }
  res.json({ id: updated.id, phone: updated.phone, name: updated.name, role: updated.role, status: updated.status, address: updated.address, zone: updated.zone, createdAt: updated.createdAt.toISOString() });
});

export default router;

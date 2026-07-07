import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, packagesTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/packages/public", async (req, res): Promise<void> => {
  try {
    const packages = await db.select().from(packagesTable).where(eq(packagesTable.isActive, true)).orderBy(packagesTable.price);
    res.json(packages.map(p => ({
      ...p, price: Number(p.price), isActive: p.isActive, speedMbps: p.speedMbps,
      createdAt: p.createdAt.toISOString()
    })));
  } catch {
    res.json([]);
  }
});

router.get("/packages", requireAuth, async (req, res): Promise<void> => {
  try {
    const packages = await db.select().from(packagesTable).orderBy(packagesTable.price);
    res.json(packages.map(p => ({
      ...p, price: Number(p.price), isActive: p.isActive, speedMbps: p.speedMbps,
      createdAt: p.createdAt.toISOString()
    })));
  } catch {
    res.json([]);
  }
});

router.post("/packages", requireAdmin, async (req, res): Promise<void> => {
  const { name, speedMbps, price, validity, description, isActive } = req.body;
  if (!name || !speedMbps || !price || !validity) {
    res.status(400).json({ error: "name, speedMbps, price, validity required" }); return;
  }
  const [pkg] = await db.insert(packagesTable).values({
    name, speedMbps: Number(speedMbps), price: String(price), validity, description, isActive: isActive ?? true
  }).returning();
  res.status(201).json({ ...pkg, price: Number(pkg.price), createdAt: pkg.createdAt.toISOString() });
});

router.patch("/packages/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, speedMbps, price, validity, description, isActive } = req.body;

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (speedMbps !== undefined) updates.speedMbps = Number(speedMbps);
  if (price !== undefined) updates.price = String(price);
  if (validity !== undefined) updates.validity = validity;
  if (description !== undefined) updates.description = description;
  if (isActive !== undefined) updates.isActive = isActive;

  const [pkg] = await db.update(packagesTable).set(updates).where(eq(packagesTable.id, id)).returning();
  if (!pkg) { res.status(404).json({ error: "Package not found" }); return; }
  res.json({ ...pkg, price: Number(pkg.price), createdAt: pkg.createdAt.toISOString() });
});

router.delete("/packages/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [pkg] = await db.delete(packagesTable).where(eq(packagesTable.id, id)).returning();
  if (!pkg) { res.status(404).json({ error: "Package not found" }); return; }
  res.sendStatus(204);
});

export default router;

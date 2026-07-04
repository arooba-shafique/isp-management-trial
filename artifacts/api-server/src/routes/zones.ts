import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, zonesTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/zones", async (_req, res): Promise<void> => {
  const zones = await db.select().from(zonesTable).orderBy(zonesTable.name);
  res.json(zones.map(z => ({ ...z, createdAt: z.createdAt.toISOString() })));
});

router.post("/zones", requireAdmin, async (req, res): Promise<void> => {
  const { name, description } = req.body;
  if (!name?.trim()) { res.status(400).json({ error: "name required" }); return; }
  const [zone] = await db.insert(zonesTable).values({ name: name.trim(), description: description ?? null }).returning();
  res.status(201).json({ ...zone, createdAt: zone.createdAt.toISOString() });
});

router.patch("/zones/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const { name, description } = req.body;
  if (!name?.trim()) { res.status(400).json({ error: "name required" }); return; }
  const [zone] = await db.update(zonesTable).set({ name: name.trim(), description: description ?? null }).where(eq(zonesTable.id, id)).returning();
  if (!zone) { res.status(404).json({ error: "Zone not found" }); return; }
  res.json({ ...zone, createdAt: zone.createdAt.toISOString() });
});

router.delete("/zones/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  await db.delete(zonesTable).where(eq(zonesTable.id, id));
  res.status(204).end();
});

export default router;

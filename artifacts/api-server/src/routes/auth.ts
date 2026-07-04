import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import { db, usersTable, otpCodesTable } from "@workspace/db";
import { generateOtp, hashPassword, comparePassword, signToken } from "../lib/auth";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const ADMIN_PHONES = ["03496641464", "03286687112"];

// Check if phone exists
router.post("/auth/check-phone", async (req, res): Promise<void> => {
  const phone: string = (req.body.phone ?? "").trim();
  if (!phone) { res.status(400).json({ error: "Phone required" }); return; }

  if (ADMIN_PHONES.includes(phone)) {
    res.json({ type: "admin" }); return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));

  if (!user) {
    res.json({ type: "new" }); return;
  }
  if (user.status === "suspended") {
    res.status(403).json({ error: "Account suspended" }); return;
  }
  res.json({ type: "existing", needsClaim: user.status === "pending-claim" });
});

// Admin + existing user login with password
router.post("/auth/login", async (req, res): Promise<void> => {
  const phone: string = (req.body.phone ?? "").trim();
  const { password } = req.body;
  if (!phone || !password) { res.status(400).json({ error: "phone and password required" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));
  if (!user) { res.status(404).json({ error: "Phone not registered" }); return; }
  if (user.status === "suspended") { res.status(403).json({ error: "Account suspended" }); return; }

  const valid = await comparePassword(password, user.passwordHash ?? "");
  if (!valid) { res.status(401).json({ error: "Invalid password" }); return; }

  const token = signToken({ userId: user.id, role: user.role });
  res.json({ token, user: { id: user.id, phone: user.phone, name: user.name, role: user.role, status: user.status, address: user.address, zone: user.zone, createdAt: user.createdAt } });
});

// New user registration (no OTP)
router.post("/auth/register", async (req, res): Promise<void> => {
  const phone: string = (req.body.phone ?? "").trim();
  const { name, password, address, zone } = req.body;
  if (!phone || !name || !password) {
    res.status(400).json({ error: "phone, name, password required" }); return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));
  if (existing && existing.status !== "pending-claim") {
    res.status(409).json({ error: "Phone already registered" }); return;
  }

  const passwordHash = await hashPassword(password);

  let user;
  if (existing?.status === "pending-claim") {
    [user] = await db.update(usersTable).set({ passwordHash, status: "active", name, address, zone }).where(eq(usersTable.id, existing.id)).returning();
  } else {
    [user] = await db.insert(usersTable).values({ phone, name, passwordHash, role: "customer", status: "active", address, zone }).returning();
  }

  const token = signToken({ userId: user.id, role: user.role });
  res.status(201).json({ token, user: { id: user.id, phone: user.phone, name: user.name, role: user.role, status: user.status, address: user.address, zone: user.zone, createdAt: user.createdAt } });
});

// Claim account (admin-created users)
router.post("/auth/claim-account", async (req, res): Promise<void> => {
  const phone: string = (req.body.phone ?? "").trim();
  const { password } = req.body;
  if (!phone || !password) { res.status(400).json({ error: "phone and password required" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));
  if (!user) { res.status(404).json({ error: "Phone not found" }); return; }
  if (user.status !== "pending-claim") { res.status(400).json({ error: "Account already claimed" }); return; }

  const passwordHash = await hashPassword(password);
  const [updated] = await db.update(usersTable).set({ passwordHash, status: "active" }).where(eq(usersTable.id, user.id)).returning();

  const token = signToken({ userId: updated.id, role: updated.role });
  res.json({ token, user: { id: updated.id, phone: updated.phone, name: updated.name, role: updated.role, status: updated.status, address: updated.address, zone: updated.zone, createdAt: updated.createdAt } });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ id: user.id, phone: user.phone, name: user.name, role: user.role, status: user.status, address: user.address, zone: user.zone, createdAt: user.createdAt });
});

export default router;

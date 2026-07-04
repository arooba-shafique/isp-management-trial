import { eq } from "drizzle-orm";
import { db, usersTable, notificationsTable } from "@workspace/db";

export async function notifyAdmins(type: string, title: string, message: string, relatedId?: number) {
  const admins = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.role, "admin"));
  for (const admin of admins) {
    await db.insert(notificationsTable).values({ userId: admin.id, type, title, message, relatedId: relatedId ?? null });
  }
}

export async function notifyUser(userId: number, type: string, title: string, message: string, relatedId?: number) {
  await db.insert(notificationsTable).values({ userId, type, title, message, relatedId: relatedId ?? null });
}

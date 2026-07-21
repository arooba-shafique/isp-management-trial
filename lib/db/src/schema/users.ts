import { pgTable, text, serial, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  name: text("name").notNull(),
  email: text("email"),
  passwordHash: text("password_hash"),
  role: text("role").notNull().default("customer"),
  status: text("status").notNull().default("active"),
  address: text("address"),
  zone: text("zone"),
  adminId: integer("admin_id").references((): any => usersTable.id),
  trialActive: boolean("trial_active").notNull().default(false),
  trialDays: integer("trial_days").notNull().default(7),
  trialStart: timestamp("trial_start", { withTimezone: true }),
  trialEnd: timestamp("trial_end", { withTimezone: true }),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
